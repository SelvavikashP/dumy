from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import (
    CodingProblem, CodingTestCase, AssessmentAttempt,
    CodingSubmission
)
from app.schemas.schemas import (
    CodeRunRequest, CodeRunResult, CodeSubmitRequest,
    CodeSubmissionResponse
)
from app.services.code_judge import CodeJudgeService

router = APIRouter(prefix="/coding", tags=["Coding Execution & Judge"])

@router.post("/run", response_model=CodeRunResult)
async def run_code(
    req: CodeRunRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes candidate code in a sandbox. If coding_problem_id is supplied,
    runs against public sample test cases with diffs; otherwise runs against custom input.
    """
    test_cases_to_run = []
    if req.coding_problem_id:
        res = await db.execute(
            select(CodingTestCase).where(
                CodingTestCase.coding_problem_id == req.coding_problem_id,
                CodingTestCase.is_hidden == False
            )
        )
        tcs = res.scalars().all()
        for tc in tcs:
            test_cases_to_run.append({
                "input_data": tc.input_data,
                "expected_output": tc.expected_output,
                "is_hidden": False,
                "points": tc.points
            })

    if not test_cases_to_run:
        # Single execution with custom input
        res = await CodeJudgeService.execute_code(
            language=req.language,
            code=req.code,
            stdin_input=req.custom_input or "",
            time_limit_sec=3.0
        )
        return CodeRunResult(
            status=res["status"],
            stdout=res["stdout"],
            stderr=res["stderr"],
            execution_time_ms=res["execution_time_ms"],
            memory_used_mb=res["memory_used_mb"],
            sample_tests_passed=1 if res["status"] == "SUCCESS" else 0,
            sample_tests_total=1,
            test_case_results=[{
                "input": req.custom_input,
                "expected_output": "",
                "actual_output": res["stdout"],
                "status": res["status"],
                "passed": res["status"] == "SUCCESS"
            }]
        )

    # Run against sample test cases
    eval_res = await CodeJudgeService.evaluate_against_test_cases(
        language=req.language,
        code=req.code,
        test_cases=test_cases_to_run,
        time_limit_sec=2.0
    )

    first_stdout = eval_res["test_case_results"][0]["actual_output"] if eval_res["test_case_results"] else ""

    return CodeRunResult(
        status=eval_res["overall_status"],
        stdout=first_stdout,
        stderr=eval_res["error_message"],
        execution_time_ms=eval_res["max_execution_time_ms"],
        memory_used_mb=eval_res["memory_used_mb"],
        sample_tests_passed=eval_res["passed_test_cases"],
        sample_tests_total=eval_res["total_test_cases"],
        test_case_results=eval_res["test_case_results"]
    )

@router.post("/submit", response_model=CodeSubmissionResponse)
async def submit_code(
    req: CodeSubmitRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Submits code solution against ALL test cases (public + hidden) in the judge sandbox.
    Scores submission, logs audit trail, and persists result.
    """
    # Fetch attempt
    att_res = await db.execute(select(AssessmentAttempt).where(AssessmentAttempt.id == req.attempt_id))
    attempt = att_res.scalars().first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status in ["COMPLETED", "SUSPENDED", "EXPIRED"]:
        raise HTTPException(status_code=400, detail=f"Cannot submit: attempt is {attempt.status}")

    # Fetch coding problem and all test cases
    cp_res = await db.execute(select(CodingProblem).where(CodingProblem.id == req.coding_problem_id))
    cp = cp_res.scalars().first()
    if not cp:
        raise HTTPException(status_code=404, detail="Coding problem not found")

    tc_res = await db.execute(select(CodingTestCase).where(CodingTestCase.coding_problem_id == cp.id))
    all_tcs = tc_res.scalars().all()
    test_cases_payload = [
        {
            "input_data": tc.input_data,
            "expected_output": tc.expected_output,
            "is_hidden": tc.is_hidden,
            "points": tc.points
        }
        for tc in all_tcs
    ]

    eval_res = await CodeJudgeService.evaluate_against_test_cases(
        language=req.language,
        code=req.code,
        test_cases=test_cases_payload,
        time_limit_sec=cp.time_limit_seconds,
        memory_limit_mb=cp.memory_limit_mb
    )

    # Compute score
    total_possible_pts = sum(tc.points for tc in all_tcs) or 10.0
    earned_pts = sum(r["points_earned"] for r in eval_res["test_case_results"])

    submission = CodingSubmission(
        attempt_id=req.attempt_id,
        coding_problem_id=req.coding_problem_id,
        language=req.language,
        code=req.code,
        status=eval_res["overall_status"],
        passed_test_cases=eval_res["passed_test_cases"],
        total_test_cases=eval_res["total_test_cases"],
        execution_time_ms=eval_res["max_execution_time_ms"],
        memory_used_mb=eval_res["memory_used_mb"],
        score_awarded=round(earned_pts, 2),
        error_message=eval_res["error_message"],
        test_results_json=eval_res["test_case_results"]
    )
    db.add(submission)
    await db.commit()

    return CodeSubmissionResponse(
        submission_id=submission.id,
        status=submission.status,
        passed_test_cases=submission.passed_test_cases,
        total_test_cases=submission.total_test_cases,
        score_awarded=submission.score_awarded,
        execution_time_ms=submission.execution_time_ms,
        memory_used_mb=submission.memory_used_mb,
        error_message=submission.error_message,
        test_results=submission.test_results_json
    )

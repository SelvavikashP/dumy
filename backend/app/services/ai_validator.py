from typing import Dict, Any, List
from app.services.code_judge import CodeJudgeService

class AIValidatorService:
    """
    Automated validator for AI-generated and recruiter-entered questions.
    Enforces DRAFT -> REVIEW -> APPROVED -> PUBLISHED lifecycle.
    """

    @classmethod
    async def validate_question(cls, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates structure, correctness, and executable validity of a question.
        """
        q_type = question_data.get("type", "MCQ_SINGLE")
        statement = question_data.get("problem_statement", "").strip()

        if not statement:
            return {"valid": False, "status": "DRAFT", "error": "Problem statement cannot be empty"}

        if q_type in ["APTITUDE", "MCQ_SINGLE"]:
            options = question_data.get("options", [])
            if len(options) < 2:
                return {"valid": False, "status": "DRAFT", "error": "At least 2 options required"}
            correct_count = sum(1 for opt in options if opt.get("is_correct", False))
            if correct_count != 1:
                return {"valid": False, "status": "DRAFT", "error": f"Single correct question must have exactly 1 correct answer (found {correct_count})"}
            return {"valid": True, "status": "APPROVED", "error": None}

        elif q_type == "MCQ_MULTIPLE":
            options = question_data.get("options", [])
            correct_count = sum(1 for opt in options if opt.get("is_correct", False))
            if correct_count < 1:
                return {"valid": False, "status": "DRAFT", "error": "Multiple correct question must have at least 1 correct answer"}
            return {"valid": True, "status": "APPROVED", "error": None}

        elif q_type in ["CODING", "PROGRAMMING_CHALLENGE"]:
            cp = question_data.get("coding_problem", {})
            title = cp.get("title", "").strip()
            test_cases = cp.get("test_cases", [])
            ref_sol = cp.get("reference_solution", "").strip()

            if not title:
                return {"valid": False, "status": "DRAFT", "error": "Coding problem must have a title"}
            if not test_cases:
                return {"valid": False, "status": "DRAFT", "error": "Coding problem must have at least 1 test case"}

            # Automatically test reference solution against test cases if provided in Python
            if ref_sol:
                judge_res = await CodeJudgeService.evaluate_against_test_cases(
                    language="python",
                    code=ref_sol,
                    test_cases=test_cases,
                    time_limit_sec=cp.get("time_limit_seconds", 2.0)
                )
                if judge_res["passed_test_cases"] < judge_res["total_test_cases"]:
                    return {
                        "valid": False,
                        "status": "DRAFT",
                        "error": f"Reference solution failed {judge_res['total_test_cases'] - judge_res['passed_test_cases']} of {judge_res['total_test_cases']} test cases: {judge_res['error_message']}"
                    }

            return {"valid": True, "status": "APPROVED", "error": None}

        return {"valid": True, "status": "APPROVED", "error": None}

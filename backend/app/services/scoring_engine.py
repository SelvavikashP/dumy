from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import (
    AssessmentAttempt, Assessment, Question, QuestionOption,
    CandidateAnswer, CodingSubmission, CandidateResult
)

class ScoringEngineService:
    """
    Computes accurate, server-authoritative candidate scores across
    Aptitude, MCQs, and Coding Submissions with negative marking and partial test case credits.
    """

    @classmethod
    async def evaluate_attempt(
        cls,
        db: AsyncSession,
        attempt_id: str
    ) -> Dict[str, Any]:
        # Load Attempt & Assessment
        att_res = await db.execute(select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id))
        attempt = att_res.scalars().first()
        if not attempt:
            raise ValueError("Attempt not found")

        asm_res = await db.execute(select(Assessment).where(Assessment.id == attempt.assessment_id))
        assessment = asm_res.scalars().first()

        # Load all questions
        q_res = await db.execute(select(Question).where(Question.assessment_id == assessment.id))
        questions = q_res.scalars().all()

        # Load candidate answers
        ans_res = await db.execute(select(CandidateAnswer).where(CandidateAnswer.attempt_id == attempt_id))
        answers = {ans.question_id: ans for ans in ans_res.scalars().all()}

        # Load coding submissions
        sub_res = await db.execute(select(CodingSubmission).where(CodingSubmission.attempt_id == attempt_id))
        submissions = sub_res.scalars().all()
        coding_subs = {}
        for sub in submissions:
            # Keep highest score submission for each coding problem
            curr = coding_subs.get(sub.coding_problem_id)
            if not curr or sub.score_awarded > curr.score_awarded:
                coding_subs[sub.coding_problem_id] = sub

        total_score = 0.0
        max_score = 0.0
        aptitude_score = 0.0
        mcq_score = 0.0
        coding_score = 0.0
        correct_count = 0
        total_questions_attempted = 0
        skill_breakdown = {}

        for q in questions:
            q_type = q.type
            q_points = q.points
            q_neg = q.negative_points if assessment.negative_marking else 0.0
            skill = q.skill or "General"
            if skill not in skill_breakdown:
                skill_breakdown[skill] = {"earned": 0.0, "total": 0.0, "questions": 0}

            max_score += q_points
            skill_breakdown[skill]["total"] += q_points
            skill_breakdown[skill]["questions"] += 1

            if q_type in ["APTITUDE", "MCQ_SINGLE", "MCQ_MULTIPLE"]:
                ans = answers.get(q.id)
                if ans and ans.selected_options_json:
                    total_questions_attempted += 1
                    selected_set = set(ans.selected_options_json)
                    
                    # Fetch correct options for question
                    opt_res = await db.execute(select(QuestionOption).where(QuestionOption.question_id == q.id))
                    opts = opt_res.scalars().all()
                    correct_set = {opt.id for opt in opts if opt.is_correct}

                    if selected_set == correct_set:
                        ans.is_correct = True
                        ans.points_awarded = q_points
                        correct_count += 1
                        total_score += q_points
                        skill_breakdown[skill]["earned"] += q_points
                        if q_type == "APTITUDE":
                            aptitude_score += q_points
                        else:
                            mcq_score += q_points
                    else:
                        ans.is_correct = False
                        ans.points_awarded = -q_neg
                        total_score = max(0.0, total_score - q_neg)
                        if q_type == "APTITUDE":
                            aptitude_score = max(0.0, aptitude_score - q_neg)
                        else:
                            mcq_score = max(0.0, mcq_score - q_neg)
                else:
                    if ans:
                        ans.is_correct = False
                        ans.points_awarded = 0.0

            elif q_type in ["CODING", "PROGRAMMING_CHALLENGE"]:
                # Check coding submission for this problem
                # Question has 1 coding problem
                from app.models.models import CodingProblem
                cp_res = await db.execute(select(CodingProblem).where(CodingProblem.question_id == q.id))
                cp = cp_res.scalars().first()
                if cp and cp.id in coding_subs:
                    total_questions_attempted += 1
                    sub = coding_subs[cp.id]
                    earned = sub.score_awarded
                    total_score += earned
                    coding_score += earned
                    skill_breakdown[skill]["earned"] += earned
                    if sub.status == "ACCEPTED":
                        correct_count += 1

        percentage = round((total_score / max_score * 100.0), 2) if max_score > 0 else 0.0
        accuracy = round((correct_count / total_questions_attempted * 100.0), 2) if total_questions_attempted > 0 else 0.0
        passed = percentage >= assessment.passing_percentage

        # Update attempt fields
        attempt.total_score = round(total_score, 2)
        attempt.max_score = round(max_score, 2)
        attempt.percentage = percentage
        attempt.passed = passed

        # Upsert CandidateResult
        res_query = await db.execute(select(CandidateResult).where(CandidateResult.attempt_id == attempt_id))
        result_record = res_query.scalars().first()
        if not result_record:
            result_record = CandidateResult(
                attempt_id=attempt_id,
                attender_id=attempt.attender_id,
                assessment_id=assessment.id,
                total_score=round(total_score, 2),
                aptitude_score=round(aptitude_score, 2),
                mcq_score=round(mcq_score, 2),
                coding_score=round(coding_score, 2),
                accuracy_percentage=accuracy,
                passed=passed,
                recruiter_verdict="SHORTLISTED" if passed else "PENDING",
                skill_breakdown_json=skill_breakdown
            )
            db.add(result_record)
        else:
            result_record.total_score = round(total_score, 2)
            result_record.aptitude_score = round(aptitude_score, 2)
            result_record.mcq_score = round(mcq_score, 2)
            result_record.coding_score = round(coding_score, 2)
            result_record.accuracy_percentage = accuracy
            result_record.passed = passed
            result_record.skill_breakdown_json = skill_breakdown

        await db.commit()

        return {
            "total_score": round(total_score, 2),
            "max_score": round(max_score, 2),
            "percentage": percentage,
            "passed": passed,
            "aptitude_score": round(aptitude_score, 2),
            "mcq_score": round(mcq_score, 2),
            "coding_score": round(coding_score, 2),
            "accuracy_percentage": accuracy,
            "skill_breakdown": skill_breakdown
        }

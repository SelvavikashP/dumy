import asyncio
from app.core.database import init_db, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.models import (
    PortalAdmin, Company, TestCreator, CreatorPermission,
    TestAttender, Assessment, AssessmentSection, Question,
    QuestionOption, CodingProblem, CodingTestCase,
    ExternalPlatform, PlatformSetting
)

async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        print("[+] Seeding initial platform data...")

        # 1. Portal Admin
        admin = PortalAdmin(
            email="admin@assessmentportal.io",
            hashed_password=get_password_hash("Admin@12345"),
            full_name="Chief Portal Administrator",
            is_active=True
        )
        db.add(admin)

        # 2. Company
        company = Company(
            name="Apex Global Technologies",
            domain="apextech.io"
        )
        db.add(company)
        await db.flush()

        # 3. Test Creator
        creator = TestCreator(
            email="recruiter@techcorp.com",
            hashed_password=get_password_hash("Creator@12345"),
            full_name="Sarah Jenkins (Senior Talent Lead)",
            phone="+1 (555) 234-5678",
            company_id=company.id,
            is_active=True
        )
        db.add(creator)
        await db.flush()

        # Permissions
        all_perms = [
            "CREATE_ASSESSMENT", "EDIT_ASSESSMENT", "DELETE_ASSESSMENT",
            "AI_GENERATION", "CODING_PROBLEMS", "PROCTORING_CONFIGURATION",
            "VIEW_RESULTS", "EXPORT_RESULTS", "MANAGE_CANDIDATES",
            "LIVE_MONITORING", "REATTEMPT_MANAGEMENT"
        ]
        for p in all_perms:
            db.add(CreatorPermission(creator_id=creator.id, permission_key=p, is_granted=True))

        # 4. Test Attender / Candidate
        candidate = TestAttender(
            email="candidate@example.com",
            hashed_password=get_password_hash("Candidate@12345"),
            full_name="Alex Rivera",
            phone="+1 (555) 987-6543",
            resume_url="https://example.com/alex-rivera-resume.pdf",
            is_verified=True,
            is_active=True
        )
        db.add(candidate)

        # 5. External Platforms
        platforms = [
            ("Codeforces", "codeforces", True, "https://codeforces.com/api"),
            ("LeetCode", "leetcode", True, "https://leetcode.com/api"),
            ("HackerRank", "hackerrank", True, "https://www.hackerrank.com/api"),
            ("AtCoder", "atcoder", True, "https://atcoder.jp"),
            ("CodeChef", "codechef", True, "https://api.codechef.com")
        ]
        for name, slug, enabled, endpoint in platforms:
            db.add(ExternalPlatform(name=name, slug=slug, is_enabled=enabled, api_endpoint=endpoint, status="HEALTHY"))

        # 6. Global Platform Settings
        db.add(PlatformSetting(
            setting_key="global_proctoring_policy",
            setting_value_json={
                "max_warnings": 3,
                "allow_fullscreen": True,
                "allow_voice": True,
                "allow_face_detection": True,
                "auto_suspension_threshold": 3
            },
            description="Global default security and proctoring threshold limits"
        ))

        # 7. Comprehensive Seed Assessment
        assessment = Assessment(
            title="Full Stack Software Engineer Assessment (2026)",
            description="Comprehensive evaluation encompassing Quantitative Aptitude, Logical Reasoning, Database Systems, and Algorithmic Coding Challenges in an isolated sandbox.",
            company_id=company.id,
            creator_id=creator.id,
            duration_minutes=60,
            passing_percentage=65.0,
            difficulty="MEDIUM",
            status="PUBLISHED",
            instructions="• This assessment is strictly proctored with web camera, full-screen lock, and tab detection.\n• Maintain focus within the test window.\n• Coding problems must pass both public and hidden test cases within the specified CPU time limit (2.0s).\n• You may run your code against sample test cases before final submission.",
            randomize_questions=False,
            negative_marking=True,
            negative_marking_value=0.25,
            proctoring_level="STANDARD",
            camera_required=True,
            microphone_required=False,
            fullscreen_required=True,
            tab_detection_enabled=True,
            warning_limit=3,
            auto_suspension_enabled=True,
            reattempt_policy="MANUAL",
            max_reattempts=1,
            difficulty_escalation=True
        )
        db.add(assessment)
        await db.flush()

        # Section 1: Aptitude
        sec1 = AssessmentSection(
            assessment_id=assessment.id,
            title="Section 1 — Quantitative & Logical Aptitude",
            description="Analytical reasoning, time-work calculations, and data interpretation.",
            duration_minutes=20,
            section_order=1
        )
        db.add(sec1)
        await db.flush()

        q1 = Question(
            assessment_id=assessment.id,
            section_id=sec1.id,
            type="APTITUDE",
            topic="Time and Work",
            skill="Quantitative Aptitude",
            difficulty="MEDIUM",
            problem_statement="Worker A can finish a task in 12 hours, and Worker B can finish it in 15 hours. With the help of intern C, they finish the entire task in 5 hours. In how many hours can intern C alone complete the task?",
            explanation="1/A + 1/B + 1/C = 1/5 => 1/12 + 1/15 + 1/C = 1/5 => 1/C = 1/20. C takes 20 hours.",
            points=2.0,
            negative_points=0.5,
            author_id=creator.id,
            status="PUBLISHED"
        )
        db.add(q1)
        await db.flush()
        db.add(QuestionOption(question_id=q1.id, option_text="18 hours", is_correct=False, option_order=0))
        db.add(QuestionOption(question_id=q1.id, option_text="20 hours", is_correct=True, explanation="Correct: 1/12 + 1/15 + 1/20 = 1/5", option_order=1))
        db.add(QuestionOption(question_id=q1.id, option_text="22 hours", is_correct=False, option_order=2))
        db.add(QuestionOption(question_id=q1.id, option_text="24 hours", is_correct=False, option_order=3))

        q2 = Question(
            assessment_id=assessment.id,
            section_id=sec1.id,
            type="APTITUDE",
            topic="Probability",
            skill="Quantitative Aptitude",
            difficulty="MEDIUM",
            problem_statement="Two independent replicas of a database node have uptime reliabilities of 0.95 and 0.90 respectively. What is the probability that at least one replica is operational at any given instant?",
            explanation="P(At least 1 up) = 1 - (0.05 * 0.10) = 0.995 (99.5%).",
            points=2.0,
            negative_points=0.5,
            author_id=creator.id,
            status="PUBLISHED"
        )
        db.add(q2)
        await db.flush()
        db.add(QuestionOption(question_id=q2.id, option_text="0.995", is_correct=True, explanation="1 - (0.05 * 0.10) = 0.995", option_order=0))
        db.add(QuestionOption(question_id=q2.id, option_text="0.855", is_correct=False, option_order=1))
        db.add(QuestionOption(question_id=q2.id, option_text="0.950", is_correct=False, option_order=2))
        db.add(QuestionOption(question_id=q2.id, option_text="0.925", is_correct=False, option_order=3))

        # Section 2: Core CS / MCQ
        sec2 = AssessmentSection(
            assessment_id=assessment.id,
            title="Section 2 — Computer Science & System Fundamentals",
            description="Database query optimization, data structures, and architecture.",
            duration_minutes=20,
            section_order=2
        )
        db.add(sec2)
        await db.flush()

        q3 = Question(
            assessment_id=assessment.id,
            section_id=sec2.id,
            type="MCQ_SINGLE",
            topic="Database & SQL",
            skill="SQL",
            difficulty="MEDIUM",
            problem_statement="Which SQL query retrieves the second highest salary from table `Employees(id, salary)` without using vendor-specific `LIMIT` or `OFFSET` clauses?",
            explanation="SELECT MAX(salary) FROM Employees WHERE salary < (SELECT MAX(salary) FROM Employees) handles duplicates cleanly across all standard SQL engines.",
            points=2.0,
            negative_points=0.5,
            author_id=creator.id,
            status="PUBLISHED"
        )
        db.add(q3)
        await db.flush()
        db.add(QuestionOption(question_id=q3.id, option_text="SELECT MAX(salary) FROM Employees WHERE salary < (SELECT MAX(salary) FROM Employees)", is_correct=True, option_order=0))
        db.add(QuestionOption(question_id=q3.id, option_text="SELECT salary FROM Employees ORDER BY salary DESC FETCH FIRST 2 ROWS ONLY", is_correct=False, option_order=1))
        db.add(QuestionOption(question_id=q3.id, option_text="SELECT MIN(salary) FROM Employees WHERE salary > (SELECT MIN(salary) FROM Employees)", is_correct=False, option_order=2))
        db.add(QuestionOption(question_id=q3.id, option_text="SELECT salary[2] FROM Employees GROUP BY salary", is_correct=False, option_order=3))

        q4 = Question(
            assessment_id=assessment.id,
            section_id=sec2.id,
            type="MCQ_SINGLE",
            topic="Data Structures",
            skill="Algorithms",
            difficulty="EASY",
            problem_statement="What is the average and worst-case time complexity of lookup in an optimized Hash Map (with uniform distribution and open addressing)?",
            explanation="Average lookup is O(1); worst-case when all keys collide into the same bucket is O(N).",
            points=1.5,
            negative_points=0.25,
            author_id=creator.id,
            status="PUBLISHED"
        )
        db.add(q4)
        await db.flush()
        db.add(QuestionOption(question_id=q4.id, option_text="Average O(1), Worst-case O(N)", is_correct=True, option_order=0))
        db.add(QuestionOption(question_id=q4.id, option_text="Average O(log N), Worst-case O(N)", is_correct=False, option_order=1))
        db.add(QuestionOption(question_id=q4.id, option_text="Average O(1), Worst-case O(log N)", is_correct=False, option_order=2))
        db.add(QuestionOption(question_id=q4.id, option_text="Average O(N), Worst-case O(N^2)", is_correct=False, option_order=3))

        # Section 3: Coding Challenges
        sec3 = AssessmentSection(
            assessment_id=assessment.id,
            title="Section 3 — Hands-on Algorithmic Coding Challenge",
            description="Algorithmic problem solving evaluated against hidden test cases.",
            duration_minutes=20,
            section_order=3
        )
        db.add(sec3)
        await db.flush()

        q5 = Question(
            assessment_id=assessment.id,
            section_id=sec3.id,
            type="CODING",
            topic="Hash Table / Prefix Sum",
            skill="Data Structures & Algorithms",
            difficulty="MEDIUM",
            problem_statement="Given an array of integers `nums` and an integer `k`, return the total number of continuous subarrays whose sum equals to `k`.\n\nInput Format:\nLine 1: An integer N (length of array)\nLine 2: N space-separated integers\nLine 3: An integer K\n\nOutput Format:\nSingle integer representing the count of valid subarrays.",
            points=10.0,
            negative_points=0.0,
            author_id=creator.id,
            status="PUBLISHED"
        )
        db.add(q5)
        await db.flush()

        cp1 = CodingProblem(
            question_id=q5.id,
            title="Subarray Sum Equals K",
            statement="Given an array of integers `nums` and an integer `k`, return the total number of continuous subarrays whose sum equals to `k`.\n\nInput Format:\nLine 1: An integer N (length of array)\nLine 2: N space-separated integers\nLine 3: An integer K\n\nOutput Format:\nSingle integer representing the count of valid subarrays.",
            input_format="N\nnums[0] nums[1] ... nums[N-1]\nK",
            output_format="Integer count",
            constraints="1 <= N <= 2 * 10^4\n-1000 <= nums[i] <= 1000\n-10^7 <= K <= 10^7",
            examples_json=[
                {"input": "3\n1 1 1\n2", "output": "2", "explanation": "[1,1] from index 0..1 and index 1..2."},
                {"input": "3\n1 2 3\n3", "output": "2", "explanation": "[1,2] and [3]."}
            ],
            default_code_json={
                "python": "import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    k = int(lines[n+1])\n    \n    # Implement O(N) prefix sum hash map solution\n    count = 0\n    curr_sum = 0\n    prefix_counts = {0: 1}\n    for num in nums:\n        curr_sum += num\n        if curr_sum - k in prefix_counts:\n            count += prefix_counts[curr_sum - k]\n        prefix_counts[curr_sum] = prefix_counts.get(curr_sum, 0) + 1\n        \n    print(count)\n\nif __name__ == '__main__':\n    solve()",
                "javascript": "const fs = require('fs');\nfunction solve() {\n    const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (tokens.length < 3) return;\n    const n = parseInt(tokens[0]);\n    const nums = tokens.slice(1, n + 1).map(Number);\n    const k = parseInt(tokens[n + 1]);\n    let count = 0, sum = 0;\n    const map = new Map([[0, 1]]);\n    for (const num of nums) {\n        sum += num;\n        if (map.has(sum - k)) count += map.get(sum - k);\n        map.set(sum, (map.get(sum) || 0) + 1);\n    }\n    console.log(count);\n}\nsolve();"
            },
            reference_solution="import sys\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines: return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    k = int(lines[n+1])\n    count = 0\n    curr_sum = 0\n    prefix_counts = {0: 1}\n    for num in nums:\n        curr_sum += num\n        if curr_sum - k in prefix_counts:\n            count += prefix_counts[curr_sum - k]\n        prefix_counts[curr_sum] = prefix_counts.get(curr_sum, 0) + 1\n    print(count)\nif __name__ == '__main__': solve()",
            time_limit_seconds=2.0,
            memory_limit_mb=256,
            supported_languages_json=["python", "javascript", "cpp", "java"],
            tags_json=["Array", "Hash Table", "Prefix Sum"],
            difficulty="MEDIUM"
        )
        db.add(cp1)
        await db.flush()

        # Public & Hidden Test Cases
        db.add(CodingTestCase(coding_problem_id=cp1.id, input_data="3\n1 1 1\n2", expected_output="2", is_hidden=False, points=2.0))
        db.add(CodingTestCase(coding_problem_id=cp1.id, input_data="3\n1 2 3\n3", expected_output="2", is_hidden=False, points=2.0))
        db.add(CodingTestCase(coding_problem_id=cp1.id, input_data="5\n1 -1 0 1 -1\n0", expected_output="6", is_hidden=True, points=2.0))
        db.add(CodingTestCase(coding_problem_id=cp1.id, input_data="6\n3 4 7 2 -3 1 4 2\n7", expected_output="4", is_hidden=True, points=2.0))
        db.add(CodingTestCase(coding_problem_id=cp1.id, input_data="1\n5\n5", expected_output="1", is_hidden=True, points=2.0))

        await db.commit()
        print("[SUCCESS] Database seeding completed successfully!")
        print("   - Portal Admin: admin@assessmentportal.io / Admin@12345")
        print("   - Test Creator: recruiter@techcorp.com / Creator@12345")
        print("   - Candidate:    candidate@example.com / Candidate@12345")

if __name__ == "__main__":
    asyncio.run(seed())

import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from app.core.database import init_db, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.models import (
    PortalAdmin, Company, TestCreator, CreatorPermission,
    TestAttender, Assessment, AssessmentSection, Question,
    QuestionOption, CodingProblem, CodingTestCase,
    ExternalPlatform, PlatformSetting, AssessmentInvitation
)
from sqlalchemy import select

async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        print("[+] Checking platform seed data...")

        # 1. Portal Admin
        res = await db.execute(select(PortalAdmin).filter_by(email="admin@assessmentportal.io"))
        admin = res.scalar_one_or_none()
        if not admin:
            admin = PortalAdmin(
                email="admin@assessmentportal.io",
                hashed_password=get_password_hash("Admin@12345"),
                full_name="Chief Portal Administrator",
                is_active=True
            )
            db.add(admin)
            await db.flush()
        else:
            admin.hashed_password = get_password_hash("Admin@12345")
            admin.is_active = True

        # 2. Company
        c_res = await db.execute(select(Company).filter_by(name="Apex Global Technologies"))
        company = c_res.scalar_one_or_none()
        if not company:
            company = Company(
                name="Apex Global Technologies",
                domain="apextech.io"
            )
            db.add(company)
            await db.flush()

        # 3. Test Creator
        cr_res = await db.execute(select(TestCreator).filter_by(email="recruiter@techcorp.com"))
        creator = cr_res.scalar_one_or_none()
        if not creator:
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
        else:
            creator.hashed_password = get_password_hash("Creator@12345")
            creator.is_active = True

        # 4. Test Attender / Candidate
        cand_res = await db.execute(select(TestAttender).filter_by(email="candidate@example.com"))
        candidate = cand_res.scalar_one_or_none()
        if not candidate:
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
            await db.flush()
        else:
            candidate.hashed_password = get_password_hash("Candidate@12345")
            candidate.is_verified = True
            candidate.is_active = True

        # 5. External Platforms
        platforms = [
            ("Codeforces", "codeforces", True, "https://codeforces.com/api"),
            ("LeetCode", "leetcode", True, "https://leetcode.com/api"),
            ("HackerRank", "hackerrank", True, "https://www.hackerrank.com/api"),
            ("AtCoder", "atcoder", True, "https://atcoder.jp"),
            ("CodeChef", "codechef", True, "https://api.codechef.com")
        ]
        for name, slug, enabled, endpoint in platforms:
            p_check = await db.execute(select(ExternalPlatform).filter_by(slug=slug))
            if not p_check.scalar_one_or_none():
                db.add(ExternalPlatform(name=name, slug=slug, is_enabled=enabled, api_endpoint=endpoint, status="HEALTHY"))

        # 6. Global Platform Settings
        s_check = await db.execute(select(PlatformSetting).filter_by(setting_key="global_proctoring_policy"))
        if not s_check.scalar_one_or_none():
            db.add(PlatformSetting(
                setting_key="global_proctoring_policy",
                setting_value_json={
                    "max_warnings": 3,
                    "allow_fullscreen": True,
                    "allow_voice": True,
                    "allow_face_detection": True,
                    "auto_suspension_threshold": 3,
                    "ai_provider": "builtin_expert",
                    "ai_model": "gemini-1.5-pro"
                },
                description="Global default security and proctoring threshold limits"
            ))

        # =========================================================================
        # 7. ASSESSMENT 1: Full Stack Software Engineer Assessment (2026)
        # =========================================================================
        asm1_res = await db.execute(select(Assessment).filter_by(title="Full Stack Software Engineer Assessment (2026)"))
        asm1 = asm1_res.scalar_one_or_none()
        if not asm1:
            asm1 = Assessment(
                title="Full Stack Software Engineer Assessment (2026)",
                description="Comprehensive evaluation encompassing Quantitative Aptitude, Logical Reasoning, Database Systems, and Algorithmic Coding Challenges in an isolated sandbox.",
                company_id=company.id,
                creator_id=creator.id,
                duration_minutes=60,
                passing_percentage=65.0,
                difficulty="MEDIUM",
                status="PUBLISHED",
                instructions="• Proctored with camera, mic, and tab switch detection.\n• Pass public and hidden test cases.\n• Write clean, optimal code within the CPU time limits.",
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
            db.add(asm1)
            await db.flush()

            # Section 1: Aptitude
            sec1 = AssessmentSection(
                assessment_id=asm1.id,
                title="Section 1 — Quantitative & Logical Aptitude",
                description="Analytical reasoning, time-work calculations, and probability.",
                duration_minutes=20,
                section_order=1
            )
            db.add(sec1)
            await db.flush()

            # Q1
            q1 = Question(
                assessment_id=asm1.id,
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

            # Q2
            q2 = Question(
                assessment_id=asm1.id,
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
                assessment_id=asm1.id,
                title="Section 2 — Computer Science & System Fundamentals",
                description="Database query optimization, data structures, and architecture.",
                duration_minutes=20,
                section_order=2
            )
            db.add(sec2)
            await db.flush()

            # Q3
            q3 = Question(
                assessment_id=asm1.id,
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

            # Q4
            q4 = Question(
                assessment_id=asm1.id,
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
                assessment_id=asm1.id,
                title="Section 3 — Hands-on Algorithmic Coding Challenge",
                description="Algorithmic problem solving evaluated against hidden test cases.",
                duration_minutes=20,
                section_order=3
            )
            db.add(sec3)
            await db.flush()

            q5 = Question(
                assessment_id=asm1.id,
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
                    "python": "import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    k = int(lines[n+1])\n    \n    count = 0\n    curr_sum = 0\n    prefix_counts = {0: 1}\n    for num in nums:\n        curr_sum += num\n        if curr_sum - k in prefix_counts:\n            count += prefix_counts[curr_sum - k]\n        prefix_counts[curr_sum] = prefix_counts.get(curr_sum, 0) + 1\n        \n    print(count)\n\nif __name__ == '__main__':\n    solve()",
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

            db.add(CodingTestCase(coding_problem_id=cp1.id, input_data="3\n1 1 1\n2", expected_output="2", is_hidden=False, points=2.0))
            db.add(CodingTestCase(coding_problem_id=cp1.id, input_data="3\n1 2 3\n3", expected_output="2", is_hidden=False, points=2.0))
            db.add(CodingTestCase(coding_problem_id=cp1.id, input_data="5\n1 -1 0 1 -1\n0", expected_output="6", is_hidden=True, points=2.0))
            db.add(CodingTestCase(coding_problem_id=cp1.id, input_data="6\n3 4 7 2 -3 1 4 2\n7", expected_output="4", is_hidden=True, points=2.0))
            db.add(CodingTestCase(coding_problem_id=cp1.id, input_data="1\n5\n5", expected_output="1", is_hidden=True, points=2.0))

            # Candidate Invitation for Assessment 1
            db.add(AssessmentInvitation(
                assessment_id=asm1.id,
                attender_id=candidate.id,
                email=candidate.email,
                invitation_token=str(uuid.uuid4()),
                status="INVITED",
                reminder_count=0
            ))

        # =========================================================================
        # 8. ASSESSMENT 2: AI & Data Science Engineering Challenge
        # =========================================================================
        asm2_res = await db.execute(select(Assessment).filter_by(title="AI & Data Science Engineering Challenge"))
        asm2 = asm2_res.scalar_one_or_none()
        if not asm2:
            asm2 = Assessment(
                title="AI & Data Science Engineering Challenge",
                description="Specialized evaluation covering Supervised Learning, Loss Functions, Matrix Operations, and Two-Pointer / Array Algorithms.",
                company_id=company.id,
                creator_id=creator.id,
                duration_minutes=45,
                passing_percentage=70.0,
                difficulty="HARD",
                status="PUBLISHED",
                instructions="• Camera proctoring is enabled.\n• Review all mathematical foundations and coding complexity constraints.",
                randomize_questions=True,
                negative_marking=True,
                negative_marking_value=0.25,
                proctoring_level="STRICT",
                camera_required=True,
                microphone_required=True,
                fullscreen_required=True,
                tab_detection_enabled=True,
                warning_limit=3,
                auto_suspension_enabled=True,
                reattempt_policy="MANUAL",
                max_reattempts=1
            )
            db.add(asm2)
            await db.flush()

            sec2_1 = AssessmentSection(
                assessment_id=asm2.id,
                title="Section 1 — ML Foundations & Statistical Reasoning",
                description="Core machine learning theory and probability.",
                duration_minutes=20,
                section_order=1
            )
            db.add(sec2_1)
            await db.flush()

            # Q6: ML Question
            q6 = Question(
                assessment_id=asm2.id,
                section_id=sec2_1.id,
                type="MCQ_SINGLE",
                topic="Machine Learning",
                skill="ML Theory",
                difficulty="HARD",
                problem_statement="When training a deep neural network on highly imbalanced medical diagnostic images (0.1% positive class), which loss function is best suited to prevent the model from getting stuck predicting only the majority class?",
                explanation="Focal Loss dynamically scales cross-entropy loss by down-weighting easy background examples and focusing training on hard positive examples.",
                points=3.0,
                negative_points=0.75,
                author_id=creator.id,
                status="PUBLISHED"
            )
            db.add(q6)
            await db.flush()
            db.add(QuestionOption(question_id=q6.id, option_text="Focal Loss (with tunable gamma modulating factor)", is_correct=True, explanation="Focal Loss adds (1 - pt)^gamma to standard Cross Entropy.", option_order=0))
            db.add(QuestionOption(question_id=q6.id, option_text="Standard Mean Squared Error (MSE)", is_correct=False, option_order=1))
            db.add(QuestionOption(question_id=q6.id, option_text="Unweighted Binary Cross-Entropy", is_correct=False, option_order=2))
            db.add(QuestionOption(question_id=q6.id, option_text="Hinge Loss with L1 Regularization", is_correct=False, option_order=3))

            # Q7: ML Metrics
            q7 = Question(
                assessment_id=asm2.id,
                section_id=sec2_1.id,
                type="MCQ_SINGLE",
                topic="Model Evaluation",
                skill="Data Science",
                difficulty="MEDIUM",
                problem_statement="In an automated fraud detection system where missing a fraudulent transaction causes massive financial loss, which metric should the model threshold primarily be tuned to maximize?",
                explanation="Recall (Sensitivity) measures the proportion of actual positives that were correctly identified.",
                points=2.5,
                negative_points=0.5,
                author_id=creator.id,
                status="PUBLISHED"
            )
            db.add(q7)
            await db.flush()
            db.add(QuestionOption(question_id=q7.id, option_text="Recall / Sensitivity (True Positive Rate)", is_correct=True, explanation="Maximizing Recall minimizes False Negatives.", option_order=0))
            db.add(QuestionOption(question_id=q7.id, option_text="Accuracy Score", is_correct=False, option_order=1))
            db.add(QuestionOption(question_id=q7.id, option_text="Specificity", is_correct=False, option_order=2))
            db.add(QuestionOption(question_id=q7.id, option_text="Adjusted R-Squared", is_correct=False, option_order=3))

            # Section 2: Coding Problem
            sec2_2 = AssessmentSection(
                assessment_id=asm2.id,
                title="Section 2 — Algorithmic Challenge",
                description="Hash map lookups and array processing.",
                duration_minutes=25,
                section_order=2
            )
            db.add(sec2_2)
            await db.flush()

            q8 = Question(
                assessment_id=asm2.id,
                section_id=sec2_2.id,
                type="CODING",
                topic="Two Sum / Hash Table",
                skill="Algorithms",
                difficulty="EASY",
                problem_statement="Given an array of integers `nums` and an integer `target`, return the 0-based indices of the two numbers such that they add up to `target`.\n\nInput Format:\nLine 1: N (size of array)\nLine 2: N space-separated integers\nLine 3: Target integer\n\nOutput Format:\nTwo space-separated indices in ascending order.",
                points=10.0,
                negative_points=0.0,
                author_id=creator.id,
                status="PUBLISHED"
            )
            db.add(q8)
            await db.flush()

            cp2 = CodingProblem(
                question_id=q8.id,
                title="Classic Two Sum",
                statement="Given an array of integers `nums` and an integer `target`, find two distinct indices whose elements sum to `target`.",
                input_format="N\nnums[0] nums[1] ... nums[N-1]\ntarget",
                output_format="idx1 idx2",
                constraints="2 <= N <= 10^4\n-10^9 <= nums[i] <= 10^9\nExactly one valid solution exists.",
                examples_json=[
                    {"input": "4\n2 7 11 15\n9", "output": "0 1", "explanation": "nums[0] + nums[1] = 2 + 7 = 9."}
                ],
                default_code_json={
                    "python": "import sys\n\ndef solve():\n    data = sys.stdin.read().split()\n    if not data:\n        return\n    n = int(data[0])\n    nums = [int(x) for x in data[1:n+1]]\n    target = int(data[n+1])\n    \n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            print(f\"{seen[comp]} {i}\")\n            return\n        seen[num] = i\n\nif __name__ == '__main__':\n    solve()",
                    "javascript": "const fs = require('fs');\nfunction solve() {\n    const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (tokens.length < 3) return;\n    const n = parseInt(tokens[0]);\n    const nums = tokens.slice(1, n + 1).map(Number);\n    const target = parseInt(tokens[n + 1]);\n    const seen = new Map();\n    for (let i = 0; i < n; i++) {\n        const comp = target - nums[i];\n        if (seen.has(comp)) {\n            console.log(`${seen.get(comp)} ${i}`);\n            return;\n        }\n        seen.set(nums[i], i);\n    }\n}\nsolve();"
                },
                reference_solution="import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    nums = [int(x) for x in data[1:n+1]]\n    target = int(data[n+1])\n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            print(f\"{seen[comp]} {i}\")\n            return\n        seen[num] = i\nif __name__ == '__main__': solve()",
                time_limit_seconds=2.0,
                memory_limit_mb=256,
                supported_languages_json=["python", "javascript", "cpp", "java"],
                tags_json=["Array", "Hash Table"],
                difficulty="EASY"
            )
            db.add(cp2)
            await db.flush()

            db.add(CodingTestCase(coding_problem_id=cp2.id, input_data="4\n2 7 11 15\n9", expected_output="0 1", is_hidden=False, points=5.0))
            db.add(CodingTestCase(coding_problem_id=cp2.id, input_data="3\n3 2 4\n6", expected_output="1 2", is_hidden=False, points=5.0))
            db.add(CodingTestCase(coding_problem_id=cp2.id, input_data="2\n3 3\n6", expected_output="0 1", is_hidden=True, points=5.0))

            # Candidate Invitation for Assessment 2
            db.add(AssessmentInvitation(
                assessment_id=asm2.id,
                attender_id=candidate.id,
                email=candidate.email,
                invitation_token=str(uuid.uuid4()),
                status="INVITED",
                reminder_count=0
            ))

        # =========================================================================
        # 9. Standalone Global Question Bank Questions (Available in Question Bank)
        # =========================================================================
        qb_samples = [
            {
                "topic": "System Design",
                "skill": "Architecture",
                "difficulty": "HARD",
                "problem_statement": "Under the CAP theorem, which property must a distributed data store choose to sacrifice during a network partition if it guarantees strong linearizable consistency?",
                "explanation": "According to CAP theorem, in the presence of a network partition (P), a distributed system must choose between Availability (A) and Consistency (C). A CP system sacrifices Availability.",
                "type": "MCQ_SINGLE",
                "points": 3.0,
                "options": [
                    ("Availability (A)", True, "In CP systems, nodes reject requests rather than return stale data."),
                    ("Consistency (C)", False, ""),
                    ("Partition Tolerance (P)", False, ""),
                    ("Atomicity (A in ACID)", False, "")
                ]
            },
            {
                "topic": "Aptitude",
                "skill": "Speed & Distance",
                "difficulty": "EASY",
                "problem_statement": "A train 150 meters long passes a standing pole in 10 seconds. What is the speed of the train in kilometers per hour (km/h)?",
                "explanation": "Speed = Distance / Time = 150m / 10s = 15 m/s. Convert to km/h: 15 * (18/5) = 54 km/h.",
                "type": "APTITUDE",
                "points": 2.0,
                "options": [
                    ("54 km/h", True, "15 m/s * 3.6 = 54 km/h"),
                    ("48 km/h", False, ""),
                    ("60 km/h", False, ""),
                    ("72 km/h", False, "")
                ]
            },
            {
                "topic": "JavaScript & Web",
                "skill": "Frontend Engineering",
                "difficulty": "MEDIUM",
                "problem_statement": "What is the output order of `console.log` in this JavaScript snippet?\n\n```js\nconsole.log('1');\nsetTimeout(() => console.log('2'), 0);\nPromise.resolve().then(() => console.log('3'));\nconsole.log('4');\n```",
                "explanation": "Synchronous code runs first (1, 4), then Microtask queue promises run (3), then Macrotask queue setTimeout runs (2).",
                "type": "MCQ_SINGLE",
                "points": 2.5,
                "options": [
                    ("1, 4, 3, 2", True, "Synchronous -> Microtasks (Promise) -> Macrotasks (Timer)."),
                    ("1, 2, 3, 4", False, ""),
                    ("1, 4, 2, 3", False, ""),
                    ("1, 3, 4, 2", False, "")
                ]
            },
            {
                "topic": "Operating Systems",
                "skill": "OS & Concurrency",
                "difficulty": "MEDIUM",
                "problem_statement": "Which condition is NOT one of the four Coffman conditions necessary for a deadlock to occur in a multithreaded system?",
                "explanation": "The 4 Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Preemption breaks deadlock.",
                "type": "MCQ_SINGLE",
                "points": 2.0,
                "options": [
                    ("Preemptive Resource Scheduling", True, "Deadlock requires 'No Preemption'; allowing preemption prevents deadlock."),
                    ("Mutual Exclusion", False, ""),
                    ("Hold and Wait", False, ""),
                    ("Circular Wait", False, "")
                ]
            }
        ]

        for item in qb_samples:
            qb_res = await db.execute(select(Question).filter_by(problem_statement=item["problem_statement"]))
            if not qb_res.scalar_one_or_none():
                q_obj = Question(
                    assessment_id=None,
                    section_id=None,
                    type=item["type"],
                    topic=item["topic"],
                    skill=item["skill"],
                    difficulty=item["difficulty"],
                    problem_statement=item["problem_statement"],
                    explanation=item["explanation"],
                    points=item["points"],
                    author_id=creator.id,
                    status="PUBLISHED"
                )
                db.add(q_obj)
                await db.flush()
                for idx, (opt_txt, is_corr, expl) in enumerate(item["options"]):
                    db.add(QuestionOption(
                        question_id=q_obj.id,
                        option_text=opt_txt,
                        is_correct=is_corr,
                        explanation=expl,
                        option_order=idx
                    ))

        await db.commit()
        print("[SUCCESS] Comprehensive demo data seeding completed successfully!")
        print("   - Sample Assessments: Full Stack Engineer, AI & Data Science Challenge")
        print("   - Question Bank: Populated with Aptitude, SQL, ML, OS, and System Design problems")
        print("   - Demo Users ready: Portal Admin, Recruiter, and Candidate")

if __name__ == "__main__":
    asyncio.run(seed())

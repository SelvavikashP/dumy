import pytest
from app.services.code_judge import CodeJudgeService

@pytest.mark.asyncio
async def test_python_code_execution():
    code = """
import sys
n = int(sys.stdin.read().strip())
print(n * n)
"""
    res = await CodeJudgeService.execute_code(
        language="python",
        code=code,
        stdin_input="7\n",
        time_limit_sec=2.0
    )
    assert res["status"] == "SUCCESS"
    assert res["stdout"].strip() == "49"
    assert res["execution_time_ms"] > 0.0

@pytest.mark.asyncio
async def test_javascript_code_execution():
    code = """
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
console.log('HELLO ' + input.toUpperCase());
"""
    res = await CodeJudgeService.execute_code(
        language="javascript",
        code=code,
        stdin_input="antigravity\n",
        time_limit_sec=2.0
    )
    assert res["status"] == "SUCCESS"
    assert res["stdout"].strip() == "HELLO ANTIGRAVITY"

@pytest.mark.asyncio
async def test_timeout_infinite_loop_protection():
    infinite_loop_code = """
import time
while True:
    pass
"""
    res = await CodeJudgeService.execute_code(
        language="python",
        code=infinite_loop_code,
        stdin_input="",
        time_limit_sec=1.0
    )
    assert res["status"] == "TIME_LIMIT_EXCEEDED"

@pytest.mark.asyncio
async def test_test_cases_evaluation():
    solution_code = """
import sys
lines = sys.stdin.read().split()
if lines:
    a = int(lines[0])
    b = int(lines[1])
    print(a + b)
"""
    test_cases = [
        {"input_data": "3 5", "expected_output": "8", "is_hidden": False, "points": 2.0},
        {"input_data": "100 250", "expected_output": "350", "is_hidden": True, "points": 3.0},
        {"input_data": "-5 5", "expected_output": "0", "is_hidden": True, "points": 3.0}
    ]
    eval_res = await CodeJudgeService.evaluate_against_test_cases(
        language="python",
        code=solution_code,
        test_cases=test_cases,
        time_limit_sec=2.0
    )
    assert eval_res["overall_status"] == "ACCEPTED"
    assert eval_res["passed_test_cases"] == 3
    assert eval_res["total_test_cases"] == 3

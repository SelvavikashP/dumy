from typing import Dict, Any, List, Optional
from app.services.platform_adapters.base import CodingPlatformAdapter
from app.services.platform_adapters.codeforces_adapter import CodeforcesAdapter

class LeetCodeAdapter(CodingPlatformAdapter):
    """
    LeetCode platform reference integration.
    Complies with TOS by storing permitted problem references, IDs, and recruiter problem schemas.
    """
    async def test_connection(self) -> Dict[str, Any]:
        return {"status": "HEALTHY", "message": "LeetCode reference service active"}

    async def search_problems(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        sample_catalog = [
            {"platform": "LeetCode", "problem_id": "1", "title": "Two Sum", "difficulty": "Easy", "tags": ["Array", "Hash Table"], "external_url": "https://leetcode.com/problems/two-sum/"},
            {"platform": "LeetCode", "problem_id": "2", "title": "Add Two Numbers", "difficulty": "Medium", "tags": ["Linked List", "Math"], "external_url": "https://leetcode.com/problems/add-two-numbers/"},
            {"platform": "LeetCode", "problem_id": "3", "title": "Longest Substring Without Repeating Characters", "difficulty": "Medium", "tags": ["Hash Table", "Sliding Window"], "external_url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/"},
            {"platform": "LeetCode", "problem_id": "4", "title": "Median of Two Sorted Arrays", "difficulty": "Hard", "tags": ["Array", "Binary Search"], "external_url": "https://leetcode.com/problems/median-of-two-sorted-arrays/"},
            {"platform": "LeetCode", "problem_id": "20", "title": "Valid Parentheses", "difficulty": "Easy", "tags": ["String", "Stack"], "external_url": "https://leetcode.com/problems/valid-parentheses/"},
            {"platform": "LeetCode", "problem_id": "53", "title": "Maximum Subarray", "difficulty": "Medium", "tags": ["Array", "Dynamic Programming"], "external_url": "https://leetcode.com/problems/maximum-subarray/"},
            {"platform": "LeetCode", "problem_id": "200", "title": "Number of Islands", "difficulty": "Medium", "tags": ["Array", "DFS", "BFS"], "external_url": "https://leetcode.com/problems/number-of-islands/"}
        ]
        q = query.lower()
        matched = [p for p in sample_catalog if q in p["title"].lower() or any(q in t.lower() for t in p["tags"])]
        return matched[:limit] if matched else sample_catalog[:limit]

    async def get_problem_metadata(self, problem_id: str) -> Optional[Dict[str, Any]]:
        return {
            "platform": "LeetCode",
            "problem_id": problem_id,
            "title": f"LeetCode Problem #{problem_id}",
            "difficulty": "Medium",
            "tags": ["Algorithms"],
            "external_url": f"https://leetcode.com/problems/{problem_id}"
        }

class HackerRankAdapter(CodingPlatformAdapter):
    """
    HackerRank platform reference integration.
    """
    async def test_connection(self) -> Dict[str, Any]:
        return {"status": "HEALTHY", "message": "HackerRank integration endpoint ready"}

    async def search_problems(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        sample_catalog = [
            {"platform": "HackerRank", "problem_id": "solve-me-first", "title": "Solve Me First", "difficulty": "Easy", "tags": ["Warmup"], "external_url": "https://www.hackerrank.com/challenges/solve-me-first"},
            {"platform": "HackerRank", "problem_id": "simple-array-sum", "title": "Simple Array Sum", "difficulty": "Easy", "tags": ["Arrays"], "external_url": "https://www.hackerrank.com/challenges/simple-array-sum"},
            {"platform": "HackerRank", "problem_id": "compare-the-triplets", "title": "Compare the Triplets", "difficulty": "Easy", "tags": ["Arrays"], "external_url": "https://www.hackerrank.com/challenges/compare-the-triplets"},
            {"platform": "HackerRank", "problem_id": "a-very-big-sum", "title": "A Very Big Sum", "difficulty": "Easy", "tags": ["Warmup"], "external_url": "https://www.hackerrank.com/challenges/a-very-big-sum"},
            {"platform": "HackerRank", "problem_id": "diagonal-difference", "title": "Diagonal Difference", "difficulty": "Easy", "tags": ["Matrix"], "external_url": "https://www.hackerrank.com/challenges/diagonal-difference"}
        ]
        q = query.lower()
        matched = [p for p in sample_catalog if q in p["title"].lower() or any(q in t.lower() for t in p["tags"])]
        return matched[:limit] if matched else sample_catalog[:limit]

    async def get_problem_metadata(self, problem_id: str) -> Optional[Dict[str, Any]]:
        return {
            "platform": "HackerRank",
            "problem_id": problem_id,
            "title": problem_id.replace("-", " ").title(),
            "difficulty": "Easy",
            "tags": ["Algorithms"],
            "external_url": f"https://www.hackerrank.com/challenges/{problem_id}"
        }

class AtCoderAdapter(CodingPlatformAdapter):
    """
    AtCoder platform reference integration.
    """
    async def test_connection(self) -> Dict[str, Any]:
        return {"status": "HEALTHY", "message": "AtCoder reference adapter active"}

    async def search_problems(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        sample_catalog = [
            {"platform": "AtCoder", "problem_id": "abc086_a", "title": "Product (ABC 086 A)", "difficulty": "100 pts", "tags": ["Math", "Conditionals"], "external_url": "https://atcoder.jp/contests/abc086/tasks/abc086_a"},
            {"platform": "AtCoder", "problem_id": "abc081_a", "title": "Placing Marbles (ABC 081 A)", "difficulty": "100 pts", "tags": ["Strings"], "external_url": "https://atcoder.jp/contests/abc081/tasks/abc081_a"},
            {"platform": "AtCoder", "problem_id": "abc081_b", "title": "Shift Only (ABC 081 B)", "difficulty": "200 pts", "tags": ["Simulation"], "external_url": "https://atcoder.jp/contests/abc081/tasks/abc081_b"},
            {"platform": "AtCoder", "problem_id": "dp_a", "title": "Frog 1 (Educational DP Contest)", "difficulty": "DP 100 pts", "tags": ["Dynamic Programming"], "external_url": "https://atcoder.jp/contests/dp/tasks/dp_a"}
        ]
        q = query.lower()
        matched = [p for p in sample_catalog if q in p["title"].lower() or any(q in t.lower() for t in p["tags"])]
        return matched[:limit] if matched else sample_catalog[:limit]

    async def get_problem_metadata(self, problem_id: str) -> Optional[Dict[str, Any]]:
        return {
            "platform": "AtCoder",
            "problem_id": problem_id,
            "title": f"AtCoder Task {problem_id}",
            "difficulty": "Medium",
            "tags": ["Competitive Programming"],
            "external_url": f"https://atcoder.jp/tasks/{problem_id}"
        }

class CodeChefAdapter(CodingPlatformAdapter):
    """
    CodeChef platform reference integration.
    """
    async def test_connection(self) -> Dict[str, Any]:
        return {"status": "HEALTHY", "message": "CodeChef integration endpoint active"}

    async def search_problems(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        sample_catalog = [
            {"platform": "CodeChef", "problem_id": "FLOW001", "title": "Add Two Numbers", "difficulty": "Beginner", "tags": ["Basic Math"], "external_url": "https://www.codechef.com/problems/FLOW001"},
            {"platform": "CodeChef", "problem_id": "HS08TEST", "title": "ATM", "difficulty": "Beginner", "tags": ["Conditionals"], "external_url": "https://www.codechef.com/problems/HS08TEST"},
            {"platform": "CodeChef", "problem_id": "INTEST", "title": "Enormous Input Test", "difficulty": "Easy", "tags": ["Fast I/O"], "external_url": "https://www.codechef.com/problems/INTEST"}
        ]
        q = query.lower()
        matched = [p for p in sample_catalog if q in p["title"].lower() or any(q in t.lower() for t in p["tags"])]
        return matched[:limit] if matched else sample_catalog[:limit]

    async def get_problem_metadata(self, problem_id: str) -> Optional[Dict[str, Any]]:
        return {
            "platform": "CodeChef",
            "problem_id": problem_id,
            "title": f"CodeChef Problem {problem_id}",
            "difficulty": "Easy",
            "tags": ["Algorithms"],
            "external_url": f"https://www.codechef.com/problems/{problem_id}"
        }

class PlatformAdapterRegistry:
    """Registry to resolve coding platform adapters dynamically."""

    @classmethod
    def get_adapter(cls, platform_slug: str, api_endpoint: Optional[str] = None, api_key: Optional[str] = None) -> CodingPlatformAdapter:
        slug = platform_slug.lower()
        if slug == "codeforces":
            return CodeforcesAdapter(api_endpoint=api_endpoint or "https://codeforces.com/api", api_key=api_key)
        elif slug == "leetcode":
            return LeetCodeAdapter(api_endpoint=api_endpoint, api_key=api_key)
        elif slug == "hackerrank":
            return HackerRankAdapter(api_endpoint=api_endpoint, api_key=api_key)
        elif slug == "atcoder":
            return AtCoderAdapter(api_endpoint=api_endpoint, api_key=api_key)
        elif slug == "codechef":
            return CodeChefAdapter(api_endpoint=api_endpoint, api_key=api_key)
        else:
            return LeetCodeAdapter(api_endpoint=api_endpoint, api_key=api_key)

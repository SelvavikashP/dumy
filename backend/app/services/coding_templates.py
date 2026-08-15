"""
Pre-built algorithmic and data structure coding problem templates catalog.
Includes comprehensive problem statements, I/O formats, multi-language starter code,
test cases (public and hidden), and reference solutions.
"""

from typing import List, Dict, Any, Optional

CODING_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "two-sum",
        "title": "Two Sum (Target Pair Index)",
        "difficulty": "EASY",
        "category": "Arrays & Hashing",
        "tags": ["Array", "Hash Table", "Two Pointers"],
        "statement": """Given an array of integers `nums` and an integer `target`, return the 0-based indices of the two numbers such that they add up to `target`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.
You can return the answer with the smaller index first.

### Input Format
- **Line 1**: An integer `N` representing array length.
- **Line 2**: `N` space-separated integers `nums[0] nums[1] ... nums[N-1]`.
- **Line 3**: An integer `target`.

### Output Format
- Two space-separated integers representing the indices `i j` (where `i < j`).
""",
        "input_format": "N\nnums[0] ... nums[N-1]\ntarget",
        "output_format": "i j",
        "constraints": "2 <= N <= 10^5\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nExactly one valid answer exists.",
        "time_limit_sec": 2.0,
        "memory_limit_mb": 256,
        "starter_code": {
            "python": """import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    nums = [int(x) for x in lines[1:n+1]]
    target = int(lines[n+1])
    
    # Write your solution here
    seen = {}
    for i, x in enumerate(nums):
        diff = target - x
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[x] = i

if __name__ == '__main__':
    solve()
""",
            "javascript": """const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 3) return;
    const n = parseInt(input[0], 10);
    const nums = [];
    for (let i = 1; i <= n; i++) {
        nums.push(parseInt(input[i], 10));
    }
    const target = parseInt(input[n + 1], 10);

    const map = new Map();
    for (let i = 0; i < n; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            console.log(`${map.get(diff)} ${i}`);
            return;
        }
        map.set(nums[i], i);
    }
}

solve();
""",
            "cpp": """#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }
    long long target;
    cin >> target;

    unordered_map<long long, int> seen;
    for (int i = 0; i < n; i++) {
        long long diff = target - nums[i];
        if (seen.find(diff) != seen.end()) {
            cout << seen[diff] << " " << i << "\\n";
            return 0;
        }
        seen[nums[i]] = i;
    }
    return 0;
}
""",
            "java": """import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;
        int n = Integer.parseInt(line.trim());
        String[] parts = br.readLine().trim().split("\\\\s+");
        long[] nums = new long[n];
        for (int i = 0; i < n; i++) {
            nums[i] = Long.parseLong(parts[i]);
        }
        long target = Long.parseLong(br.readLine().trim());

        Map<Long, Integer> seen = new HashMap<>();
        for (int i = 0; i < n; i++) {
            long diff = target - nums[i];
            if (seen.containsKey(diff)) {
                System.out.println(seen.get(diff) + " " + i);
                return;
            }
            seen.put(nums[i], i);
        }
    }
}
"""
        },
        "reference_solution": """import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    nums = [int(x) for x in lines[1:n+1]]
    target = int(lines[n+1])
    
    seen = {}
    for i, x in enumerate(nums):
        diff = target - x
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[x] = i

if __name__ == '__main__':
    solve()
""",
        "test_cases": [
            {"input_data": "4\n2 7 11 15\n9", "expected_output": "0 1", "is_hidden": False, "points": 2.0},
            {"input_data": "3\n3 2 4\n6", "expected_output": "1 2", "is_hidden": False, "points": 2.0},
            {"input_data": "2\n3 3\n6", "expected_output": "0 1", "is_hidden": True, "points": 3.0},
            {"input_data": "5\n-3 4 3 90 2\n0", "expected_output": "0 2", "is_hidden": True, "points": 3.0}
        ]
    },
    {
        "id": "valid-parentheses",
        "title": "Valid Parentheses & Bracket Matching",
        "difficulty": "EASY",
        "category": "Stack & Strings",
        "tags": ["Stack", "String"],
        "statement": """Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Input Format
- A single string `s` on one line.

### Output Format
- Print `true` if the string is valid, or `false` otherwise (lowercase).
""",
        "input_format": "s",
        "output_format": "true / false",
        "constraints": "1 <= length(s) <= 10^5\n`s` consists of parentheses only `'()[]{}'`.",
        "time_limit_sec": 2.0,
        "memory_limit_mb": 256,
        "starter_code": {
            "python": """import sys

def is_valid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack

def solve():
    s = sys.stdin.read().strip()
    if not s:
        print("true")
        return
    print("true" if is_valid(s) else "false")

if __name__ == '__main__':
    solve()
"""
        },
        "reference_solution": """import sys

def solve():
    s = sys.stdin.read().strip()
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                print("false")
                return
        else:
            stack.append(char)
    print("true" if not stack else "false")

if __name__ == '__main__':
    solve()
""",
        "test_cases": [
            {"input_data": "()", "expected_output": "true", "is_hidden": False, "points": 2.0},
            {"input_data": "()[]{}", "expected_output": "true", "is_hidden": False, "points": 2.0},
            {"input_data": "(]", "expected_output": "false", "is_hidden": False, "points": 2.0},
            {"input_data": "([)]", "expected_output": "false", "is_hidden": True, "points": 2.0},
            {"input_data": "{[]}", "expected_output": "true", "is_hidden": True, "points": 2.0}
        ]
    },
    {
        "id": "longest-substring-without-repeats",
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "MEDIUM",
        "category": "Sliding Window",
        "tags": ["Hash Table", "String", "Sliding Window"],
        "statement": """Given a string `s`, find the length of the **longest substring** without duplicate characters.

### Input Format
- A single line containing the string `s`.

### Output Format
- An integer representing the length of the longest substring with unique characters.
""",
        "input_format": "s",
        "output_format": "integer",
        "constraints": "0 <= length(s) <= 5 * 10^4\n`s` consists of English letters, digits, symbols and spaces.",
        "time_limit_sec": 2.0,
        "memory_limit_mb": 256,
        "starter_code": {
            "python": """import sys

def solve():
    s = sys.stdin.read().rstrip('\\r\\n')
    char_map = {}
    left = 0
    max_len = 0
    
    for right, c in enumerate(s):
        if c in char_map and char_map[c] >= left:
            left = char_map[c] + 1
        char_map[c] = right
        max_len = max(max_len, right - left + 1)
        
    print(max_len)

if __name__ == '__main__':
    solve()
"""
        },
        "reference_solution": """import sys

def solve():
    s = sys.stdin.read().rstrip('\\r\\n')
    char_map = {}
    left = 0
    max_len = 0
    for right, c in enumerate(s):
        if c in char_map and char_map[c] >= left:
            left = char_map[c] + 1
        char_map[c] = right
        max_len = max(max_len, right - left + 1)
    print(max_len)

if __name__ == '__main__':
    solve()
""",
        "test_cases": [
            {"input_data": "abcabcbb", "expected_output": "3", "is_hidden": False, "points": 2.5},
            {"input_data": "bbbbb", "expected_output": "1", "is_hidden": False, "points": 2.5},
            {"input_data": "pwwkew", "expected_output": "3", "is_hidden": True, "points": 2.5},
            {"input_data": "tmmzuxt", "expected_output": "5", "is_hidden": True, "points": 2.5}
        ]
    },
    {
        "id": "binary-search",
        "title": "Binary Search in Sorted Array",
        "difficulty": "EASY",
        "category": "Searching",
        "tags": ["Array", "Binary Search"],
        "statement": """Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`.

If `target` exists, then return its 0-based index. Otherwise, return `-1`.
You must write an algorithm with `O(log n)` runtime complexity.

### Input Format
- **Line 1**: `N` (array length)
- **Line 2**: `N` space-separated sorted integers
- **Line 3**: `target`

### Output Format
- Single integer representing the index or `-1`.
""",
        "input_format": "N\nnums[0] ... nums[N-1]\ntarget",
        "output_format": "index",
        "constraints": "1 <= N <= 10^5\n-10^4 <= nums[i], target <= 10^4\nAll elements are unique and sorted.",
        "time_limit_sec": 1.5,
        "memory_limit_mb": 256,
        "starter_code": {
            "python": """import sys
import bisect

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    nums = [int(x) for x in lines[1:n+1]]
    target = int(lines[n+1])
    
    idx = bisect.bisect_left(nums, target)
    if idx < n and nums[idx] == target:
        print(idx)
    else:
        print(-1)

if __name__ == '__main__':
    solve()
"""
        },
        "reference_solution": """import sys
import bisect

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    nums = [int(x) for x in lines[1:n+1]]
    target = int(lines[n+1])
    
    low, high = 0, n - 1
    ans = -1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            ans = mid
            break
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    print(ans)

if __name__ == '__main__':
    solve()
""",
        "test_cases": [
            {"input_data": "6\n-1 0 3 5 9 12\n9", "expected_output": "4", "is_hidden": False, "points": 2.0},
            {"input_data": "6\n-1 0 3 5 9 12\n2", "expected_output": "-1", "is_hidden": False, "points": 2.0},
            {"input_data": "1\n5\n5", "expected_output": "0", "is_hidden": True, "points": 3.0},
            {"input_data": "2\n2 5\n0", "expected_output": "-1", "is_hidden": True, "points": 3.0}
        ]
    },
    {
        "id": "merge-intervals",
        "title": "Merge Overlapping Intervals",
        "difficulty": "MEDIUM",
        "category": "Intervals & Sorting",
        "tags": ["Array", "Sorting"],
        "statement": """Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

### Input Format
- **Line 1**: `N` (number of intervals)
- **Next N lines**: Two space-separated integers `start end`

### Output Format
- Print each merged interval `start end` on a new line, sorted ascending by start time.
""",
        "input_format": "N\nstart1 end1\n...\nstartN endN",
        "output_format": "Merged intervals line by line",
        "constraints": "1 <= N <= 10^5\n0 <= start_i <= end_i <= 10^5",
        "time_limit_sec": 2.0,
        "memory_limit_mb": 256,
        "starter_code": {
            "python": """import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    intervals = []
    idx = 1
    for _ in range(n):
        s, e = int(lines[idx]), int(lines[idx+1])
        intervals.append([s, e])
        idx += 2
        
    intervals.sort(key=lambda x: x[0])
    merged = []
    for cur in intervals:
        if not merged or merged[-1][1] < cur[0]:
            merged.append(cur)
        else:
            merged[-1][1] = max(merged[-1][1], cur[1])
            
    for s, e in merged:
        print(f"{s} {e}")

if __name__ == '__main__':
    solve()
"""
        },
        "reference_solution": """import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    intervals = []
    idx = 1
    for _ in range(n):
        intervals.append([int(lines[idx]), int(lines[idx+1])])
        idx += 2
        
    intervals.sort(key=lambda x: x[0])
    merged = []
    for cur in intervals:
        if not merged or merged[-1][1] < cur[0]:
            merged.append(cur)
        else:
            merged[-1][1] = max(merged[-1][1], cur[1])
            
    for s, e in merged:
        print(f"{s} {e}")

if __name__ == '__main__':
    solve()
""",
        "test_cases": [
            {"input_data": "4\n1 3\n2 6\n8 10\n15 18", "expected_output": "1 6\n8 10\n15 18", "is_hidden": False, "points": 2.5},
            {"input_data": "2\n1 4\n4 5", "expected_output": "1 5", "is_hidden": False, "points": 2.5},
            {"input_data": "3\n1 4\n0 2\n3 5", "expected_output": "0 5", "is_hidden": True, "points": 2.5}
        ]
    },
    {
        "id": "coin-change-dp",
        "title": "Coin Change (Fewest Coins)",
        "difficulty": "MEDIUM",
        "category": "Dynamic Programming",
        "tags": ["Dynamic Programming", "Breadth-First Search"],
        "statement": """You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.

Return the **fewest number of coins** that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.

You may assume that you have an infinite number of each kind of coin.

### Input Format
- **Line 1**: `N` (number of coin types)
- **Line 2**: `N` space-separated coin denominations
- **Line 3**: `amount`

### Output Format
- Single integer representing the minimum number of coins, or `-1`.
""",
        "input_format": "N\ncoins[0] ... coins[N-1]\namount",
        "output_format": "integer",
        "constraints": "1 <= N <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4",
        "time_limit_sec": 2.0,
        "memory_limit_mb": 256,
        "starter_code": {
            "python": """import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    coins = [int(x) for x in lines[1:n+1]]
    amount = int(lines[n+1])
    
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for x in range(coin, amount + 1):
            dp[x] = min(dp[x], dp[x - coin] + 1)
            
    print(dp[amount] if dp[amount] != float('inf') else -1)

if __name__ == '__main__':
    solve()
"""
        },
        "reference_solution": """import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    coins = [int(x) for x in lines[1:n+1]]
    amount = int(lines[n+1])
    
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for x in range(coin, amount + 1):
            dp[x] = min(dp[x], dp[x - coin] + 1)
            
    print(dp[amount] if dp[amount] != float('inf') else -1)

if __name__ == '__main__':
    solve()
""",
        "test_cases": [
            {"input_data": "3\n1 2 5\n11", "expected_output": "3", "is_hidden": False, "points": 2.5},
            {"input_data": "1\n2\n3", "expected_output": "-1", "is_hidden": False, "points": 2.5},
            {"input_data": "1\n1\n0", "expected_output": "0", "is_hidden": True, "points": 2.5}
        ]
    },
    {
        "id": "group-anagrams",
        "title": "Group Anagrams",
        "difficulty": "MEDIUM",
        "category": "Arrays & Hashing",
        "tags": ["Array", "Hash Table", "String"],
        "statement": """Given an array of strings `strs`, group the anagrams together.

An Anagram is a word formed by rearranging the letters of a different word.

### Input Format
- **Line 1**: `N` (number of words)
- **Line 2**: `N` space-separated words

### Output Format
- Print each group on a separate line with words space-separated.
- Sort words within each group lexicographically, and sort groups lexicographically by their first word.
""",
        "input_format": "N\nword1 word2 ... wordN",
        "output_format": "Sorted grouped anagrams",
        "constraints": "1 <= N <= 10^4\n0 <= length(strs[i]) <= 100",
        "time_limit_sec": 2.0,
        "memory_limit_mb": 256,
        "starter_code": {
            "python": """import sys
from collections import defaultdict

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    words = lines[1:n+1]
    
    groups = defaultdict(list)
    for w in words:
        key = "".join(sorted(w))
        groups[key].append(w)
        
    res = []
    for g in groups.values():
        res.append(sorted(g))
    res.sort()
    
    for g in res:
        print(" ".join(g))

if __name__ == '__main__':
    solve()
"""
        },
        "reference_solution": """import sys
from collections import defaultdict

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    words = lines[1:n+1]
    
    groups = defaultdict(list)
    for w in words:
        key = "".join(sorted(w))
        groups[key].append(w)
        
    res = []
    for g in groups.values():
        res.append(sorted(g))
    res.sort()
    
    for g in res:
        print(" ".join(g))

if __name__ == '__main__':
    solve()
""",
        "test_cases": [
            {"input_data": "6\neat tea tan ate nat bat", "expected_output": "ate eat tea\nbat\nnat tan", "is_hidden": False, "points": 2.5},
            {"input_data": "1\na", "expected_output": "a", "is_hidden": False, "points": 2.5}
        ]
    },
    {
        "id": "reverse-linked-list",
        "title": "Reverse Linked List / Array Sequence",
        "difficulty": "EASY",
        "category": "Linked Lists & Pointers",
        "tags": ["Linked List", "Recursion"],
        "statement": """Given a list of `N` elements representing node values in a singly linked list, reverse the list and output the reversed values.

### Input Format
- **Line 1**: `N`
- **Line 2**: `N` space-separated integers

### Output Format
- Space-separated integers representing the reversed sequence.
""",
        "input_format": "N\nv1 v2 ... vN",
        "output_format": "vN ... v1",
        "constraints": "0 <= N <= 5000\n-5000 <= val <= 5000",
        "time_limit_sec": 1.5,
        "memory_limit_mb": 256,
        "starter_code": {
            "python": """import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    nums = lines[1:n+1]
    print(" ".join(reversed(nums)))

if __name__ == '__main__':
    solve()
"""
        },
        "reference_solution": """import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    nums = lines[1:n+1]
    print(" ".join(reversed(nums)))

if __name__ == '__main__':
    solve()
""",
        "test_cases": [
            {"input_data": "5\n1 2 3 4 5", "expected_output": "5 4 3 2 1", "is_hidden": False, "points": 2.0},
            {"input_data": "2\n1 2", "expected_output": "2 1", "is_hidden": False, "points": 2.0}
        ]
    }
]

LANGUAGE_SNIPPETS = {
    "python": """import sys

def solve():
    # Read input from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # TODO: Implement algorithm here
    pass

if __name__ == '__main__':
    solve()
""",
    "javascript": """const fs = require('fs');

function solve() {
    // Read input from stdin
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;

    // TODO: Implement algorithm here
}

solve();
""",
    "typescript": """import * as fs from 'fs';

function solve(): void {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;

    // TODO: Implement algorithm here
}

solve();
""",
    "cpp": """#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // TODO: Read input & implement algorithm
    return 0;
}
""",
    "java": """import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;

        // TODO: Implement algorithm
    }
}
""",
    "go": """package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    scanner.Split(bufio.ScanWords)
    if !scanner.Scan() {
        return
    }
    // TODO: Implement algorithm
    fmt.Println()
}
"""
}

class CodingTemplateService:
    @staticmethod
    def get_template_summaries(category: Optional[str] = None, difficulty: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for t in CODING_TEMPLATES:
            if category and t["category"].lower() != category.lower():
                continue
            if difficulty and t["difficulty"].upper() != difficulty.upper():
                continue
            results.append({
                "id": t["id"],
                "title": t["title"],
                "difficulty": t["difficulty"],
                "category": t["category"],
                "tags": t["tags"],
                "test_case_count": len(t["test_cases"]),
                "time_limit_sec": t["time_limit_sec"],
                "memory_limit_mb": t["memory_limit_mb"]
            })
        return results

    @staticmethod
    def get_template_detail(template_id: str) -> Optional[Dict[str, Any]]:
        for t in CODING_TEMPLATES:
            if t["id"] == template_id:
                return t
        return None

    @staticmethod
    def get_language_snippet(language: str) -> str:
        lang_key = language.lower().strip()
        return LANGUAGE_SNIPPETS.get(lang_key, LANGUAGE_SNIPPETS["python"])

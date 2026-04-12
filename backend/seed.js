const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { DB_CONFIG, DB_NAME } = require('./database');

// Generate dates relative to NOW so contests are always valid
const now = new Date();
const daysAgo = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() - d); return dt.toISOString().slice(0, 19).replace('T', ' '); };
const daysFromNow = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt.toISOString().slice(0, 19).replace('T', ' '); };
const hoursAgo = (h) => { const dt = new Date(now); dt.setHours(dt.getHours() - h); return dt.toISOString().slice(0, 19).replace('T', ' '); };
const hoursFromNow = (h) => { const dt = new Date(now); dt.setHours(dt.getHours() + h); return dt.toISOString().slice(0, 19).replace('T', ' '); };

// ── Refresh dates only mode (non-destructive) ──
async function refreshDates() {
  let connection;
  try {
    connection = await mysql.createConnection({ ...DB_CONFIG, database: DB_NAME });
    console.log('🔄 Refreshing contest dates (non-destructive)...\n');

    const updates = [
      { title: 'Weekly Challenge #1', start: hoursAgo(2), end: hoursFromNow(22), status: 'ONGOING' },
      { title: 'Data Structures Sprint', start: hoursAgo(1), end: hoursFromNow(47), status: 'ONGOING' },
      { title: 'Monthly Marathon', start: daysFromNow(3), end: daysFromNow(4), status: 'UPCOMING' },
      { title: 'Beginner Bootcamp', start: daysAgo(6), end: daysAgo(5), status: 'ENDED' },
    ];

    for (const u of updates) {
      const [result] = await connection.execute(
        'UPDATE contests SET start_time = ?, end_time = ?, status = ? WHERE title = ?',
        [u.start, u.end, u.status, u.title]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✓ ${u.title} → ${u.status} (${u.start} to ${u.end})`);
      } else {
        console.log(`  ⚠ ${u.title} not found (skipped)`);
      }
    }

    console.log('\n✅ Contest dates refreshed without affecting users, submissions, or participations!');
  } catch (err) {
    console.error('❌ Date refresh failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

// ── Full seed mode (TRUNCATES everything) ──
async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection({ ...DB_CONFIG, database: DB_NAME });
    console.log('🌱 Seeding database (FULL RESET)...\n');

    // Clear tables
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    const tables = ['submissions', 'participations', 'contest_problems', 'problems', 'contests', 'users'];
    for (const t of tables) {
      await connection.execute(`TRUNCATE TABLE ${t}`);
    }
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    // ── Users ──
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    const userPass = await bcrypt.hash('user123', salt);

    await connection.execute(`INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`, ['admin', 'admin@codearena.com', adminPass, 'ADMIN']);
    await connection.execute(`INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`, ['sayan', 'sayan@codearena.com', userPass, 'USER']);
    await connection.execute(`INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`, ['alice', 'alice@codearena.com', userPass, 'USER']);
    await connection.execute(`INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`, ['bob', 'bob@codearena.com', userPass, 'USER']);
    await connection.execute(`INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`, ['charlie', 'charlie@codearena.com', userPass, 'USER']);
    console.log('  ✓ 5 users (1 admin + 4 users)');

    // ── Contests ──
    await connection.execute(
      `INSERT INTO contests (title, description, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)`,
      ['Weekly Challenge #1', 'Weekly coding contest featuring classic algorithmic challenges. Solve problems using any language you prefer.', hoursAgo(2), hoursFromNow(22), 'ONGOING']
    );
    await connection.execute(
      `INSERT INTO contests (title, description, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)`,
      ['Data Structures Sprint', 'A 2-day sprint focused on data structure problems — trees, graphs, and arrays.', hoursAgo(1), hoursFromNow(47), 'ONGOING']
    );
    await connection.execute(
      `INSERT INTO contests (title, description, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)`,
      ['Monthly Marathon', 'Monthly competitive programming marathon with hard problems and big prizes.', daysFromNow(3), daysFromNow(4), 'UPCOMING']
    );
    await connection.execute(
      `INSERT INTO contests (title, description, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)`,
      ['Beginner Bootcamp', 'A beginner-friendly contest with easy problems to get you started.', daysAgo(6), daysAgo(5), 'ENDED']
    );
    console.log('  ✓ 4 contests (2 ongoing, 1 upcoming, 1 ended)');

    // ── Problems (10 problems) ──
    const problems = [
      ['Two Sum', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].', 'EASY', 100],
      ['Reverse String', 'Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.\n\nExample:\nInput: s = ["h","e","l","l","o"]\nOutput: ["o","l","l","e","h"]', 'EASY', 100],
      ['Palindrome Number', 'Given an integer x, return true if x is a palindrome, and false otherwise.\n\nAn integer is a palindrome when it reads the same forward and backward.\n\nExample:\nInput: x = 121\nOutput: true\nExplanation: 121 reads as 121 from left to right and from right to left.', 'EASY', 100],
      ['Longest Substring Without Repeating Characters', 'Given a string s, find the length of the longest substring without repeating characters.\n\nExample:\nInput: s = "abcabcbb"\nOutput: 3\nExplanation: The answer is "abc", with the length of 3.', 'MEDIUM', 200],
      ['Merge Intervals', 'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals.\n\nExample:\nInput: intervals = [[1,3],[2,6],[8,10],[15,18]]\nOutput: [[1,6],[8,10],[15,18]]', 'MEDIUM', 200],
      ['Binary Tree Level Order Traversal', 'Given the root of a binary tree, return the level order traversal of its nodes values (i.e., from left to right, level by level).\n\nExample:\nInput: root = [3,9,20,null,null,15,7]\nOutput: [[3],[9,20],[15,7]]', 'MEDIUM', 200],
      ['Container With Most Water', 'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.', 'MEDIUM', 200],
      ['Median of Two Sorted Arrays', 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).\n\nExample:\nInput: nums1 = [1,3], nums2 = [2]\nOutput: 2.0', 'HARD', 300],
      ['Trapping Rain Water', 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.\n\nExample:\nInput: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6', 'HARD', 300],
      ['Regular Expression Matching', 'Given an input string s and a pattern p, implement regular expression matching with support for . and * where:\n\n. Matches any single character.\n* Matches zero or more of the preceding element.\n\nThe matching should cover the entire input string (not partial).\n\nExample:\nInput: s = "aa", p = "a"\nOutput: false', 'HARD', 300],
    ];

    for (const [title, desc, diff, score] of problems) {
      await connection.execute(
        `INSERT INTO problems (title, description, difficulty, max_score) VALUES (?, ?, ?, ?)`,
        [title, desc, diff, score]
      );
    }
    console.log('  ✓ 10 problems (3 easy, 4 medium, 3 hard)');

    // ── Contest-Problem mappings ──
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (1, 1)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (1, 4)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (1, 5)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (1, 8)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (2, 2)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (2, 3)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (2, 6)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (2, 7)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (2, 9)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (3, 5)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (3, 7)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (3, 8)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (3, 9)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (3, 10)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (4, 1)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (4, 2)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (4, 3)`);
    console.log('  ✓ contest-problem mappings');

    // ── Participations ──
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (2, 1)`);
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (3, 1)`);
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (4, 1)`);
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (2, 2)`);
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (5, 2)`);
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (2, 4)`);
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (3, 4)`);
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (4, 4)`);
    console.log('  ✓ participations');

    // ── Submissions ──
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [2, 1, 1, 'function twoSum(nums, target) {\n  const map = {};\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map[complement] !== undefined) return [map[complement], i];\n    map[nums[i]] = i;\n  }\n}', 'javascript', 100]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [2, 1, 4, 'def lengthOfLongestSubstring(s):\n    chars = set()\n    left = result = 0\n    for right in range(len(s)):\n        while s[right] in chars:\n            chars.remove(s[left])\n            left += 1\n        chars.add(s[right])\n        result = max(result, right - left + 1)\n    return result', 'python', 180]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [3, 1, 1, 'class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    Map<Integer, Integer> map = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n      int comp = target - nums[i];\n      if (map.containsKey(comp)) return new int[]{map.get(comp), i};\n      map.put(nums[i], i);\n    }\n    return new int[]{};\n  }\n}', 'java', 100]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [3, 1, 4, 'int lengthOfLongestSubstring(string s) {\n  unordered_set<char> chars;\n  int left = 0, result = 0;\n  for (int right = 0; right < s.size(); right++) {\n    while (chars.count(s[right])) chars.erase(s[left++]);\n    chars.insert(s[right]);\n    result = max(result, right - left + 1);\n  }\n  return result;\n}', 'cpp', 200]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [4, 1, 1, 'vector<int> twoSum(vector<int>& nums, int target) {\n  unordered_map<int, int> m;\n  for (int i = 0; i < nums.size(); i++) {\n    if (m.count(target - nums[i])) return {m[target - nums[i]], i};\n    m[nums[i]] = i;\n  }\n  return {};\n}', 'cpp', 80]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [2, 2, 2, 'def reverseString(s):\n    left, right = 0, len(s) - 1\n    while left < right:\n        s[left], s[right] = s[right], s[left]\n        left += 1\n        right -= 1', 'python', 100]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [5, 2, 3, 'bool isPalindrome(int x) {\n  if (x < 0) return false;\n  int rev = 0, original = x;\n  while (x > 0) {\n    rev = rev * 10 + x % 10;\n    x /= 10;\n  }\n  return original == rev;\n}', 'cpp', 100]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [2, 4, 1, 'const twoSum = (nums, target) => {\n  for (let i = 0; i < nums.length; i++)\n    for (let j = i+1; j < nums.length; j++)\n      if (nums[i] + nums[j] === target) return [i, j];\n}', 'javascript', 90]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [3, 4, 2, 'void reverseString(vector<char>& s) {\n  int l = 0, r = s.size()-1;\n  while (l < r) swap(s[l++], s[r--]);\n}', 'cpp', 100]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [4, 4, 3, 'def isPalindrome(x):\n    return str(x) == str(x)[::-1]', 'python', 100]
    );
    console.log('  ✓ 10 submissions');

    console.log('\n🎉 Database seeded successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

// ── Entry point ──
const args = process.argv.slice(2);

if (args.includes('--refresh-dates')) {
  refreshDates();
} else {
  console.log('⚠️  This will TRUNCATE all tables and re-seed from scratch.');
  console.log('   Use --refresh-dates to only update contest dates without wiping data.\n');
  seed();
}

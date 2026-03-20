const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { DB_CONFIG, DB_NAME } = require('./database');

async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection({ ...DB_CONFIG, database: DB_NAME });
    console.log('🌱 Seeding database...\n');

    // Clear tables in correct order (respecting FK constraints)
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

    await connection.execute(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
      ['admin', 'admin@codearena.com', adminPass, 'ADMIN']
    );
    await connection.execute(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
      ['sayan', 'sayan@codearena.com', userPass, 'USER']
    );
    await connection.execute(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
      ['alice', 'alice@codearena.com', userPass, 'USER']
    );
    await connection.execute(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
      ['bob', 'bob@codearena.com', userPass, 'USER']
    );
    await connection.execute(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
      ['charlie', 'charlie@codearena.com', userPass, 'USER']
    );
    console.log('  ✓ 5 users (1 admin + 4 users)');

    // ── Contests ──
    await connection.execute(
      `INSERT INTO contests (title, description, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)`,
      ['Weekly Contest 1', 'First weekly coding contest featuring algorithmic challenges.', '2026-12-10 09:00:00', '2026-12-10 12:00:00', 'ONGOING']
    );
    await connection.execute(
      `INSERT INTO contests (title, description, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)`,
      ['Weekly Contest 2', 'Second weekly coding contest with data structure problems.', '2026-12-19 09:00:00', '2026-12-19 12:00:00', 'UPCOMING']
    );
    await connection.execute(
      `INSERT INTO contests (title, description, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)`,
      ['Monthly Challenge', 'Monthly competitive programming marathon.', '2026-11-01 10:00:00', '2026-11-01 16:00:00', 'ENDED']
    );
    console.log('  ✓ 3 contests');

    // ── Problems ──
    await connection.execute(
      `INSERT INTO problems (title, description, difficulty, max_score) VALUES (?, ?, ?, ?)`,
      ['Two Sum', 'Given an array of integers, return indices of the two numbers such that they add up to a target.', 'EASY', 100]
    );
    await connection.execute(
      `INSERT INTO problems (title, description, difficulty, max_score) VALUES (?, ?, ?, ?)`,
      ['Longest Substring', 'Find the length of the longest substring without repeating characters.', 'MEDIUM', 200]
    );
    await connection.execute(
      `INSERT INTO problems (title, description, difficulty, max_score) VALUES (?, ?, ?, ?)`,
      ['Merge Intervals', 'Given an array of intervals, merge all overlapping intervals.', 'MEDIUM', 200]
    );
    await connection.execute(
      `INSERT INTO problems (title, description, difficulty, max_score) VALUES (?, ?, ?, ?)`,
      ['Binary Tree Level Order', 'Return the level order traversal of a binary tree\'s nodes values.', 'MEDIUM', 200]
    );
    await connection.execute(
      `INSERT INTO problems (title, description, difficulty, max_score) VALUES (?, ?, ?, ?)`,
      ['Median of Two Sorted Arrays', 'Find the median of two sorted arrays in O(log(m+n)) time.', 'HARD', 300]
    );
    console.log('  ✓ 5 problems');

    // ── Contest-Problem mappings ──
    // Contest 1 -> Problems 1, 2, 5
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (1, 1)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (1, 2)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (1, 5)`);
    // Contest 2 -> Problems 3, 4
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (2, 3)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (2, 4)`);
    // Contest 3 -> Problems 1, 3, 4, 5
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (3, 1)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (3, 3)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (3, 4)`);
    await connection.execute(`INSERT INTO contest_problems (contest_id, problem_id) VALUES (3, 5)`);
    console.log('  ✓ contest-problem mappings');

    // ── Participations ──
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (2, 1)`); // sayan -> contest 1
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (3, 1)`); // alice -> contest 1
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (4, 1)`); // bob -> contest 1
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (5, 1)`); // charlie -> contest 1
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (2, 3)`); // sayan -> contest 3
    await connection.execute(`INSERT INTO participations (user_id, contest_id) VALUES (3, 3)`); // alice -> contest 3
    console.log('  ✓ participations');

    // ── Submissions ──
    // Contest 1 submissions
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [2, 1, 1, 'function twoSum(nums, target) { /* ... */ }', 'javascript', 100]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [2, 1, 2, 'def longest_substring(s): pass', 'python', 180]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [2, 1, 5, 'double findMedian(vector<int>& a, vector<int>& b) {}', 'cpp', 220]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [3, 1, 1, 'int[] twoSum(int[] nums, int target) {}', 'java', 100]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [3, 1, 2, 'int lengthOfLongest(string s) {}', 'cpp', 200]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [4, 1, 1, 'vector<int> twoSum(vector<int>& nums, int target) {}', 'cpp', 80]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [5, 1, 1, 'def two_sum(nums, target): pass', 'python', 100]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [5, 1, 5, 'double findMedianSortedArrays(int* a, int* b) {}', 'c', 300]
    );
    // Contest 3 submissions
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [2, 3, 1, 'func twoSum(nums []int, target int) []int {}', 'go', 100]
    );
    await connection.execute(
      `INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)`,
      [3, 3, 3, 'def merge(intervals): pass', 'python', 150]
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

seed();

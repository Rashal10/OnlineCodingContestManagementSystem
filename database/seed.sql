USE \`codearena\`;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE submissions;
TRUNCATE TABLE participations;
TRUNCATE TABLE contest_problems;
TRUNCATE TABLE problems;
TRUNCATE TABLE contests;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Seed Users (Passwords are hashed 'admin123' / 'user123')
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@codearena.com', '$2a$10$w8.3f6iY8QY4a5Z93n.GoeM3zJ1tX8.U6sD.P/tN4aF6x4T4T6j5K', 'ADMIN'),
('sayan', 'sayan@codearena.com', '$2a$10$iGqD0Kk19T2F4oH1sZ6v4exM1mD/J0uX8lJ7w1v3rF/hZ7p3TqI2y', 'USER'),
('alice', 'alice@codearena.com', '$2a$10$iGqD0Kk19T2F4oH1sZ6v4exM1mD/J0uX8lJ7w1v3rF/hZ7p3TqI2y', 'USER'),
('bob', 'bob@codearena.com', '$2a$10$iGqD0Kk19T2F4oH1sZ6v4exM1mD/J0uX8lJ7w1v3rF/hZ7p3TqI2y', 'USER'),
('charlie', 'charlie@codearena.com', '$2a$10$iGqD0Kk19T2F4oH1sZ6v4exM1mD/J0uX8lJ7w1v3rF/hZ7p3TqI2y', 'USER');

-- Seed Contests
INSERT INTO contests (title, description, start_time, end_time, status) VALUES 
('Weekly Contest 1', 'First weekly coding contest featuring algorithmic challenges.', '2026-12-10 09:00:00', '2026-12-10 12:00:00', 'ONGOING'),
('Weekly Contest 2', 'Second weekly coding contest with data structure problems.', '2026-12-19 09:00:00', '2026-12-19 12:00:00', 'UPCOMING'),
('Monthly Challenge', 'Monthly competitive programming marathon.', '2026-11-01 10:00:00', '2026-11-01 16:00:00', 'ENDED');

-- Seed Problems
INSERT INTO problems (title, description, difficulty, max_score) VALUES 
('Two Sum', 'Given an array of integers, return indices of the two numbers such that they add up to a target.', 'EASY', 100),
('Longest Substring', 'Find the length of the longest substring without repeating characters.', 'MEDIUM', 200),
('Merge Intervals', 'Given an array of intervals, merge all overlapping intervals.', 'MEDIUM', 200),
('Binary Tree Level Order', 'Return the level order traversal of a binary trees nodes values.', 'MEDIUM', 200),
('Median of Two Sorted Arrays', 'Find the median of two sorted arrays in O(log(m+n)) time.', 'HARD', 300);

-- Seed Contest-Problem mappings
-- Contest 1 -> Problems 1, 2, 5
INSERT INTO contest_problems (contest_id, problem_id) VALUES (1, 1), (1, 2), (1, 5);
-- Contest 2 -> Problems 3, 4
INSERT INTO contest_problems (contest_id, problem_id) VALUES (2, 3), (2, 4);
-- Contest 3 -> Problems 1, 3, 4, 5
INSERT INTO contest_problems (contest_id, problem_id) VALUES (3, 1), (3, 3), (3, 4), (3, 5);

-- Seed Participations
INSERT INTO participations (user_id, contest_id) VALUES 
(2, 1), (3, 1), (4, 1), (5, 1), (2, 3), (3, 3);

-- Seed Submissions
INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES 
(2, 1, 1, 'function twoSum(nums, target) { /* ... */ }', 'javascript', 100),
(2, 1, 2, 'def longest_substring(s): pass', 'python', 180),
(2, 1, 5, 'double findMedian(vector<int>& a, vector<int>& b) {}', 'cpp', 220),
(3, 1, 1, 'int[] twoSum(int[] nums, int target) {}', 'java', 100),
(3, 1, 2, 'int lengthOfLongest(string s) {}', 'cpp', 200),
(4, 1, 1, 'vector<int> twoSum(vector<int>& nums, int target) {}', 'cpp', 80),
(5, 1, 1, 'def two_sum(nums, target): pass', 'python', 100),
(5, 1, 5, 'double findMedianSortedArrays(int* a, int* b) {}', 'c', 300),
(2, 3, 1, 'func twoSum(nums []int, target int) []int {}', 'go', 100),
(3, 3, 3, 'def merge(intervals): pass', 'python', 150);

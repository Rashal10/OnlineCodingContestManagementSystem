-- ==========================================================
-- DATABASE ASSIGNMENT IMPLEMENTATION
-- Online Coding Contest Management System (CodeArena)
-- Database: codearena
-- ==========================================================

CREATE DATABASE IF NOT EXISTS codearena;

USE codearena;

-- ==========================================================
-- TASK 1 (Week 4): Aggregate Functions, Constraints, and Set Operations
-- ==========================================================

-- ----------------------------------------------------------
-- 1.1 DATA MANIPULATION LANGUAGE (DML)
-- ----------------------------------------------------------

-- INSERT: Add a new user to the platform
INSERT INTO users (username, email, password, role) 
VALUES ('test_student', 'student@example.com', 'hashed_pw', 'USER');

-- INSERT: Add a new contest
INSERT INTO contests (title, description, start_time, end_time, status)
VALUES ('Sprint Contest', 'Quick 1-hour sprint challenge.', '2026-04-10 14:00:00', '2026-04-10 15:00:00', 'UPCOMING');

-- UPDATE: Promote the test user to ADMIN
UPDATE users 
SET role = 'ADMIN' 
WHERE username = 'test_student';

-- DELETE: Remove the test user (cleanup after DML demonstration)
DELETE FROM users 
WHERE username = 'test_student';

-- DELETE: Remove the test contest
DELETE FROM contests 
WHERE title = 'Sprint Contest';

-- ----------------------------------------------------------
-- 1.2 CONSTRAINTS (Demonstration of Schema Constraints)
-- ----------------------------------------------------------

-- PRIMARY KEY: Every table has an auto-incrementing primary key (e.g., user_id, contest_id).
-- NOT NULL:    Columns like username, email, password, title, description enforce non-null data.
-- UNIQUE:      users.username and users.email are unique — no two users can share the same.
-- ENUM:        users.role is restricted to ('ADMIN','USER'), contests.status to ('UPCOMING','ONGOING','ENDED').
-- FOREIGN KEY: Submissions, participations, and contest_problems reference parent tables.
-- ON DELETE CASCADE: Deleting a parent record automatically removes dependent child records.
-- COMPOSITE PRIMARY KEY: contest_problems uses (contest_id, problem_id) as a composite key.
-- COMPOSITE UNIQUE KEY: participations enforces unique_participation(user_id, contest_id).

-- Constraint Violation Example 1: UNIQUE constraint on email
-- (Uncommenting this would throw "Duplicate entry" error)
-- INSERT INTO users (username, email, password) VALUES ('duplicate_user', 'sayan@codearena.com', 'pw');

-- Constraint Violation Example 2: FOREIGN KEY constraint
-- (Uncommenting this would throw "Cannot add or update a child row" error)
-- INSERT INTO submissions (user_id, contest_id, problem_id, code) VALUES (9999, 1, 1, 'code');

-- Constraint Violation Example 3: NOT NULL constraint
-- (Uncommenting this would throw "Column 'username' cannot be null" error)
-- INSERT INTO users (username, email, password) VALUES (NULL, 'a@b.com', 'pw');

-- ----------------------------------------------------------
-- 1.3 AGGREGATE FUNCTIONS
-- ----------------------------------------------------------

-- COUNT: Total number of registered users
SELECT COUNT(*) AS total_users FROM users;

-- COUNT with condition: Number of ADMIN users
SELECT COUNT(*) AS admin_count FROM users WHERE role = 'ADMIN';

-- SUM: Total score achieved by user 'sayan' (user_id = 2) across all submissions
SELECT SUM(score) AS sayan_total_score 
FROM submissions 
WHERE user_id = 2;

-- AVG: Average submission score across the entire platform
SELECT ROUND(AVG(score), 2) AS platform_avg_score FROM submissions;

-- MAX: Highest single submission score ever recorded
SELECT MAX(score) AS highest_score FROM submissions;

-- MIN: Lowest non-zero submission score
SELECT MIN(score) AS lowest_score FROM submissions WHERE score > 0;

-- GROUP BY: Total score per user across all contests
SELECT u.username, SUM(s.score) AS total_score, COUNT(s.submission_id) AS num_submissions
FROM submissions s
JOIN users u ON s.user_id = u.user_id
GROUP BY u.user_id, u.username
ORDER BY total_score DESC;

-- GROUP BY: Number of problems in each contest
SELECT c.title AS contest_title, COUNT(cp.problem_id) AS problem_count
FROM contests c
LEFT JOIN contest_problems cp ON c.contest_id = cp.contest_id
GROUP BY c.contest_id, c.title;

-- GROUP BY: Average score per difficulty level
SELECT p.difficulty, ROUND(AVG(s.score), 2) AS avg_score, COUNT(*) AS submissions
FROM submissions s
JOIN problems p ON s.problem_id = p.problem_id
GROUP BY p.difficulty
ORDER BY avg_score DESC;

-- HAVING: Users with total score exceeding 300
SELECT u.username, SUM(s.score) AS total_score
FROM submissions s
JOIN users u ON s.user_id = u.user_id
GROUP BY u.user_id, u.username
HAVING total_score > 300
ORDER BY total_score DESC;

-- HAVING: Contests with more than 2 participants
SELECT c.title, COUNT(p.user_id) AS participants
FROM contests c
JOIN participations p ON c.contest_id = p.contest_id
GROUP BY c.contest_id, c.title
HAVING participants > 2;

-- GROUP BY with multiple aggregates: Contest-level statistics
SELECT c.title AS contest,
       COUNT(DISTINCT s.user_id) AS unique_submitters,
       COUNT(s.submission_id) AS total_submissions,
       SUM(s.score) AS total_score,
       ROUND(AVG(s.score), 2) AS avg_score,
       MAX(s.score) AS best_score
FROM contests c
LEFT JOIN submissions s ON c.contest_id = s.contest_id
GROUP BY c.contest_id, c.title;

-- ----------------------------------------------------------
-- 1.4 SET OPERATIONS
-- ----------------------------------------------------------

-- UNION: Combine all unique titles from both contests and problems
SELECT title AS item_title, 'Contest' AS type FROM contests
UNION
SELECT title AS item_title, 'Problem' AS type FROM problems;

-- UNION ALL: Same as above but retaining duplicates (if any titles match)
SELECT title AS item_title, 'Contest' AS type FROM contests
UNION ALL
SELECT title AS item_title, 'Problem' AS type FROM problems;

-- INTERSECT equivalent: Users who have BOTH participated AND submitted code
SELECT u.username 
FROM users u
WHERE u.user_id IN (SELECT user_id FROM participations)
  AND u.user_id IN (SELECT user_id FROM submissions);

-- EXCEPT equivalent: Users who registered for a contest but made NO submissions
SELECT u.username
FROM users u
JOIN participations p ON u.user_id = p.user_id
WHERE u.user_id NOT IN (SELECT user_id FROM submissions);

-- EXCEPT equivalent: Problems not assigned to any contest
SELECT title AS unassigned_problem
FROM problems 
WHERE problem_id NOT IN (SELECT problem_id FROM contest_problems);


-- ==========================================================
-- TASK 2 (Week 5): Subqueries, Joins, and Views
-- ==========================================================

-- ----------------------------------------------------------
-- 2.1 SUBQUERIES
-- ----------------------------------------------------------

-- Scalar Subquery: Problem(s) with the highest maximum score
SELECT title, difficulty, max_score
FROM problems
WHERE max_score = (SELECT MAX(max_score) FROM problems);

-- Correlated Subquery: Users whose average score exceeds the platform average
SELECT username 
FROM users 
WHERE user_id IN (
    SELECT user_id 
    FROM submissions 
    GROUP BY user_id 
    HAVING AVG(score) > (SELECT AVG(score) FROM submissions)
);

-- Subquery in FROM clause: Rank users by their best score per problem
SELECT username, total_best_score
FROM (
    SELECT u.username, SUM(best.max_score) AS total_best_score
    FROM users u
    JOIN (
        SELECT user_id, problem_id, MAX(score) AS max_score
        FROM submissions
        GROUP BY user_id, problem_id
    ) AS best ON u.user_id = best.user_id
    GROUP BY u.user_id, u.username
) AS user_rankings
ORDER BY total_best_score DESC;

-- Subquery with EXISTS: Contests that have at least one submission
SELECT c.title
FROM contests c
WHERE EXISTS (
    SELECT 1 FROM submissions s WHERE s.contest_id = c.contest_id
);

-- Nested Subquery: Users who solved the hardest problem (max difficulty score)
SELECT u.username
FROM users u
WHERE u.user_id IN (
    SELECT s.user_id
    FROM submissions s
    WHERE s.problem_id IN (
        SELECT problem_id FROM problems WHERE difficulty = 'HARD'
    )
    AND s.score > 0
);

-- ----------------------------------------------------------
-- 2.2 JOINS
-- ----------------------------------------------------------

-- INNER JOIN: Detailed submission view — username, problem title, score, language
SELECT u.username, p.title AS problem_title, s.score, s.language, s.submission_time
FROM submissions s
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN problems p ON s.problem_id = p.problem_id;

-- LEFT JOIN: All contests with their associated problems (including empty contests)
SELECT c.title AS contest_title, p.title AS problem_title, p.difficulty
FROM contests c
LEFT JOIN contest_problems cp ON c.contest_id = cp.contest_id
LEFT JOIN problems p ON cp.problem_id = p.problem_id;

-- RIGHT JOIN: All problems and the contests they appear in
SELECT p.title AS problem_title, c.title AS contest_title
FROM contests c
JOIN contest_problems cp ON c.contest_id = cp.contest_id
RIGHT JOIN problems p ON cp.problem_id = p.problem_id;

-- SELF JOIN (simulated): Compare submission scores between two users in same contest/problem
SELECT u1.username AS user_a, u2.username AS user_b,
       p.title AS problem,
       s1.score AS score_a, s2.score AS score_b,
       (s1.score - s2.score) AS score_difference
FROM submissions s1
JOIN submissions s2 ON s1.contest_id = s2.contest_id 
    AND s1.problem_id = s2.problem_id 
    AND s1.user_id < s2.user_id
JOIN users u1 ON s1.user_id = u1.user_id
JOIN users u2 ON s2.user_id = u2.user_id
JOIN problems p ON s1.problem_id = p.problem_id;

-- Multi-table JOIN: Full contest participation details
SELECT c.title AS contest, u.username, p.title AS problem, s.score, s.language
FROM participations part
JOIN users u ON part.user_id = u.user_id
JOIN contests c ON part.contest_id = c.contest_id
LEFT JOIN submissions s ON part.user_id = s.user_id AND part.contest_id = s.contest_id
LEFT JOIN problems p ON s.problem_id = p.problem_id
ORDER BY c.title, u.username;

-- ----------------------------------------------------------
-- 2.3 VIEWS
-- ----------------------------------------------------------

-- View 1: Contest Leaderboard — ranks users per contest by total score
CREATE OR REPLACE VIEW Contest_Leaderboard_View AS
SELECT 
    c.title AS contest_name, 
    u.username, 
    SUM(s.score) AS total_score, 
    COUNT(s.submission_id) AS num_submissions,
    MAX(s.submission_time) AS last_submission_time
FROM submissions s
JOIN users u ON s.user_id = u.user_id
JOIN contests c ON s.contest_id = c.contest_id
GROUP BY c.contest_id, u.user_id
ORDER BY c.contest_id, total_score DESC;

-- View 2: User Performance Summary across all contests
CREATE OR REPLACE VIEW User_Performance_View AS
SELECT 
    u.username, 
    u.email,
    COUNT(DISTINCT s.contest_id) AS contests_attempted,
    COUNT(DISTINCT s.problem_id) AS unique_problems_solved,
    SUM(s.score) AS lifetime_score,
    ROUND(AVG(s.score), 2) AS avg_score_per_submission
FROM users u
LEFT JOIN submissions s ON u.user_id = s.user_id
WHERE u.role = 'USER'
GROUP BY u.user_id, u.username, u.email;

-- View 3: Contest Overview with statistics
CREATE OR REPLACE VIEW Contest_Overview_View AS
SELECT 
    c.title, c.status,
    c.start_time, c.end_time,
    COUNT(DISTINCT cp.problem_id) AS num_problems,
    COUNT(DISTINCT p.user_id) AS num_participants
FROM contests c
LEFT JOIN contest_problems cp ON c.contest_id = cp.contest_id
LEFT JOIN participations p ON c.contest_id = p.contest_id
GROUP BY c.contest_id, c.title, c.status, c.start_time, c.end_time;

-- Query the views
SELECT * FROM Contest_Leaderboard_View;
SELECT * FROM User_Performance_View;
SELECT * FROM Contest_Overview_View;


-- ==========================================================
-- TASK 3 (Week 6): Functions, Triggers, Cursors, and Exception Handling
-- ==========================================================

-- Drop existing objects if they exist (for clean re-creation)
DROP FUNCTION IF EXISTS GetUserTotalScore;
DROP FUNCTION IF EXISTS GetContestStatus;
DROP PROCEDURE IF EXISTS GeneratePerformanceReport;
DROP TRIGGER IF EXISTS Prevent_Submission_After_Contest;
DROP TRIGGER IF EXISTS Cap_Score_On_Insert;

DELIMITER //

-- ----------------------------------------------------------
-- 3.1 FUNCTIONS
-- ----------------------------------------------------------

-- Function 1: Calculate user's total best score (best score per problem, summed)
CREATE FUNCTION GetUserTotalScore(p_user_id INT) 
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total INT DEFAULT 0;
    
    SELECT COALESCE(SUM(max_score), 0) INTO total
    FROM (
        SELECT MAX(score) AS max_score
        FROM submissions
        WHERE user_id = p_user_id
        GROUP BY problem_id
    ) AS BestScores;
    
    RETURN total;
END //

-- Function 2: Determine a contest's status based on current time
CREATE FUNCTION GetContestStatus(p_contest_id INT) 
RETURNS VARCHAR(10)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_start DATETIME;
    DECLARE v_end DATETIME;
    DECLARE v_status VARCHAR(10);
    
    SELECT start_time, end_time INTO v_start, v_end
    FROM contests
    WHERE contest_id = p_contest_id;
    
    IF NOW() < v_start THEN
        SET v_status = 'UPCOMING';
    ELSEIF NOW() BETWEEN v_start AND v_end THEN
        SET v_status = 'ONGOING';
    ELSE
        SET v_status = 'ENDED';
    END IF;
    
    RETURN v_status;
END //

-- ----------------------------------------------------------
-- 3.2 TRIGGERS with Exception Handling
-- ----------------------------------------------------------

-- Trigger 1: Prevent submissions after a contest has ended
-- Uses SIGNAL SQLSTATE for custom exception handling
CREATE TRIGGER Prevent_Submission_After_Contest
BEFORE INSERT ON submissions
FOR EACH ROW
BEGIN
    DECLARE contestEndTime DATETIME;
    
    SELECT end_time INTO contestEndTime
    FROM contests
    WHERE contest_id = NEW.contest_id;
    
    -- Exception: block late submissions
    IF NOW() > contestEndTime THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Exception: Cannot submit code after contest end time.';
    END IF;
END //

-- Trigger 2: Automatically cap the score at the problem's max_score on insert
CREATE TRIGGER Cap_Score_On_Insert
BEFORE INSERT ON submissions
FOR EACH ROW
BEGIN
    DECLARE v_max_score INT;
    
    SELECT max_score INTO v_max_score
    FROM problems
    WHERE problem_id = NEW.problem_id;
    
    -- Exception: reject negative scores
    IF NEW.score < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Exception: Submission score cannot be negative.';
    END IF;
    
    -- Auto-cap score to max allowed
    IF NEW.score > v_max_score THEN
        SET NEW.score = v_max_score;
    END IF;
END //

-- ----------------------------------------------------------
-- 3.3 CURSORS and EXCEPTION HANDLING
-- ----------------------------------------------------------

-- Stored Procedure: Generate a performance report across all contests using a Cursor
CREATE PROCEDURE GeneratePerformanceReport()
BEGIN
    -- Variable declarations
    DECLARE done INT DEFAULT FALSE;
    DECLARE var_contest_id INT;
    DECLARE var_contest_title VARCHAR(100);
    DECLARE var_participant_count INT;
    DECLARE var_avg_score DECIMAL(10,2);
    DECLARE var_total_submissions INT;
    DECLARE var_best_score INT;
    
    -- Cursor declaration: iterate over all contests
    DECLARE contest_cursor CURSOR FOR 
        SELECT contest_id, title FROM contests;
        
    -- Exception Handler 1: CONTINUE handler for end-of-cursor (NOT FOUND)
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Exception Handler 2: EXIT handler for general SQL exceptions
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SELECT 'An error occurred while generating the report.' AS ErrorMessage;
        ROLLBACK;
    END;

    -- Create a temporary table to store the report
    CREATE TEMPORARY TABLE IF NOT EXISTS Temp_Performance_Report (
        contest_title VARCHAR(100),
        participants INT,
        total_submissions INT,
        average_score DECIMAL(10,2),
        best_score INT
    );
    
    TRUNCATE TABLE Temp_Performance_Report;

    -- Open the cursor
    OPEN contest_cursor;

    -- Iterate through each contest using the cursor
    read_loop: LOOP
        FETCH contest_cursor INTO var_contest_id, var_contest_title;
        
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Aggregate data per contest
        SELECT COUNT(user_id) INTO var_participant_count 
        FROM participations 
        WHERE contest_id = var_contest_id;

        SELECT COALESCE(AVG(score), 0) INTO var_avg_score 
        FROM submissions 
        WHERE contest_id = var_contest_id;

        SELECT COUNT(submission_id) INTO var_total_submissions 
        FROM submissions 
        WHERE contest_id = var_contest_id;

        SELECT COALESCE(MAX(score), 0) INTO var_best_score 
        FROM submissions 
        WHERE contest_id = var_contest_id;
        
        -- Insert aggregated data into the report
        INSERT INTO Temp_Performance_Report 
            (contest_title, participants, total_submissions, average_score, best_score)
        VALUES 
            (var_contest_title, var_participant_count, var_total_submissions, var_avg_score, var_best_score);
        
    END LOOP;

    -- Close the cursor
    CLOSE contest_cursor;
    
    -- Output the generated report
    SELECT * FROM Temp_Performance_Report;
    
    -- Clean up temporary table
    DROP TEMPORARY TABLE IF EXISTS Temp_Performance_Report;

END //

DELIMITER ;

-- ==========================================================
-- Testing the Implementations
-- ==========================================================

-- Test Function 1: Get total best score for user 'sayan' (user_id = 2)
SELECT GetUserTotalScore(2) AS sayan_best_total;

-- Test Function 2: Get computed contest status
SELECT GetContestStatus(1) AS contest_1_status;

-- Test Procedure: Generate the performance report
CALL GeneratePerformanceReport();

-- Create database
CREATE DATABASE IF NOT EXISTS `codearena`;
USE `codearena`;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Contests Table
CREATE TABLE IF NOT EXISTS contests (
  contest_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_minutes INT DEFAULT 120,
  status ENUM('UPCOMING','ONGOING','ENDED') NOT NULL DEFAULT 'UPCOMING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Problems Table
CREATE TABLE IF NOT EXISTS problems (
  problem_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  difficulty ENUM('EASY','MEDIUM','HARD') NOT NULL,
  max_score INT NOT NULL
) ENGINE=InnoDB;

-- Contest_Problems Junction Table
CREATE TABLE IF NOT EXISTS contest_problems (
  contest_id INT NOT NULL,
  problem_id INT NOT NULL,
  PRIMARY KEY (contest_id, problem_id),
  FOREIGN KEY (contest_id) REFERENCES contests(contest_id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(problem_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  submission_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  contest_id INT NOT NULL,
  problem_id INT NOT NULL,
  code TEXT,
  language VARCHAR(30) DEFAULT 'cpp',
  score INT DEFAULT 0,
  submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (contest_id) REFERENCES contests(contest_id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(problem_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Participations Table
CREATE TABLE IF NOT EXISTS participations (
  participation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  contest_id INT NOT NULL,
  join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  start_time DATETIME NULL,
  status ENUM('JOINED','STARTED','FINISHED') DEFAULT 'JOINED',
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (contest_id) REFERENCES contests(contest_id) ON DELETE CASCADE,
  UNIQUE KEY unique_participation (user_id, contest_id)
) ENGINE=InnoDB;

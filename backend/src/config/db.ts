const mysql = require('mysql2/promise');
import dotenv from 'dotenv';
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

const pool = mysql.createPool({
  ...DB_CONFIG,
  database: 'codearena',
  waitForConnections: true,
  connectionLimit: 10,
});

const DB_NAME = 'codearena';

async function initializeDatabase() {
  let connection;
  try {
    // Connect without specifying a database first
    connection = await mysql.createConnection(DB_CONFIG);

    // Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.query(`USE \`${DB_NAME}\``);

    console.log(`✅ Database "${DB_NAME}" ready.`);

    // ── USER table ──
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    console.log('  ✓ users');

    // ── CONTEST table ──
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contests (
        contest_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        duration_minutes INT NOT NULL DEFAULT 120,
        status ENUM('UPCOMING','ONGOING','ENDED') NOT NULL DEFAULT 'UPCOMING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    
    // Auto-migrate if duration_minutes doesn't exist
    try {
      await connection.query('ALTER TABLE contests ADD COLUMN duration_minutes INT NOT NULL DEFAULT 120');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.warn('Migration warning:', e.message);
    }
    console.log('  ✓ contests');

    // ── PROBLEM table ──
    await connection.query(`
      CREATE TABLE IF NOT EXISTS problems (
        problem_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        difficulty ENUM('EASY','MEDIUM','HARD') NOT NULL,
        max_score INT NOT NULL
      ) ENGINE=InnoDB
    `);
    console.log('  ✓ problems');

    // ── CONTEST_PROBLEM junction table ──
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contest_problems (
        contest_id INT NOT NULL,
        problem_id INT NOT NULL,
        PRIMARY KEY (contest_id, problem_id),
        FOREIGN KEY (contest_id) REFERENCES contests(contest_id) ON DELETE CASCADE,
        FOREIGN KEY (problem_id) REFERENCES problems(problem_id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    console.log('  ✓ contest_problems');

    // ── SUBMISSION table_ ──
    await connection.query(`
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
      ) ENGINE=InnoDB
    `);
    console.log('  ✓ submissions');

    // ── PARTICIPATION table ──
    await connection.query(`
      CREATE TABLE IF NOT EXISTS participations (
        participation_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        contest_id INT NOT NULL,
        status ENUM('REGISTERED', 'STARTED', 'FINISHED') NOT NULL DEFAULT 'REGISTERED',
        start_time DATETIME NULL,
        join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (contest_id) REFERENCES contests(contest_id) ON DELETE CASCADE,
        UNIQUE KEY unique_participation (user_id, contest_id)
      ) ENGINE=InnoDB
    `);
    
    // Auto-migrate for existing participations table
    try {
      await connection.query("ALTER TABLE participations ADD COLUMN status ENUM('REGISTERED', 'STARTED', 'FINISHED') NOT NULL DEFAULT 'REGISTERED', ADD COLUMN start_time DATETIME NULL");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.warn('Migration warning:', e.message);
    }
    console.log('  ✓ participations');

    console.log('\n🎉 All tables created successfully!');
  } catch (err) {
    console.error('❌ Database initialization failed:', (err as any).message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

// Run if executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { DB_CONFIG, DB_NAME, initializeDatabase, pool };

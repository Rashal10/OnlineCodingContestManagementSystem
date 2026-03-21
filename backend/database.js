const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
};

const DB_NAME = 'codearena';

async function executeSqlFile(connection, filePath) {
    try {
        const rawSql = await fs.readFile(filePath, 'utf8');

        // We need to handle DELIMITER commands manually since mysql2 doesn't support them out of the box
        let currentDelimiter = ';';
        const statements = [];
        let currentStatement = '';

        const lines = rawSql.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.toUpperCase().startsWith('DELIMITER ')) {
                currentDelimiter = trimmedLine.split(' ')[1];
                continue;
            }

            if (trimmedLine === '' || trimmedLine.startsWith('--')) {
                continue;
            }

            currentStatement += line + '\n';

            if (trimmedLine.endsWith(currentDelimiter)) {
                // Remove the custom delimiter if it's not the default one
                if (currentDelimiter !== ';') {
                    const finalStmt = currentStatement.trim().slice(0, -currentDelimiter.length).trim();
                    if (finalStmt) statements.push(finalStmt);
                } else {
                    statements.push(currentStatement);
                }
                currentStatement = '';
            }
        }

        if (currentStatement.trim() && currentDelimiter !== ';') {
            statements.push(currentStatement.trim().slice(0, -currentDelimiter.length));
        } else if (currentStatement.trim()) {
            statements.push(currentStatement);
        }

        for (const stmt of statements) {
            if (stmt.trim()) {
                await connection.query(stmt);
            }
        }
    } catch (err) {
        console.error(`Error executing ${path.basename(filePath)}:`, err.message);
        throw err;
    }
}

async function initializeDatabase() {
    console.log('🔄 Initializing database schema and procedures...');
    let connection;
    try {
        // Connect without database first to create it if it doesn't exist
        connection = await mysql.createConnection(DB_CONFIG);

        const schemaPath = path.join(__dirname, '../database/schema.sql');

        console.log('  Executing schema.sql...');
        await executeSqlFile(connection, schemaPath);

        console.log('✅ Database initialization complete!');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

module.exports = {
    DB_CONFIG,
    DB_NAME,
    initializeDatabase,
};

import express from 'express';
import { Request, Response } from 'express';
const { pool } = require('../config/db');

const router = express.Router();

// Global leaderboard
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await pool.execute(
            `SELECT u.user_id, u.username, SUM(s.score) AS total_score, COUNT(s.submission_id) AS submissions
             FROM submissions s
             JOIN users u ON s.user_id = u.user_id
             GROUP BY u.user_id, u.username
             ORDER BY total_score DESC`
        );
        const leaderboard = rows.map((row: any, i: number) => ({ rank: i + 1, ...row }));
        res.json(leaderboard);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Contest leaderboard
router.get('/:contestId', async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await pool.execute(
            `SELECT u.user_id, u.username, SUM(s.score) AS total_score, COUNT(s.submission_id) AS submissions
             FROM submissions s
             JOIN users u ON s.user_id = u.user_id
             WHERE s.contest_id = ?
             GROUP BY u.user_id, u.username
             ORDER BY total_score DESC`,
            [req.params.contestId]
        );
        const leaderboard = rows.map((row: any, i: number) => ({ rank: i + 1, ...row }));
        res.json(leaderboard);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

import express from 'express';
import { Request, Response } from 'express';
const { pool } = require('../config/db');

const router = express.Router();

// Platform statistics
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await pool.execute(
            `SELECT
                (SELECT COUNT(*) FROM contests) AS totalContests,
                (SELECT COUNT(*) FROM problems) AS totalProblems,
                (SELECT COUNT(*) FROM submissions) AS totalSubmissions,
                (SELECT COUNT(*) FROM users) AS totalUsers`
        );

        res.json(rows?.[0] ?? {
            totalContests: 0,
            totalProblems: 0,
            totalSubmissions: 0,
            totalUsers: 0
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

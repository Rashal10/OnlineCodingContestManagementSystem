import express from 'express';
import { Request, Response } from 'express';
import { protect, AuthRequest } from '../middleware/authMiddleware';
const { pool } = require('../config/db');

const router = express.Router();

// List submissions (with optional filters)
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        let query = `
            SELECT s.*, u.username, c.title AS contest_title, p.title AS problem_title
            FROM submissions s
            JOIN users u ON s.user_id = u.user_id
            JOIN contests c ON s.contest_id = c.contest_id
            JOIN problems p ON s.problem_id = p.problem_id
        `;
        const conditions: string[] = [];
        const params: any[] = [];

        if (req.query.user_id) { conditions.push('s.user_id = ?'); params.push(req.query.user_id); }
        if (req.query.contest_id) { conditions.push('s.contest_id = ?'); params.push(req.query.contest_id); }
        if (req.query.problem_id) { conditions.push('s.problem_id = ?'); params.push(req.query.problem_id); }

        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY s.submission_time DESC';

        const [rows]: any = await pool.execute(query, params);
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Submit a solution
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        const { contest_id, problem_id, code, language, score } = req.body;

        if (!user_id || !contest_id || !problem_id) {
            res.status(400).json({ error: 'user_id, contest_id, and problem_id are required' });
            return;
        }

        // Verify contest exists and is ONGOING
        const [contestCheck]: any = await pool.execute(
            'SELECT status, start_time, end_time FROM contests WHERE contest_id = ?', [contest_id]
        );
        if (contestCheck.length === 0) { res.status(404).json({ error: 'Contest not found' }); return; }

        const contest = contestCheck[0];
        const now = new Date();
        if (now < new Date(contest.start_time)) { res.status(403).json({ error: 'Contest has not started yet' }); return; }
        if (now > new Date(contest.end_time) || contest.status === 'ENDED') {
            res.status(403).json({ error: 'Contest has ended, submissions are no longer accepted' }); return;
        }

        // Verify problem belongs to this contest
        const [problemInContest]: any = await pool.execute(
            'SELECT * FROM contest_problems WHERE contest_id = ? AND problem_id = ?', [contest_id, problem_id]
        );
        if (problemInContest.length === 0) { res.status(400).json({ error: 'Problem does not belong to this contest' }); return; }

        // Verify user is participating
        const [participationCheck]: any = await pool.execute(
            'SELECT * FROM participations WHERE user_id = ? AND contest_id = ?', [user_id, contest_id]
        );
        if (participationCheck.length === 0) {
            res.status(403).json({ error: 'User must join the contest before submitting solutions' }); return;
        }

        // Simulate scoring (no real code execution engine)
        // Score is based on code length as a simple heuristic for demo purposes
        const [problemData]: any = await pool.execute('SELECT max_score FROM problems WHERE problem_id = ?', [problem_id]);
        const maxScore = problemData[0]?.max_score || 100;
        const codeLength = (code || '').trim().length;
        // Generate a score: short code gets partial, decent code gets most, very long gets full
        let simulatedScore = Math.min(Math.floor(maxScore * Math.min(codeLength / 80, 1) * (0.6 + Math.random() * 0.4)), maxScore);
        if (simulatedScore < 10) simulatedScore = Math.floor(maxScore * 0.3); // minimum 30% for any submission

        const [result]: any = await pool.execute(
            'INSERT INTO submissions (user_id, contest_id, problem_id, code, language, score) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, contest_id, problem_id, code || '', language || 'cpp', simulatedScore]
        );

        res.status(201).json({ submission_id: result.insertId, score: simulatedScore, message: 'Solution submitted successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// List participations
router.get('/participations', async (req: Request, res: Response): Promise<void> => {
    try {
        let query = `
            SELECT pa.*, u.username, c.title AS contest_title
            FROM participations pa
            JOIN users u ON pa.user_id = u.user_id
            JOIN contests c ON pa.contest_id = c.contest_id
        `;
        const conditions: string[] = [];
        const params: any[] = [];
        if (req.query.user_id) { conditions.push('pa.user_id = ?'); params.push(req.query.user_id); }
        if (req.query.contest_id) { conditions.push('pa.contest_id = ?'); params.push(req.query.contest_id); }

        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY pa.join_time DESC';

        const [rows]: any = await pool.execute(query, params);
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Join a contest
router.post('/participations', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        const { contest_id } = req.body;

        if (!user_id || !contest_id) {
            res.status(400).json({ error: 'user_id and contest_id are required' }); return;
        }

        const [contestCheck]: any = await pool.execute(
            'SELECT status, end_time FROM contests WHERE contest_id = ?', [contest_id]
        );
        if (contestCheck.length === 0) { res.status(404).json({ error: 'Contest not found' }); return; }

        const contest = contestCheck[0];
        if (new Date() > new Date(contest.end_time) || contest.status === 'ENDED') {
            res.status(403).json({ error: 'Cannot join a contest that has ended' }); return;
        }

        const [result]: any = await pool.execute(
            'INSERT INTO participations (user_id, contest_id) VALUES (?, ?)', [user_id, contest_id]
        );

        res.status(201).json({ participation_id: result.insertId, message: 'Successfully joined contest' });
    } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') { res.status(409).json({ error: 'User already joined this contest' }); return; }
        res.status(500).json({ error: err.message });
    }
});

export default router;

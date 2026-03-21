import express from 'express';
import { Request, Response } from 'express';
import { protect, admin } from '../middleware/authMiddleware';
const { pool } = require('../config/db');

const router = express.Router();

// List all contests
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM contests ORDER BY start_time DESC');
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get contest by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM contests WHERE contest_id = ?', [req.params.id]);
        if (rows.length === 0) { res.status(404).json({ error: 'Contest not found' }); return; }
        res.json(rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Create contest (admin only)
router.post('/', protect, admin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, start_time, end_time, duration_minutes, status } = req.body;
        if (!title || !description || !start_time || !end_time) {
            res.status(400).json({ error: 'title, description, start_time, and end_time are required' });
            return;
        }

        const dur = duration_minutes || 120;
        const [result]: any = await pool.execute(
            'INSERT INTO contests (title, description, start_time, end_time, duration_minutes, status) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, start_time, end_time, dur, status || 'UPCOMING']
        );

        res.status(201).json({ contest_id: result.insertId, title, status: status || 'UPCOMING', duration_minutes: dur });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Update contest (admin only)
router.put('/:id', protect, admin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, start_time, end_time, duration_minutes, status } = req.body;
        const dur = duration_minutes || 120;
        const [result]: any = await pool.execute(
            'UPDATE contests SET title = ?, description = ?, start_time = ?, end_time = ?, duration_minutes = ?, status = ? WHERE contest_id = ?',
            [title, description, start_time, end_time, dur, status, req.params.id]
        );
        if (result.affectedRows === 0) { res.status(404).json({ error: 'Contest not found' }); return; }
        res.json({ message: 'Contest updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Delete contest (admin only)
router.delete('/:id', protect, admin, async (req: Request, res: Response): Promise<void> => {
    try {
        const [result]: any = await pool.execute('DELETE FROM contests WHERE contest_id = ?', [req.params.id]);
        if (result.affectedRows === 0) { res.status(404).json({ error: 'Contest not found' }); return; }
        res.json({ message: 'Contest deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get problems in a contest
router.get('/:id/problems', async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await pool.execute(
            `SELECT p.* FROM problems p
             JOIN contest_problems cp ON p.problem_id = cp.problem_id
             WHERE cp.contest_id = ? ORDER BY p.problem_id`,
            [req.params.id]
        );
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Add problem to contest (admin only)
router.post('/:id/problems', protect, admin, async (req: Request, res: Response): Promise<void> => {
    try {
        const contestId = req.params.id;
        const { problem_id } = req.body;
        if (!problem_id) { res.status(400).json({ error: 'problem_id is required' }); return; }

        const [contestCheck]: any = await pool.execute('SELECT contest_id FROM contests WHERE contest_id = ?', [contestId]);
        if (contestCheck.length === 0) { res.status(404).json({ error: 'Contest not found' }); return; }

        const [problemCheck]: any = await pool.execute('SELECT problem_id FROM problems WHERE problem_id = ?', [problem_id]);
        if (problemCheck.length === 0) { res.status(404).json({ error: 'Problem not found' }); return; }

        await pool.execute('INSERT INTO contest_problems (contest_id, problem_id) VALUES (?, ?)', [contestId, problem_id]);
        res.status(201).json({ message: 'Problem added to contest successfully' });
    } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') { res.status(409).json({ error: 'Problem already assigned to this contest' }); return; }
        res.status(500).json({ error: err.message });
    }
});

// Remove problem from contest (admin only)
router.delete('/:id/problems/:problemId', protect, admin, async (req: Request, res: Response): Promise<void> => {
    try {
        const [result]: any = await pool.execute(
            'DELETE FROM contest_problems WHERE contest_id = ? AND problem_id = ?',
            [req.params.id, req.params.problemId]
        );
        if (result.affectedRows === 0) { res.status(404).json({ error: 'Problem not found in this contest' }); return; }
        res.json({ message: 'Problem removed from contest successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get active contest participation for logged in user
router.get('/me/active-participation', protect, async (req: any, res: Response): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        const [rows]: any = await pool.execute(
            `SELECT p.*, c.duration_minutes 
             FROM participations p 
             JOIN contests c ON p.contest_id = c.contest_id 
             WHERE p.user_id = ? AND p.status = 'STARTED'`,
            [user_id]
        );
        
        if (rows.length === 0) {
            res.json({ active_contest_id: null });
            return;
        }

        const active = rows[0];
        // Check if expired
        const start = new Date(active.start_time).getTime();
        const now = Date.now();
        const durationMs = active.duration_minutes * 60000;

        if (now - start > durationMs) {
            // Auto finish expired contest
            await pool.execute('UPDATE participations SET status = "FINISHED" WHERE participation_id = ?', [active.participation_id]);
            res.json({ active_contest_id: null });
        } else {
            res.json({ 
                active_contest_id: active.contest_id,
                start_time: active.start_time,
                duration_minutes: active.duration_minutes
            });
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Start an exam (Locked Contest Mode)
router.post('/:id/start', protect, async (req: any, res: Response): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        const contest_id = req.params.id;

        const [part]: any = await pool.execute('SELECT * FROM participations WHERE user_id = ? AND contest_id = ?', [user_id, contest_id]);
        if (part.length === 0) { res.status(404).json({ error: 'You have not joined this contest' }); return; }

        if (part[0].status === 'FINISHED') { res.status(400).json({ error: 'You have already finished this exam' }); return; }
        if (part[0].status === 'STARTED') { res.json({ message: 'Already started' }); return; }

        // Needs to be ONGOING
        const [contest]: any = await pool.execute('SELECT status FROM contests WHERE contest_id = ?', [contest_id]);
        if (contest[0].status !== 'ONGOING') { res.status(400).json({ error: 'Contest is not active' }); return; }

        await pool.execute('UPDATE participations SET status = "STARTED", start_time = NOW() WHERE user_id = ? AND contest_id = ?', [user_id, contest_id]);
        res.json({ message: 'Exam started successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Finish an exam
router.post('/:id/finish', protect, async (req: any, res: Response): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        const contest_id = req.params.id;
        
        await pool.execute('UPDATE participations SET status = "FINISHED" WHERE user_id = ? AND contest_id = ?', [user_id, contest_id]);
        res.json({ message: 'Exam finished successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

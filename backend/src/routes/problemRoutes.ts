import express from 'express';
import { Request, Response } from 'express';
import { protect, admin } from '../middleware/authMiddleware';
const { pool } = require('../config/db');

const router = express.Router();

// List all problems
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM problems ORDER BY problem_id');
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get problem by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM problems WHERE problem_id = ?', [req.params.id]);
        if (rows.length === 0) { res.status(404).json({ error: 'Problem not found' }); return; }
        res.json(rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Create problem (admin only)
router.post('/', protect, admin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, difficulty, max_score } = req.body;

        if (!title || !description || !difficulty || !max_score) {
            res.status(400).json({ error: 'title, description, difficulty, and max_score are required' });
            return;
        }

        if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
            res.status(400).json({ error: 'difficulty must be EASY, MEDIUM, or HARD' });
            return;
        }

        const [result]: any = await pool.execute(
            'INSERT INTO problems (title, description, difficulty, max_score) VALUES (?, ?, ?, ?)',
            [title, description, difficulty, max_score]
        );

        res.status(201).json({ problem_id: result.insertId, title, difficulty, max_score });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Update problem (admin only)
router.put('/:id', protect, admin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, difficulty, max_score } = req.body;

        if (!title || !description || !difficulty || !max_score) {
            res.status(400).json({ error: 'title, description, difficulty, and max_score are required' });
            return;
        }

        if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
            res.status(400).json({ error: 'difficulty must be EASY, MEDIUM, or HARD' });
            return;
        }

        const [result]: any = await pool.execute(
            'UPDATE problems SET title = ?, description = ?, difficulty = ?, max_score = ? WHERE problem_id = ?',
            [title, description, difficulty, max_score, req.params.id]
        );

        if (result.affectedRows === 0) { res.status(404).json({ error: 'Problem not found' }); return; }
        res.json({ message: 'Problem updated successfully', problem_id: req.params.id });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Delete problem (admin only)
router.delete('/:id', protect, admin, async (req: Request, res: Response): Promise<void> => {
    try {
        const [result]: any = await pool.execute('DELETE FROM problems WHERE problem_id = ?', [req.params.id]);
        if (result.affectedRows === 0) { res.status(404).json({ error: 'Problem not found' }); return; }
        res.json({ message: 'Problem deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

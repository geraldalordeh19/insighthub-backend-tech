const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');

// POST /api/bookmarks  - toggle bookmark
router.post('/', authMiddleware, async (req, res) => {
  const { project_id } = req.body;

  if (!project_id) {
    return res.status(400).json({ error: 'Project ID is required.' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND project_id = $2',
      [req.user.id, project_id]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM bookmarks WHERE user_id = $1 AND project_id = $2', [req.user.id, project_id]);
      return res.json({ bookmarked: false, message: 'Bookmark removed.' });
    } else {
      await pool.query('INSERT INTO bookmarks (user_id, project_id) VALUES ($1, $2)', [req.user.id, project_id]);
      return res.json({ bookmarked: true, message: 'Project bookmarked.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/bookmarks  - get current user's bookmarks
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as author_name, b.created_at as bookmarked_at
      FROM bookmarks b
      JOIN projects p ON b.project_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/bookmarks/check/:project_id  - check if bookmarked
router.get('/check/:project_id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND project_id = $2',
      [req.user.id, req.params.project_id]
    );
    res.json({ bookmarked: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

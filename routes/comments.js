const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');

// POST /api/comments  - add a comment
router.post('/', authMiddleware, async (req, res) => {
  const { project_id, content } = req.body;

  if (!project_id || !content) {
    return res.status(400).json({ error: 'Project ID and content are required.' });
  }

  try {
    const check = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND status = 'approved'",
      [project_id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const result = await pool.query(`
      INSERT INTO comments (project_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *, (SELECT name FROM users WHERE id = $2) as commenter_name
    `, [project_id, req.user.id, content]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/comments/:id  - delete own comment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or not yours.' });
    }
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

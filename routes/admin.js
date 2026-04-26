const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { adminMiddleware } = require('../middleware/authMiddleware');

// GET /api/admin/projects  - all projects including pending
router.get('/projects', adminMiddleware, async (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT p.*, u.name as author_name, u.email as author_email,
           COUNT(DISTINCT c.id) as comment_count
    FROM projects p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN comments c ON c.project_id = p.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE p.status = $1';
    params.push(status);
  }

  query += ' GROUP BY p.id, u.name, u.email ORDER BY p.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/admin/projects/:id  - approve / reject / edit
router.patch('/projects/:id', adminMiddleware, async (req, res) => {
  const { status, title, abstract, department, supervisor, year, tags, technologies } = req.body;

  const allowed = ['approved', 'rejected', 'pending'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  try {
    const fields = [];
    const params = [];
    let i = 1;

    if (status)       { fields.push(`status = $${i++}`);       params.push(status); }
    if (title)        { fields.push(`title = $${i++}`);        params.push(title); }
    if (abstract)     { fields.push(`abstract = $${i++}`);     params.push(abstract); }
    if (department)   { fields.push(`department = $${i++}`);   params.push(department); }
    if (supervisor)   { fields.push(`supervisor = $${i++}`);   params.push(supervisor); }
    if (year)         { fields.push(`year = $${i++}`);         params.push(year); }
    if (tags)         { fields.push(`tags = $${i++}`);         params.push(tags); }
    if (technologies) { fields.push(`technologies = $${i++}`); params.push(technologies); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/admin/projects/:id  - delete a project
router.delete('/projects/:id', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/stats  - platform statistics
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'pending') as pending_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'approved') as approved_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'rejected') as rejected_projects,
        (SELECT COUNT(*) FROM comments) as total_comments,
        (SELECT COUNT(*) FROM bookmarks) as total_bookmarks
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/users  - list all users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

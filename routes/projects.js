const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/projects  - list all APPROVED projects with search/filter
router.get('/', async (req, res) => {
  const { search, department, year, tags, technology } = req.query;

  let query = `
    SELECT p.*, u.name as author_name,
           COUNT(DISTINCT c.id) as comment_count,
           COUNT(DISTINCT b.id) as bookmark_count
    FROM projects p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN comments c ON c.project_id = p.id
    LEFT JOIN bookmarks b ON b.project_id = p.id
    WHERE p.status = 'approved'
  `;
  const params = [];
  let i = 1;

  if (search) {
    query += ` AND (p.title ILIKE $${i} OR p.abstract ILIKE $${i} OR p.tags ILIKE $${i} OR p.technologies ILIKE $${i})`;
    params.push(`%${search}%`);
    i++;
  }
  if (department) {
    query += ` AND p.department ILIKE $${i}`;
    params.push(`%${department}%`);
    i++;
  }
  if (year) {
    query += ` AND p.year = $${i}`;
    params.push(parseInt(year));
    i++;
  }
  if (tags) {
    query += ` AND p.tags ILIKE $${i}`;
    params.push(`%${tags}%`);
    i++;
  }
  if (technology) {
    query += ` AND p.technologies ILIKE $${i}`;
    params.push(`%${technology}%`);
    i++;
  }

  query += ' GROUP BY p.id, u.name ORDER BY p.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching projects.' });
  }
});

// GET /api/projects/:id  - single project detail
router.get('/:id', async (req, res) => {
  try {
    const project = await pool.query(`
      SELECT p.*, u.name as author_name, u.email as author_email
      FROM projects p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND (p.status = 'approved' OR p.user_id = $2)
    `, [req.params.id, req.user?.id || 0]);

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const comments = await pool.query(`
      SELECT c.*, u.name as commenter_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.project_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.id]);

    res.json({ ...project.rows[0], comments: comments.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/projects  - submit a new project
router.post('/', authMiddleware, async (req, res) => {
  const { title, abstract, department, supervisor, year, file_url, demo_link, tags, technologies, student_name } = req.body;

  if (!title || !abstract || !department) {
    return res.status(400).json({ error: 'Title, abstract, and department are required.' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO projects (user_id, title, abstract, department, supervisor, year, file_url, demo_link, tags, technologies, student_name, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending')
      RETURNING *
    `, [req.user.id, title, abstract, department, supervisor, year, file_url, demo_link, tags, technologies, student_name || req.user.name]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error submitting project.' });
  }
});

// GET /api/projects/my/submissions  - get current user's submissions
router.get('/my/submissions', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

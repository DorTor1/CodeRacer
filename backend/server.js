const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coderacer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Routes

// GET /api/snippet - Get random code snippet
app.get('/api/snippet', async (req, res) => {
  try {
    const language = req.query.language || null;
    let query = 'SELECT * FROM code_snippets';
    let params = [];
    
    if (language) {
      query += ' WHERE language = $1';
      params.push(language);
    }
    
    query += ' ORDER BY RANDOM() LIMIT 1';
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No snippets found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching snippet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/result - Save race result
app.post('/api/result', async (req, res) => {
  try {
    const { userId, snippetId, wpm, accuracy, time } = req.body;
    
    if (!snippetId || wpm === undefined || accuracy === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await pool.query(
      `INSERT INTO race_results (user_id, snippet_id, wpm, accuracy, time, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [userId || null, snippetId, wpm, accuracy, time || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/profile/:userId - Get user profile and statistics
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user statistics
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_races,
        AVG(wpm) as avg_wpm,
        MAX(wpm) as best_wpm,
        AVG(accuracy) as avg_accuracy,
        MAX(accuracy) as best_accuracy
       FROM race_results
       WHERE user_id = $1`,
      [userId]
    );
    
    // Get recent results
    const recentResults = await pool.query(
      `SELECT r.*, s.language, s.title
       FROM race_results r
       JOIN code_snippets s ON r.snippet_id = s.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [userId]
    );
    
    res.json({
      userId,
      statistics: statsResult.rows[0],
      recentResults: recentResults.rows
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboard - Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const language = req.query.language || null;
    const limit = parseInt(req.query.limit) || 10;
    
    let query = `
      SELECT 
        user_id,
        MAX(wpm) as best_wpm,
        AVG(wpm) as avg_wpm,
        AVG(accuracy) as avg_accuracy,
        COUNT(*) as total_races
      FROM race_results r
    `;
    
    let params = [];
    
    if (language) {
      query += ` JOIN code_snippets s ON r.snippet_id = s.id WHERE s.language = $1`;
      params.push(language);
    }
    
    query += `
      GROUP BY user_id
      ORDER BY best_wpm DESC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;


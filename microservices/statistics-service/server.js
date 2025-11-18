const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection (используем ту же БД что и основной бэкенд)
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coderacer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Statistics Service: Database connection error:', err);
  } else {
    console.log('Statistics Service: Database connected successfully');
  }
});

// GET /api/statistics/overview - Общая статистика
app.get('/api/statistics/overview', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(*) as total_races,
        AVG(wpm) as avg_wpm,
        MAX(wpm) as max_wpm,
        AVG(accuracy) as avg_accuracy,
        AVG(time) as avg_time
      FROM race_results
      WHERE user_id IS NOT NULL
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching overview statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/statistics/language/:language - Статистика по языку
app.get('/api/statistics/language/:language', async (req, res) => {
  try {
    const { language } = req.params;
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_races,
        AVG(r.wpm) as avg_wpm,
        MAX(r.wpm) as max_wpm,
        AVG(r.accuracy) as avg_accuracy,
        COUNT(DISTINCT r.user_id) as unique_players
      FROM race_results r
      JOIN code_snippets s ON r.snippet_id = s.id
      WHERE s.language = $1
    `, [language]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No statistics found for this language' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching language statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/statistics/user/:userId - Статистика пользователя
app.get('/api/statistics/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_races,
        AVG(wpm) as avg_wpm,
        MAX(wpm) as best_wpm,
        AVG(accuracy) as avg_accuracy,
        MAX(accuracy) as best_accuracy,
        AVG(time) as avg_time,
        MIN(time) as best_time
      FROM race_results
      WHERE user_id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/statistics/trends - Тренды за последние дни
app.get('/api/statistics/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as races_count,
        AVG(wpm) as avg_wpm,
        AVG(accuracy) as avg_accuracy,
        COUNT(DISTINCT user_id) as unique_users
      FROM race_results
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/statistics/analyze - Анализ данных (вызывается основным бэкендом)
app.post('/api/statistics/analyze', async (req, res) => {
  try {
    const { userId, snippetId, wpm, accuracy } = req.body;
    
    // Анализируем результат и возвращаем insights
    const insights = {
      performance: wpm > 100 ? 'excellent' : wpm > 60 ? 'good' : 'needs_improvement',
      accuracy_level: accuracy > 95 ? 'excellent' : accuracy > 85 ? 'good' : 'needs_improvement',
      recommendation: wpm > 100 && accuracy > 95 
        ? 'Try harder snippets!' 
        : accuracy < 85 
        ? 'Focus on accuracy first' 
        : 'Keep practicing!'
    };
    
    res.json(insights);
  } catch (error) {
    console.error('Error analyzing statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'statistics-service',
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`Statistics Service is running on port ${PORT}`);
});

module.exports = app;


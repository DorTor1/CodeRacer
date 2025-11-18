const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
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
    console.error('Notification Service: Database connection error:', err);
  } else {
    console.log('Notification Service: Database connected successfully');
  }
});

// Хранилище уведомлений (в реальном проекте можно использовать Redis или БД)
const notifications = [];

// POST /api/notifications/send - Отправить уведомление
app.post('/api/notifications/send', async (req, res) => {
  try {
    const { userId, type, message, data } = req.body;
    
    if (!userId || !type || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const notification = {
      id: Date.now().toString(),
      userId,
      type, // 'achievement', 'record', 'milestone', 'info'
      message,
      data: data || {},
      timestamp: new Date().toISOString(),
      read: false
    };
    
    notifications.push(notification);
    
    // В реальном проекте здесь можно отправить email, push-уведомление и т.д.
    console.log(`Notification sent to user ${userId}: ${message}`);
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/notifications/user/:userId - Получить уведомления пользователя
app.get('/api/notifications/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const userNotifications = notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    res.json(userNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notifications/check-achievements - Проверить достижения
app.post('/api/notifications/check-achievements', async (req, res) => {
  try {
    const { userId, wpm, accuracy, totalRaces } = req.body;
    
    const achievements = [];
    
    // Проверяем различные достижения
    if (wpm >= 100 && wpm < 120) {
      achievements.push({
        type: 'achievement',
        message: '🎯 Отличная скорость! Вы достигли 100+ WPM!',
        badge: 'speed_100'
      });
    }
    
    if (wpm >= 120) {
      achievements.push({
        type: 'achievement',
        message: '🚀 Превосходно! Вы достигли 120+ WPM!',
        badge: 'speed_120'
      });
    }
    
    if (accuracy >= 100) {
      achievements.push({
        type: 'achievement',
        message: '💯 Идеальная точность! 100% без ошибок!',
        badge: 'perfect_accuracy'
      });
    }
    
    if (totalRaces === 10) {
      achievements.push({
        type: 'milestone',
        message: '🏆 Поздравляем! Вы завершили 10 гонок!',
        badge: 'races_10'
      });
    }
    
    if (totalRaces === 50) {
      achievements.push({
        type: 'milestone',
        message: '🌟 Невероятно! Вы завершили 50 гонок!',
        badge: 'races_50'
      });
    }
    
    // Отправляем уведомления о достижениях
    for (const achievement of achievements) {
      await fetch(`http://localhost:${PORT}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: achievement.type,
          message: achievement.message,
          data: { badge: achievement.badge }
        })
      }).catch(err => console.error('Error sending achievement notification:', err));
    }
    
    res.json({ achievements });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notifications/check-records - Проверить рекорды
app.post('/api/notifications/check-records', async (req, res) => {
  try {
    const { userId, wpm, language } = req.body;
    
    // Проверяем, является ли это рекордом
    const result = await pool.query(`
      SELECT MAX(wpm) as max_wpm
      FROM race_results r
      JOIN code_snippets s ON r.snippet_id = s.id
      WHERE s.language = $1 AND r.user_id != $2
    `, [language, userId]);
    
    const currentRecord = result.rows[0]?.max_wpm || 0;
    
    if (wpm > currentRecord) {
      const notification = {
        type: 'record',
        message: `🏅 Новый рекорд! Вы установили рекорд ${wpm} WPM для языка ${language}!`,
        data: { wpm, language, previousRecord: currentRecord }
      };
      
      // Отправляем уведомление
      await fetch(`http://localhost:${PORT}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...notification
        })
      }).catch(err => console.error('Error sending record notification:', err));
      
      res.json({ isRecord: true, notification });
    } else {
      res.json({ isRecord: false });
    }
  } catch (error) {
    console.error('Error checking records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/notifications/:id/read - Отметить уведомление как прочитанное
app.put('/api/notifications/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const notification = notifications.find(n => n.id === id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.read = true;
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'notification-service',
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`Notification Service is running on port ${PORT}`);
});

module.exports = app;


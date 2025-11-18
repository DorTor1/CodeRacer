import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function Profile({ userId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/profile/${userId}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  if (!profile) {
    return <div className="error">Не удалось загрузить профиль</div>;
  }

  const stats = profile.statistics;
  const recentResults = profile.recentResults || [];

  return (
    <div className="profile-container">
      <h1>Профиль пользователя</h1>
      <div className="profile-content">
        <div className="stats-section">
          <h2>Статистика</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏁</div>
              <div className="stat-title">Всего гонок</div>
              <div className="stat-value">{stats.total_races || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-title">Лучшая скорость</div>
              <div className="stat-value">{Math.round(stats.best_wpm) || 0} WPM</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-title">Средняя скорость</div>
              <div className="stat-value">{Math.round(stats.avg_wpm) || 0} WPM</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-title">Средняя точность</div>
              <div className="stat-value">{parseFloat(stats.avg_accuracy || 0).toFixed(1)}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-title">Лучшая точность</div>
              <div className="stat-value">{parseFloat(stats.best_accuracy || 0).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div className="recent-results-section">
          <h2>Последние результаты</h2>
          {recentResults.length === 0 ? (
            <div className="no-results">
              <p>У вас пока нет результатов. Начните свою первую гонку!</p>
            </div>
          ) : (
            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Язык</th>
                    <th>Скорость</th>
                    <th>Точность</th>
                    <th>Время</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {recentResults.map((result) => (
                    <tr key={result.id}>
                      <td>{result.language}</td>
                      <td>{result.wpm} WPM</td>
                      <td>{parseFloat(result.accuracy).toFixed(1)}%</td>
                      <td>{result.time || '-'}с</td>
                      <td>{new Date(result.created_at).toLocaleDateString('ru-RU')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;


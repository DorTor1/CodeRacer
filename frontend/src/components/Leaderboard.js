import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Leaderboard.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  useEffect(() => {
    loadLeaderboard();
  }, [selectedLanguage]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const params = selectedLanguage !== 'all' ? { language: selectedLanguage } : {};
      const response = await axios.get(`${API_URL}/api/leaderboard`, { params });
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка таблицы лидеров...</div>;
  }

  return (
    <div className="leaderboard-container">
      <h1>Таблица лидеров</h1>
      
      <div className="filter-section">
        <label htmlFor="language-filter">Фильтр по языку:</label>
        <select
          id="language-filter"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="language-filter"
        >
          <option value="all">Все языки</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="typescript">TypeScript</option>
        </select>
      </div>

      {leaderboard.length === 0 ? (
        <div className="no-leaders">
          <p>Пока нет результатов в таблице лидеров.</p>
          <p>Станьте первым!</p>
        </div>
      ) : (
        <div className="leaderboard-table">
          <table>
            <thead>
              <tr>
                <th>Место</th>
                <th>Пользователь</th>
                <th>Лучшая скорость</th>
                <th>Средняя скорость</th>
                <th>Средняя точность</th>
                <th>Всего гонок</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={entry.user_id} className={index < 3 ? `top-${index + 1}` : ''}>
                  <td>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index >= 3 && `#${index + 1}`}
                  </td>
                  <td>{entry.user_id}</td>
                  <td className="highlight">{Math.round(entry.best_wpm)} WPM</td>
                  <td>{Math.round(entry.avg_wpm)} WPM</td>
                  <td>{parseFloat(entry.avg_accuracy).toFixed(1)}%</td>
                  <td>{entry.total_races}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;


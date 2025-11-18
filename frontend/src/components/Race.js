import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Race.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function Race({ userId }) {
  const [snippet, setSnippet] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [isRacing, setIsRacing] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [time, setTime] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [raceComplete, setRaceComplete] = useState(false);
  const [finalStats, setFinalStats] = useState(null);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadSnippet();
  }, []);

  useEffect(() => {
    if (isRacing && startTime && !raceComplete) {
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setTime(Math.floor(elapsed));
        
        // Calculate WPM
        const wordsTyped = userInput.length / 5;
        const minutes = elapsed / 60;
        setWpm(Math.floor(wordsTyped / minutes) || 0);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRacing, startTime, userInput, raceComplete]);

  useEffect(() => {
    if (snippet && userInput.length > 0 && !isRacing) {
      setIsRacing(true);
      setStartTime(Date.now());
      inputRef.current?.focus();
    }
  }, [userInput, snippet, isRacing]);

  useEffect(() => {
    if (snippet && !raceComplete) {
      // Обрабатываем код: заменяем экранированные \n на реальные переносы
      let code = snippet.code;
      code = code.replace(/\\n/g, '\n');
      
      // Нормализуем ввод пользователя для сравнения
      const normalizedInput = userInput.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      if (normalizedInput === code) {
        finishRace();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInput, snippet, raceComplete]);

  const loadSnippet = async () => {
    try {
      // Остановить интервал если он работает
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      const response = await axios.get(`${API_URL}/api/snippet`);
      setSnippet(response.data);
      setUserInput('');
      setIsRacing(false);
      setWpm(0);
      setAccuracy(100);
      setTime(0);
      setErrors(0);
      setRaceComplete(false);
      setFinalStats(null);
    } catch (error) {
      console.error('Error loading snippet:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);

    if (snippet) {
      // Обрабатываем код: заменяем экранированные \n на реальные переносы
      let code = snippet.code;
      code = code.replace(/\\n/g, '\n');
      
      // Нормализуем ввод пользователя: заменяем \r\n и \r на \n
      const normalizedInput = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      let errorCount = 0;
      for (let i = 0; i < normalizedInput.length && i < code.length; i++) {
        if (normalizedInput[i] !== code[i]) {
          errorCount++;
        }
      }
      
      // Если пользователь ввел больше символов, чем нужно - это тоже ошибки
      if (normalizedInput.length > code.length) {
        errorCount += normalizedInput.length - code.length;
      }
      
      setErrors(errorCount);
      
      const totalChars = code.length;
      const correctChars = Math.min(normalizedInput.length, code.length) - errorCount;
      const acc = totalChars > 0 ? ((correctChars / totalChars) * 100).toFixed(2) : 100;
      setAccuracy(parseFloat(acc));
    }
  };

  const finishRace = async () => {
    // Остановить интервал сразу
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Рассчитать финальные значения сразу
    const endTime = Date.now();
    const elapsed = (endTime - startTime) / 1000;
    const finalTime = Math.floor(elapsed);
    
    // Рассчитать финальную скорость
    const wordsTyped = userInput.length / 5;
    const minutes = elapsed / 60;
    const finalWpm = Math.floor(wordsTyped / minutes) || 0;
    
    // Финальная точность уже рассчитана в handleInputChange
    const finalAccuracy = accuracy;
    
    // Сохранить финальные значения
    setFinalStats({
      wpm: finalWpm,
      accuracy: finalAccuracy,
      time: finalTime,
      errors: errors
    });
    
    // Обновить состояния для немедленного отображения
    setTime(finalTime);
    setWpm(finalWpm);
    setIsRacing(false);
    setRaceComplete(true);
    
    try {
      await axios.post(`${API_URL}/api/result`, {
        userId,
        snippetId: snippet.id,
        wpm: finalWpm,
        accuracy: finalAccuracy,
        time: finalTime
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  const renderCodeSnippet = () => {
    if (!snippet) return null;
    
    // Обрабатываем код: заменяем экранированные \n на реальные переносы строк
    let code = snippet.code;
    // Если код содержит строку "\n" (два символа), заменяем на реальный перенос
    code = code.replace(/\\n/g, '\n');
    
    const lines = code.split('\n');
    // Нормализуем ввод пользователя для правильного сравнения
    const normalizedInput = userInput.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    let charIndex = 0;
    
    return (
      <div className="code-lines-container">
        {lines.map((line, lineIndex) => (
          <div key={lineIndex} className="code-line">
            {line.split('').map((char) => {
              const currentCharIndex = charIndex++;
              const isCorrect = currentCharIndex < normalizedInput.length && 
                               normalizedInput[currentCharIndex] === char;
              const isIncorrect = currentCharIndex < normalizedInput.length && 
                                 normalizedInput[currentCharIndex] !== char;
              const isCurrent = currentCharIndex === normalizedInput.length;
              
              return (
                <span
                  key={currentCharIndex}
                  className={`char ${
                    isCorrect ? 'correct' : isIncorrect ? 'incorrect' : ''
                  } ${isCurrent ? 'current' : ''}`}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
            {/* Обработка переноса строки между строками */}
            {lineIndex < lines.length - 1 && (
              <>
                {/* Проверяем, правильно ли пользователь ввел перенос строки */}
                {charIndex < normalizedInput.length && normalizedInput[charIndex] === '\n' && (
                  <span className="char correct" style={{ display: 'none' }}></span>
                )}
                {charIndex < normalizedInput.length && normalizedInput[charIndex] !== '\n' && (
                  <span className="char incorrect" style={{ display: 'none' }}></span>
                )}
                {charIndex === normalizedInput.length && (
                  <span className="char current" style={{ display: 'none' }}></span>
                )}
                {/* Увеличиваем индекс для символа переноса строки */}
                {charIndex < normalizedInput.length && normalizedInput[charIndex] === '\n' && charIndex++}
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!snippet) {
    return <div className="loading">Загрузка фрагмента кода...</div>;
  }

  return (
    <div className="race-container">
      <div className="race-header">
        <h1>Гонка на скорость</h1>
        <div className="race-info">
          <div className="info-item">
            <span className="info-label">Язык:</span>
            <span className="info-value">{snippet.language}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Сложность:</span>
            <span className="info-value">{snippet.difficulty}</span>
          </div>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Скорость:</span>
          <span className="stat-value">{wpm} WPM</span>
        </div>
        <div className="stat">
          <span className="stat-label">Точность:</span>
          <span className="stat-value">{accuracy.toFixed(1)}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Время:</span>
          <span className="stat-value">{time}с</span>
        </div>
        <div className="stat">
          <span className="stat-label">Ошибки:</span>
          <span className="stat-value">{errors}</span>
        </div>
      </div>

      <div className="code-display">
        <div className="code-snippet">
          {renderCodeSnippet()}
        </div>
      </div>

      <div className="input-section">
        <textarea
          ref={inputRef}
          className="code-input"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Начните печатать здесь... (используйте Enter для переноса строки)"
          disabled={raceComplete}
          rows="8"
          wrap="off"
        />
      </div>

      {raceComplete && finalStats && (
        <div className="race-complete">
          <h2>Гонка завершена! 🎉</h2>
          <div className="final-stats">
            <p>Скорость: <strong>{finalStats.wpm} WPM</strong></p>
            <p>Точность: <strong>{finalStats.accuracy.toFixed(1)}%</strong></p>
            <p>Время: <strong>{finalStats.time} секунд</strong></p>
            <p>Ошибки: <strong>{finalStats.errors}</strong></p>
          </div>
          <button className="new-race-btn" onClick={loadSnippet}>
            Новая гонка
          </button>
        </div>
      )}

      {!raceComplete && (
        <button className="new-race-btn" onClick={loadSnippet}>
          Новый фрагмент
        </button>
      )}
    </div>
  );
}

export default Race;


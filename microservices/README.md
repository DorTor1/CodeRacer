# Микросервисы CodeRacer

Этот проект содержит два микросервиса для расширения функциональности CodeRacer.

## Микросервисы

### 1. Statistics Service (Порт 3002)

Сервис статистики и аналитики, который собирает и анализирует данные о гонках.

**Endpoints:**
- `GET /health` - Проверка здоровья сервиса
- `GET /api/statistics/overview` - Общая статистика по всем гонкам
- `GET /api/statistics/language/:language` - Статистика по конкретному языку программирования
- `GET /api/statistics/user/:userId` - Статистика конкретного пользователя
- `GET /api/statistics/trends?days=7` - Тренды за последние N дней
- `POST /api/statistics/analyze` - Анализ результата гонки

**Пример использования:**
```bash
# Общая статистика
curl http://localhost:3002/api/statistics/overview

# Статистика по JavaScript
curl http://localhost:3002/api/statistics/language/javascript

# Статистика пользователя
curl http://localhost:3002/api/statistics/user/user_123
```

### 2. Notification Service (Порт 3003)

Сервис уведомлений, который отправляет уведомления о достижениях и рекордах.

**Endpoints:**
- `GET /health` - Проверка здоровья сервиса
- `POST /api/notifications/send` - Отправить уведомление
- `GET /api/notifications/user/:userId` - Получить уведомления пользователя
- `POST /api/notifications/check-achievements` - Проверить достижения
- `POST /api/notifications/check-records` - Проверить рекорды
- `PUT /api/notifications/:id/read` - Отметить уведомление как прочитанное

**Пример использования:**
```bash
# Отправить уведомление
curl -X POST http://localhost:3003/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_123", "type": "achievement", "message": "Отличная работа!"}'

# Получить уведомления пользователя
curl http://localhost:3003/api/notifications/user/user_123
```

## Запуск микросервисов

### Через Docker Compose (рекомендуется)

```bash
# Запустить все сервисы включая микросервисы
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотр логов микросервисов
docker-compose logs -f statistics-service
docker-compose logs -f notification-service
```

### Локальный запуск (для разработки)

#### Statistics Service:
```bash
cd microservices/statistics-service
npm install
npm run dev
```

#### Notification Service:
```bash
cd microservices/notification-service
npm install
npm run dev
```

## Интеграция с основным бэкендом

Основной бэкенд автоматически вызывает микросервисы при сохранении результата гонки:
- Statistics Service анализирует результат
- Notification Service проверяет достижения и рекорды

## Структура проекта

```
microservices/
├── statistics-service/
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── notification-service/
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
└── README.md
```


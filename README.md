# VOR Database - Система управления ведомостями объёмов работ

## Структура проекта

```
VOR_DB/
├── backend/          # Django API
├── frontend/         # Next.js Frontend
└── docker-compose.yml # Единый Docker Compose для всех сервисов
```

## Быстрый старт

### Требования
- Docker и Docker Compose
- Git

### Запуск проекта

1. **Клонируйте репозиторий** (если еще не сделано):
```bash
git clone <repository-url>
cd VOR_DB
```

2. **Запустите все сервисы**:
```bash
docker compose up -d --build
```

3. **Примените миграции Django**:
```bash
docker compose exec api python manage.py migrate
```

4. **Создайте суперпользователя** (опционально):
```bash
docker compose exec api python manage.py createsuperuser
```

### Доступ к сервисам

- **Frontend**: http://localhost:3001
- **Django API**: http://localhost:8001
- **Django Admin**: http://localhost:8001/admin/
- **Swagger API Docs**: http://localhost:8001/api/swagger/
- **PostgreSQL**: localhost:5432

### Остановка проекта

```bash
docker compose down
```

### Остановка с удалением данных

```bash
docker compose down -v
```

## Структура сервисов

### 1. PostgreSQL (db)
- Порт: 5432
- База данных: vor_db
- Пользователь: vor_user
- Пароль: vor_password

### 2. Django API (api)
- Порт: 8001 (внешний) → 8000 (внутренний)
- Рабочая директория: /app
- Автоматический перезапуск при изменении файлов

### 3. Next.js Frontend (frontend)
- Порт: 3001 (внешний) → 3000 (внутренний)
- Режим разработки с hot reload
- Автоматический перезапуск при изменении файлов

## Полезные команды

### Просмотр логов
```bash
# Все сервисы
docker compose logs -f

# Конкретный сервис
docker compose logs -f api
docker compose logs -f frontend
docker compose logs -f db
```

### Выполнение команд в контейнерах

**Django (API)**:
```bash
docker compose exec api python manage.py <command>
docker compose exec api python manage.py makemigrations
docker compose exec api python manage.py migrate
docker compose exec api python manage.py createsuperuser
```

**Frontend**:
```bash
docker compose exec frontend npm <command>
docker compose exec frontend npm install
```

**PostgreSQL**:
```bash
docker compose exec db psql -U vor_user -d vor_db
```

### Перезапуск сервисов
```bash
# Все сервисы
docker compose restart

# Конкретный сервис
docker compose restart api
docker compose restart frontend
```

### Пересборка образов
```bash
docker compose build
docker compose up -d
```

## Разработка

### Изменение кода

Все изменения в коде автоматически применяются благодаря volume mounts:
- `./backend:/app` - код Django
- `./frontend:/app` - код Next.js

### Переменные окружения

**Frontend** (в `docker-compose.yml`):
- `NEXT_PUBLIC_API_URL` - URL Django API

**Backend** (в `docker-compose.yml`):
- `DATABASE_URL` - строка подключения к PostgreSQL
- `DJANGO_SETTINGS_MODULE` - модуль настроек Django

## Решение проблем

### Порт уже занят
Если порты 3001, 8001 или 5432 заняты, измените их в `docker-compose.yml`:
```yaml
ports:
  - "3002:3000"  # Вместо 3001:3000
```

### Ошибки подключения к базе данных
Убедитесь, что сервис `db` запущен и здоров:
```bash
docker compose ps
docker compose logs db
```

### Ошибки CORS
Проверьте настройки CORS в `backend/database/settings.py` и убедитесь, что URL фронтенда добавлен в `CORS_ALLOWED_ORIGINS`.

### Очистка и перезапуск
```bash
# Остановить и удалить контейнеры
docker compose down

# Удалить volumes (удалит данные БД!)
docker compose down -v

# Пересобрать и запустить
docker compose up -d --build
```

## Production

Для production окружения рекомендуется:
1. Использовать production Dockerfile для frontend (с `npm run build` и `npm start`)
2. Настроить nginx как reverse proxy
3. Использовать переменные окружения из файлов (.env)
4. Настроить SSL/TLS сертификаты
5. Использовать managed PostgreSQL вместо контейнера


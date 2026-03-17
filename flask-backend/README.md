# Construction ERP – Flask Backend

A Python/Flask REST API backend for the **OC Pipeline Construction ERP** system.  
It complements the existing React frontend and exposes all core ERP modules over a clean JSON API protected by JWT authentication.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Flask 3.1 |
| ORM | SQLAlchemy 2 + Flask-SQLAlchemy |
| Auth | Flask-JWT-Extended (RS256-ready) |
| CORS | Flask-CORS |
| Migrations | Flask-Migrate (Alembic) |
| Database | PostgreSQL (psycopg2-binary) |
| Serialisation | marshmallow |
| Server | Gunicorn |
| Testing | pytest |

---

## Project Structure

```
flask-backend/
├── app/
│   ├── __init__.py          # App factory
│   ├── config.py            # Per-environment configuration
│   ├── models/
│   │   ├── user.py          # User & authentication
│   │   ├── project.py       # Construction project
│   │   ├── pipeline.py      # Pipeline stages & Kanban cards
│   │   ├── task.py          # Action items / tasks
│   │   ├── submittal.py     # Document submittal workflow
│   │   ├── cost.py          # Budgets & cost line items
│   │   └── audit.py         # Immutable audit log
│   ├── routes/
│   │   ├── auth.py          # /api/auth/*
│   │   ├── projects.py      # /api/projects/*
│   │   ├── pipeline.py      # /api/pipeline/*
│   │   ├── dashboard.py     # /api/dashboard/*
│   │   ├── tasks.py         # /api/tasks/*
│   │   ├── submittals.py    # /api/submittals/*
│   │   ├── cost.py          # /api/cost/*
│   │   └── reports.py       # /api/reports/*
│   └── utils/
│       ├── response.py      # api_response / api_error helpers
│       ├── pagination.py    # Cursor-based pagination
│       └── errors.py        # Global error handlers
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_projects.py
│   ├── test_pipeline.py
│   └── test_dashboard.py
├── run.py                   # Dev server entry point
├── requirements.txt
└── .env.example
```

---

## Quick Start

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 14+ (or use the provided SQLite fallback for testing)

### 2. Setup

```bash
cd flask-backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and edit environment variables
cp .env.example .env
# → edit DATABASE_URL, SECRET_KEY, JWT_SECRET_KEY
```

### 3. Database

```bash
# Initialise migrations (first time only)
flask --app run:app db init

# Create migration
flask --app run:app db migrate -m "initial schema"

# Apply migrations
flask --app run:app db upgrade
```

### 4. Run

```bash
# Development
python run.py

# Production (Gunicorn)
gunicorn "run:app" --bind 0.0.0.0:5000 --workers 4
```

---

## API Reference

All protected endpoints require `Authorization: Bearer <access_token>`.

### Authentication – `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Obtain JWT tokens |
| POST | `/refresh` | Refresh access token |
| GET | `/me` | Get current user |
| PUT | `/me` | Update profile / password |

### Projects – `/api/projects`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List projects (filterable) |
| POST | `/` | Create project |
| GET | `/<id>` | Get project |
| PUT | `/<id>` | Update project |
| DELETE | `/<id>` | Soft-cancel project |
| GET | `/<id>/summary` | Project with task/cost summary |

### Pipeline – `/api/pipeline`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stages` | List stages |
| POST | `/stages` | Create stage |
| PUT | `/stages/<id>` | Update stage |
| DELETE | `/stages/<id>` | Delete empty stage |
| GET | `/projects` | List pipeline cards |
| POST | `/projects` | Add card to pipeline |
| GET | `/projects/<id>` | Get card |
| PUT | `/projects/<id>` | Move / update card |
| DELETE | `/projects/<id>` | Remove card |
| GET | `/metrics` | Pipeline KPIs |

### Dashboard – `/api/dashboard`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Executive KPI overview |
| GET | `/pipeline-velocity` | Stage-level velocity |

### Tasks – `/api/tasks`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List tasks |
| POST | `/` | Create task |
| GET | `/<id>` | Get task |
| PUT | `/<id>` | Update task |
| DELETE | `/<id>` | Delete task |

### Submittals – `/api/submittals`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List submittals |
| POST | `/` | Create submittal |
| GET | `/<id>` | Get submittal |
| PUT | `/<id>` | Update / advance workflow |
| DELETE | `/<id>` | Delete submittal |

### Cost – `/api/cost`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/budgets` | List budgets |
| POST | `/budgets` | Create budget |
| GET | `/budgets/<id>` | Get budget |
| PUT | `/budgets/<id>` | Update budget |
| DELETE | `/budgets/<id>` | Delete budget |
| GET | `/items` | List cost items |
| POST | `/items` | Create cost item |
| GET | `/items/<id>` | Get cost item |
| PUT | `/items/<id>` | Update cost item |
| DELETE | `/items/<id>` | Delete cost item |
| GET | `/summary` | Cost summary by category |

### Reports – `/api/reports`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/pipeline-summary` | Cross-pipeline summary |
| GET | `/project-distribution` | Distribution by state/type/set-aside |
| GET | `/win-rate` | Win-rate analysis |
| GET | `/task-summary` | Task counts by status/priority |

### Health

```
GET /health
GET /api/health
```

---

## Pagination

All list endpoints support `page` and `per_page` query parameters (default: `page=1`, `per_page=20`, max `per_page=100`).

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 84,
      "pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

## Running Tests

```bash
# From the flask-backend directory
pip install pytest
FLASK_ENV=testing pytest tests/ -v
```

---

## Deployment

Set `FLASK_ENV=production` and ensure `DATABASE_URL`, `SECRET_KEY`, and `JWT_SECRET_KEY` are provided as environment variables.  
Use Gunicorn behind a reverse proxy (nginx / Caddy) for production deployments.

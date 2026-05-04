# ProjectFlow 🚀

A production-ready **Project Management Web Application** built with Angular 17, Spring Boot 3, and PostgreSQL. Features a Jira/Trello-inspired Kanban board with drag-and-drop, JWT authentication, OAuth2 (Google), role-based access control, and a clean, modern UI.

---

## ✨ Features

| Category | Features |
|----------|---------|
| **Auth** | JWT (access + refresh tokens), Google OAuth2, BCrypt passwords, RBAC |
| **Projects** | Create/edit/delete, invite members, role-based access (Owner/Admin/Member/Viewer) |
| **Tasks** | Full CRUD, status (Todo/In Progress/Done), priority, due dates, assignees, story points, tags |
| **Kanban** | Drag-and-drop board (Angular CDK), instant backend sync, column filtering |
| **Comments** | Per-task comments with user attribution |
| **Profile** | Avatar upload, profile edit, password change |
| **API** | RESTful, Swagger/OpenAPI docs, pagination, filtering, rate limiting |
| **DevOps** | Docker + docker-compose, Flyway migrations, health checks |

---

## 🏗️ Tech Stack

### Backend
- **Java 21** + **Spring Boot 3.2**
- Spring Security + JWT (jjwt 0.12) + OAuth2
- Spring Data JPA + Hibernate
- **PostgreSQL 16** + **Flyway** migrations
- MapStruct, Lombok
- Springdoc OpenAPI (Swagger UI)
- Bucket4j rate limiting

### Frontend
- **Angular 17** (standalone components, signals)
- **Angular CDK** (drag-and-drop)
- RxJS, reactive forms
- SCSS, responsive design
- Nginx (production serving)

---

## 📋 Prerequisites

- **Docker** ≥ 24.0
- **Docker Compose** ≥ 2.20
- (Optional for local dev) Java 21, Maven 3.9+, Node.js 20+

---

## 🚀 Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/yourorg/projectflow.git
cd projectflow

# 2. Copy environment file
cp .env.example .env
# Edit .env if needed (defaults work out of the box)

# 3. Start everything
docker-compose up --build

# 4. Open your browser
open http://localhost
```

The first build takes ~3-5 minutes. After that:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/api/swagger-ui.html
- **Database**: localhost:5432

---

## 👤 Default Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@projectflow.com | Admin@123 | ROLE_ADMIN, ROLE_USER |
| Demo | demo@projectflow.com | Demo@123 | ROLE_USER |

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_NAME` | `projectflow` | PostgreSQL database name |
| `DB_USERNAME` | `projectflow` | Database user |
| `DB_PASSWORD` | `projectflow123` | Database password |
| `JWT_SECRET` | (64-char hex) | **Change in production!** |
| `JWT_ACCESS_EXPIRY` | `900000` | Access token TTL (ms) = 15min |
| `JWT_REFRESH_EXPIRY` | `604800000` | Refresh token TTL (ms) = 7 days |
| `GOOGLE_CLIENT_ID` | - | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | - | Google OAuth2 client secret |
| `FRONTEND_PORT` | `80` | Nginx port |
| `BACKEND_PORT` | `8080` | Spring Boot port |
| `LOG_LEVEL` | `INFO` | Application log level |

---

## 🔧 Local Development

### Backend

```bash
cd backend

# Start only the database
docker-compose -f ../docker-compose.yml up db -d

# Run Spring Boot
./mvnw spring-boot:run \
  -Dspring-boot.run.arguments="--DB_URL=jdbc:postgresql://localhost:5432/projectflow"

# Run tests
./mvnw test
```

### Frontend

```bash
cd frontend

npm install
npm start
# App: http://localhost:4200
```

---

## 📡 API Documentation

Full Swagger UI available at: **http://localhost:8080/api/swagger-ui.html**

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, get tokens |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/users/me` | Get current user |
| `PUT` | `/api/users/me` | Update profile |
| `POST` | `/api/users/me/avatar` | Upload avatar |
| `GET` | `/api/projects` | List user's projects |
| `POST` | `/api/projects` | Create project |
| `GET` | `/api/projects/{id}/board` | Get Kanban board |
| `POST` | `/api/projects/{id}/tasks` | Create task |
| `PATCH` | `/api/tasks/{id}/position` | Update task position (drag-drop) |
| `GET` | `/api/tasks/my` | Get my assigned tasks |

---

## 🗄️ Database Schema

```
users ──────── user_roles ─── roles
  │
  ├── projects ─── project_members
  │      │
  │      └── tasks ─── task_comments
  │              └──── task_activities
  │
  └── refresh_tokens
```

---

## 🔐 Authentication Flow

```
1. POST /auth/login → { accessToken, refreshToken }
2. All API requests: Authorization: Bearer <accessToken>
3. On 401: POST /auth/refresh → new { accessToken, refreshToken }
4. On logout: POST /auth/logout → revoke refreshToken
```

---

## 🎯 Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `http://localhost:8080/api/oauth2/callback/google`
4. Set in `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

---

## 📁 Project Structure

```
projectflow/
├── backend/
│   ├── src/main/java/com/projectflow/
│   │   ├── config/          # Security, OpenAPI, Web, Rate limiting
│   │   ├── controller/      # REST controllers
│   │   ├── dto/             # Request/Response DTOs
│   │   ├── entity/          # JPA entities
│   │   ├── exception/       # Custom exceptions & global handler
│   │   ├── repository/      # Spring Data JPA repos
│   │   ├── security/        # JWT + OAuth2
│   │   └── service/         # Business logic
│   ├── src/main/resources/
│   │   ├── db/migration/    # Flyway SQL scripts
│   │   └── application.yml  # Config
│   └── Dockerfile
│
├── frontend/
│   ├── src/app/
│   │   ├── core/            # Guards, interceptors, services
│   │   ├── features/        # Auth, Dashboard, Projects, Tasks, Profile
│   │   └── shared/          # Models, components, layout
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🛡️ Security Notes

- **Change `JWT_SECRET` in production** — use `openssl rand -hex 32`
- HTTPS recommended behind a reverse proxy (Traefik/Nginx)
- Passwords hashed with BCrypt (strength 12)
- Rate limiting: 10 requests/minute per IP on auth endpoints
- CORS configured via environment variable

---

## 🧪 Running Tests

```bash
# Backend unit + integration tests
cd backend && ./mvnw test

# Frontend unit tests
cd frontend && npm test
```

---

## 📦 Production Deployment

```bash
# Generate a secure JWT secret
openssl rand -hex 32

# Update .env with production values
# Then:
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

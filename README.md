# CodeArenA

[![React](https://img.shields.io/badge/Frontend-React%2019-61dafb?style=for-the-badge&logo=react&logoColor=white)](frontend/package.json)
[![Vite](https://img.shields.io/badge/Build-Vite-646cff?style=for-the-badge&logo=vite&logoColor=white)](frontend/package.json)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-3c873a?style=for-the-badge&logo=node.js&logoColor=white)](backend/package.json)
[![MySQL](https://img.shields.io/badge/Database-MySQL-00758f?style=for-the-badge&logo=mysql&logoColor=white)](database/schema.sql)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](backend/tsconfig.json)

CodeArena is a full-stack online coding contest platform for managing programming contests, problems, participation, submissions, and live rankings.

## Features

- **JWT Authentication** with bcrypt password hashing and role-based access
- **Contest Management** — create, update, delete with lifecycle states (UPCOMING, ONGOING, ENDED)
- **Problem Management** — CRUD with difficulty levels and max-score
- **Participation & Submissions** — join contests, submit solutions with validation
- **Leaderboards** — global and contest-specific rankings
- **Dashboard** — platform-wide statistics

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | React 19, Vite, React Router, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL |
| Auth | JWT, bcryptjs |

## Project Structure

```
CodeArena/
├── backend/
│   ├── src/
│   │   ├── config/db.ts
│   │   ├── middleware/authMiddleware.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── contestRoutes.ts
│   │   │   ├── problemRoutes.ts
│   │   │   ├── submissionRoutes.ts
│   │   │   ├── leaderboardRoutes.ts
│   │   │   ├── dashboardRoutes.ts
│   │   │   └── userRoutes.ts
│   │   └── server.ts
│   ├── database.js
│   └── seed.js
├── database/
│   ├── schema.sql
│   └── seed.sql
├── frontend/
│   └── src/
│       ├── api/api.ts
│       ├── pages/
│       │   ├── Contests.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Leaderboard.tsx
│       │   ├── Login.tsx
│       │   ├── ProblemDetails.tsx
│       │   ├── Problems.tsx
│       │   ├── Register.tsx
│       │   └── Submit.tsx
│       ├── App.tsx
│       ├── index.css
│       └── main.tsx
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- MySQL Server running locally

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd OnlineCodingContest
```

Create `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_super_secret_jwt_key
PORT=5001
```

### 2. Install and run

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### 3. Seed sample data

```bash
cd backend
npm run seed
```

### 4. Open the app

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001`

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@codearena.com` | `admin123` |
| User | `sayan@codearena.com` | `user123` |
| User | `alice@codearena.com` | `user123` |
| User | `bob@codearena.com` | `user123` |
| User | `charlie@codearena.com` | `user123` |

## API Endpoints

### Auth
| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/me` | Update profile |
| PUT | `/api/auth/me/password` | Change password |

### Contests
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/contests` | List contests |
| GET | `/api/contests/:id` | Get contest |
| POST | `/api/contests` | Create (admin) |
| PUT | `/api/contests/:id` | Update (admin) |
| DELETE | `/api/contests/:id` | Delete (admin) |
| GET | `/api/contests/:id/problems` | Contest problems |
| POST | `/api/contests/:id/problems` | Add problem (admin) |
| DELETE | `/api/contests/:id/problems/:pid` | Remove problem (admin) |

### Problems
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/problems` | List problems |
| GET | `/api/problems/:id` | Get problem |
| POST | `/api/problems` | Create (admin) |
| PUT | `/api/problems/:id` | Update (admin) |
| DELETE | `/api/problems/:id` | Delete (admin) |

### Submissions & Participation
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/submissions` | List submissions |
| POST | `/api/submissions` | Submit solution |
| GET | `/api/submissions/participations` | List participations |
| POST | `/api/submissions/participations` | Join contest |

### Leaderboard & Dashboard
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/leaderboard` | Global leaderboard |
| GET | `/api/leaderboard/:contestId` | Contest leaderboard |
| GET | `/api/dashboard/stats` | Platform stats |

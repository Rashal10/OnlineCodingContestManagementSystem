<div align="center">
  <h1>CodeArena</h1>
  <p><strong>A Next-Generation Full-Stack Online Coding Contest Platform</strong></p>

  [![React](https://img.shields.io/badge/Frontend-React%2019-61dafb?style=for-the-badge&logo=react&logoColor=black)](frontend/package.json)
  [![Vite](https://img.shields.io/badge/Build-Vite-646cff?style=for-the-badge&logo=vite&logoColor=white)](frontend/package.json)
  [![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-3c873a?style=for-the-badge&logo=node.js&logoColor=white)](backend/package.json)
  [![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](database/schema.sql)
  [![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](backend/tsconfig.json)

  <p>
    <a href="#sparkles-features">Features</a> •
    <a href="#rocket-tech-stack">Tech Stack</a> •
    <a href="#hammer_and_wrench-setup--installation">Setup</a> •
    <a href="#books-api-reference">API Documentation</a>
  </p>
</div>

---

## 📖 About

**CodeArena** is a comprehensive online coding contest platform designed to facilitate programming competitions natively. It offers an end-to-end ecosystem encompassing contest creation, problem management, live real-time leaderboards, and user progress tracking. Whether you are hosting a local university hackathon or a global algorithm challenge, CodeArena provides the tools you need.

---

## :sparkles: Features

*   **Secure Authentication:** Role-based access control (Admin & Participant) powered by JWT and bcrypt password hashing.
*   **Contest Lifecycle Management:** Robust scheduling and administration of contests through `UPCOMING`, `ONGOING`, and `ENDED` states.
*   **Problem Curation Base:** Full CRUD operations for coding problems, featuring varying difficulty tiers and customizable maximum scoring.
*   **Submissions Tracking:** Real-time contest participation and seamless solution submissions with backend validation.
*   **Live Leaderboards:** Track competitive standings dynamically with global and contest-specific ranking systems.
*   **Analytical Dashboard:** Gain insights into platform-wide statistics, active users, and aggregate problem-solving metrics.

---

## :rocket: Tech Stack

CodeArena is built utilizing a modern, scalable web stack:

<table>
  <tr>
    <td align="center" width="25%"><b>Frontend</b><br><br><img src="https://skillicons.dev/icons?i=react,ts,vite" /><br>React 19, TypeScript, Vite, React Router</td>
    <td align="center" width="25%"><b>Backend</b><br><br><img src="https://skillicons.dev/icons?i=nodejs,express,ts" /><br>Node.js, Express, TypeScript</td>
    <td align="center" width="25%"><b>Database</b><br><br><img src="https://skillicons.dev/icons?i=mysql" /><br>MySQL</td>
    <td align="center" width="25%"><b>Security</b><br><br><img src="https://img.shields.io/badge/-JWT-000000?style=flat&logo=JSON%20web%20tokens"/><br>JWT Auth, bcryptjs</td>
  </tr>
</table>

---

## :file_folder: Project Structure

A high-level overview of the architectural separation of concerns:

```text
CodeArena/
├── backend/                  # Express REST API, Node.js server
│   ├── src/
│   │   ├── config/           # Environment & DB connection
│   │   ├── middleware/       # JWT and authorization checks
│   │   ├── routes/           # API Endpoints (auth, contests, problems, etc.)
│   │   └── server.ts         # Application entry point
│   └── seed.js               # Database hydration script
├── database/                 # Raw SQL schemas and seeding
│   ├── schema.sql            # Table definitions
│   └── seed.sql              # Initial data payloads
└── frontend/                 # React SPA built with Vite
    ├── src/
    │   ├── api/              # Axios service bindings
    │   ├── pages/            # View components (Dashboard, Problems, etc.)
    │   └── App.tsx           # Router configuration
```

---

## :hammer_and_wrench: Setup & Installation

Follow these steps to deploy a local instance of CodeArena.

### Prerequisites
*   [Node.js](https://nodejs.org/en/) (v18 or higher)
*   [MySQL Server](https://dev.mysql.com/downloads/installer/) running locally (port 3306)

### 1. Repository Setup

```bash
git clone https://github.com/Rashal10/OnlineCodingContestManagementSystem.git CodeArena
cd CodeArena
```

### 2. Environment Configuration

Navigate to the `backend` directory and create a `.env` file:

```bash
cd backend
touch .env
```

Populate `.env` with the following variables, adjusting as necessary for your local setup:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_super_secret_jwt_key
PORT=5001
```

### 3. Install Dependencies & Run

We recommend using two separate terminal instances for the backend and frontend.

**Terminal 1: Backend API**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2: Frontend Client**
```bash
cd frontend
npm install
npm run dev
```

### 4. Hydrate Database (Seeding)

To test the application properly, you can pre-load it with sample users, contests, and problems.

```bash
cd backend
npm run seed
```

### 5. Access the Platform

*   **Client App:** `http://localhost:5173`
*   **REST API:** `http://localhost:5001`

---

## :busts_in_silhouette: Demo Accounts

If you seeded the database in Step 4, use the following credentials to explore different roles:

| Role      | Email                 | Password  | Access Level                                        |
| :---      | :---                  | :---      | :---                                                |
| **Admin** | `admin@codearena.com` | `admin123`| *All permissions (Create/Edit Contests & Problems)* |
| **User**  | `sayan@codearena.com` | `user123` | *Participant (Join Contests, Submit Code)*          |
| **User**  | `alice@codearena.com` | `user123` | *Participant*                                       |

---

## :books: API Reference

CodeArena provides a robust RESTful API. Below are the core endpoints:

<details>
<summary><b>Authentication & Users</b></summary>

| Method | Endpoint                | Description                                     |
| :---   | :---                    | :---                                            |
| `POST` | `/api/auth/register`    | Register a new user                             |
| `POST` | `/api/auth/login`       | Authenticate and receive JWT                    |
| `GET`  | `/api/auth/me`          | Fetch detailed profile of current user          |
| `PUT`  | `/api/auth/me`          | Update public profile details                   |
| `PUT`  | `/api/auth/me/password` | Account password change                         |

</details>

<details>
<summary><b>Contest Management</b></summary>

| Method   | Endpoint                          | Description                           | Auth Required |
| :---     | :---                              | :---                                  | :---:         |
| `GET`    | `/api/contests`                   | Retrieve all platform contests        |               |
| `GET`    | `/api/contests/:id`               | Fetch specific contest metadata       |               |
| `POST`   | `/api/contests`                   | Create a new contest                  | **Admin**     |
| `PUT`    | `/api/contests/:id`               | Modify contest settings               | **Admin**     |
| `DELETE` | `/api/contests/:id`               | Drop contest entirely                 | **Admin**     |
| `GET`    | `/api/contests/:id/problems`      | List problems mapped to this contest  |               |
| `POST`   | `/api/contests/:id/problems`      | Assign an existing problem to contest | **Admin**     |
| `DELETE` | `/api/contests/:id/problems/:pid` | Detach a problem from contest         | **Admin**     |

</details>

<details>
<summary><b>Problem Library</b></summary>

| Method   | Endpoint            | Description                        | Auth Required |
| :---     | :---                | :---                               | :---:         |
| `GET`    | `/api/problems`     | List all available problems        |               |
| `GET`    | `/api/problems/:id` | Fetch individual problem detail    |               |
| `POST`   | `/api/problems`     | Create new algorithm problem       | **Admin**     |
| `PUT`    | `/api/problems/:id` | Update problem description/scoring | **Admin**     |
| `DELETE` | `/api/problems/:id` | Delete problem from system         | **Admin**     |

</details>

<details>
<summary><b>Submissions & Participation</b></summary>

| Method | Endpoint                          | Description                           | Auth Required |
| :---   | :---                              | :---                                  | :---:         |
| `POST` | `/api/submissions`                | Submit solution for evaluation        | User          |
| `GET`  | `/api/submissions`                | Retrieve submission history           | User          |
| `POST` | `/api/submissions/participations` | Enroll in an upcoming/ongoing contest | User          |
| `GET`  | `/api/submissions/participations` | List user's active participations     | User          |

</details>

<details>
<summary><b>Analytics & Leaderboard</b></summary>

| Method | Endpoint                          | Description                           |
| :---   | :---                              | :---                                  |
| `GET`  | `/api/leaderboard`                | View global standing leaderboard      |
| `GET`  | `/api/leaderboard/:contestId`     | View rankings for a specific contest  |
| `GET`  | `/api/dashboard/stats`            | Fetch aggregate platform metrics      |

</details>

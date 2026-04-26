# InsightHub — Backend API

Academic Research and Capstone Repository — Backend (Node.js + PostgreSQL)

## Project Overview

InsightHub is a centralized digital platform for Academic City University students to store, share, and explore research papers and capstone projects. This repository contains the RESTful API backend built with Node.js, Express, and PostgreSQL.

## Deployment Link

- **Backend API (Render):** `https://insighthub-backend-tech.onrender.com`
- **Frontend (GitHub Pages):** `https://geraldalordeh19.github.io/insighthub-frontend`

## Login Details (Test Accounts)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| Student | student@test.com | student123 |

> To create the admin account: register normally, then run this SQL on your DB:
> `UPDATE users SET role = 'admin' WHERE email = 'admin@insighthub.com';`

## Feature Checklist

- ✅ User registration and login (JWT authentication)
- ✅ Project submission (title, abstract, department, supervisor, year, file link, demo link, tags, technologies)
- ✅ Project discovery — searchable and filterable feed (by keyword, department, year, tags, technology)
- ✅ Project detail page with full information
- ✅ Comments and feedback on projects
- ✅ Save / bookmark projects
- ✅ Admin review system (approve, reject, edit, delete)
- ✅ Admin statistics dashboard (users, projects, comments, bookmarks)
- ✅ Only approved projects are visible to the public
- ✅ JWT-protected routes

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user (auth required) |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all approved projects (supports `?search=&department=&year=&tags=`) |
| GET | `/api/projects/:id` | Get single project with comments |
| POST | `/api/projects` | Submit new project (auth required) |
| GET | `/api/projects/my/submissions` | Get current user's submissions (auth required) |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/comments` | Add a comment (auth required) |
| DELETE | `/api/comments/:id` | Delete own comment (auth required) |

### Bookmarks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookmarks` | Toggle bookmark (auth required) |
| GET | `/api/bookmarks` | Get user's bookmarks (auth required) |
| GET | `/api/bookmarks/check/:project_id` | Check if bookmarked (auth required) |

### Admin (admin role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/projects` | All projects with optional `?status=` filter |
| PATCH | `/api/admin/projects/:id` | Approve/reject/edit a project |
| DELETE | `/api/admin/projects/:id` | Delete a project |
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | All users |

## Installation Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL database (local or cloud — recommended: [Neon](https://neon.tech) or [Supabase](https://supabase.com) for free tier)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/insighthub-backend.git
cd insighthub-backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL and JWT_SECRET

# 4. Start the server
npm run dev    # development (with nodemon)
npm start      # production
```

The server will automatically create all required database tables on first run.

### Environment Variables

```
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_random_secret_string
NODE_ENV=development
```

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (via `pg` library)
- **Authentication:** JWT (jsonwebtoken) + bcryptjs
- **Deployment:** Render

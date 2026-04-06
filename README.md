# Indu AE — Online Tutoring Platform

An online tutoring marketplace connecting Indian tutors with UAE-based students (Grade 1–12). Parents purchase credits (AED), tutors are paid in INR, and consultants mediate the matching process.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Express 5, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Payments | Stripe Checkout + Webhooks |
| Video | Zoom Server-to-Server OAuth |
| Storage | AWS S3 (recordings, documents) |
| Email | AWS SES (production) / Console (development) |

## Project Structure

```
├── backend/          Express API server
│   ├── prisma/       Schema, migrations, seed
│   └── src/
│       ├── config/   Environment, database, S3, Stripe, email
│       ├── cron/     Scheduled jobs (sessions, recordings, reminders)
│       ├── modules/  Feature modules (auth, enrollment, payment, etc.)
│       └── shared/   Middlewares, utilities, types
├── frontend/         React SPA
│   └── src/
│       ├── components/   Shared UI components + layouts
│       ├── contexts/     Auth context
│       ├── pages/        Role-based dashboard pages
│       ├── routes/       Route definitions + guards
│       └── services/     API service layer
└── docker-compose.yml    PostgreSQL container
```

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or use `docker-compose up -d`)
- Stripe account (test mode)
- Zoom Server-to-Server OAuth app
- AWS account (S3 + SES) — optional for local dev

## Setup

### 1. Database

```bash
docker-compose up -d   # Start PostgreSQL
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # Fill in your credentials
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed         # Seed reference data
npm run dev             # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # Set VITE_API_URL
npm install
npm run dev             # http://localhost:8080
```

## User Roles

| Role | Description |
|------|------------|
| Parent | UAE-based. Manages children, purchases credits, enrolls in classes |
| Tutor | India-based. Teaches 1:1 and group classes via Zoom |
| Consultant | Mediator. Reviews demo requests, allocates tutors |
| Admin | Platform management. Courses, users, analytics, payouts |

## API

- Base URL: `http://localhost:5000/api/v1`
- Health check: `GET /api/health`
- API docs: `GET /api/docs` (Swagger UI)

## Key Features

- Multi-factor credit pricing (grade tier × session duration)
- 1:1 enrollments with rolling session generation
- Group/batch classes with shared Zoom links
- Zoom auto-provisioning (meeting creation, recordings)
- Stripe Checkout for credit purchases
- In-app + email notifications
- Role-based dashboards with live analytics
- Assessment tracking with document uploads
- Tutor availability and scheduling system

## Scripts

### Backend

| Command | Description |
|---------|------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm test` | Run tests |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

### Frontend

| Command | Description |
|---------|------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

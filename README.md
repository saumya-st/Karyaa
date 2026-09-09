# Karya

An AI-powered task-management platform built to make personal and team workflows more organized, secure, and scalable.

Karya is a full-stack Next.js app — frontend and backend live in a single codebase, using Server Actions instead of a separate REST layer. It supports secure multi-user task workflows through NextAuth (credentials + Google OAuth), JWT sessions, and role-based access control, with automatic two-way sync to Google Calendar.

## Features

- Secure authentication via NextAuth — email/password (bcrypt-hashed) and Google OAuth, with JWT sessions
- Role-based access control for multi-user, multi-team workflows
- Server Actions for all task/project mutations — no separate REST API layer
- Kanban board with drag-and-drop, built with `@hello-pangea/dnd`
- Automatic Google Calendar sync when tasks are assigned, using stored OAuth tokens
- Token-based project invites (shareable links + email invites via Resend)
- Responsive interface built with Next.js, React, and Tailwind CSS

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js (App Router), React, Tailwind CSS |
| Backend | Next.js Server Actions (no separate REST/API layer) |
| Database | PostgreSQL (Neon, serverless) via Prisma ORM |
| Authentication | NextAuth v5 — Credentials (bcrypt) + Google OAuth, JWT sessions |
| Integrations | Google Calendar API, Resend (transactional email) |

## What I Built

I structured the app around Next.js Server Actions so mutations (creating tasks, managing projects, sending invites) are plain server-side functions called directly from React components — no manual API routes or client-side fetch boilerplate. I built the responsive frontend, the Prisma data model (multi-team, multi-assignee tasks, invites, notifications, activity logs), NextAuth-based session handling with both password and Google OAuth login, and a background sync layer that pushes assigned tasks to each user's Google Calendar and keeps OAuth tokens refreshed automatically.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Installation

```bash
git clone https://github.com/saumya-st/karyaa.git
cd karyaa
npm install
```

Create a `.env` file using `.env.example` as a reference, then add the required environment variables for your local setup.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Future Improvements

- Add task reminders and notifications
- Add team activity history and audit logs
- Add richer analytics for task completion and productivity trends

## Author

**Saumya Tiwari**

- Portfolio: [saumya-tiwari.vercel.app](https://saumya-tiwari.vercel.app)
- GitHub: [@saumya-st](https://github.com/saumya-st)
- LinkedIn: [saumya-tiwari-22909a330](https://www.linkedin.com/in/saumya-tiwari-22909a330)


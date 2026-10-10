# ACE AP STEM

**Master AP STEM with Acey.** ACE AP STEM is a web app that helps high-school students work through AP math and science problems. A student uploads a photo or types a problem, and the app guides them with step-by-step hints, concept notes, full solutions and an AI tutor chat, all alongside **Acey**, the study buddy mascot.

Live site: [www.aceapstem.com](https://www.aceapstem.com)

---

## Meet Acey

Acey is the heart of ACE AP STEM: a friendly lightbulb-and-brain character who cheers students on, reacts to their progress and walks new users through the app.

- **Interactive 3D mascot** built with three.js, with idle motion, moods and study reactions.
- **12 roles** (Original, Engineer, Healthcare, Scientist, Business, Creative, Singer, Fashion, Scholar, Cozy, Gamer, Fantasy), each with its own outfit and props.
- **Make Acey yours:** pick an outfit, a brain color, accessories and a custom name from the Dashboard or the Customize Acey page. The look is saved to the student's account.
- **Guided tour:** Acey introduces the main features the first time a student signs in.

## Features

| Area | What it does |
|------|--------------|
| **Solve Problems** | Upload an image or type a problem. Multi-part questions (for example 2(a) and 2(b)) are detected so the student can choose exactly which part to solve. |
| **Learning options** | Step-by-step hints, concept notes or the full worked solution, with math rendered by KaTeX. |
| **AI Tutor** | Pick one of your problems, then chat with Acey about any step, formula or concept in it. |
| **Notes Hub** | Save problems, solutions and explanations; organize them with folders, tags and stars. |
| **Study Mode** | Choose a study flow and practice with AI-generated variants of your saved problems. |
| **Accounts** | Email/password sign-up, sign-in and password reset by email. |
| **Marketing pages** | Home, About Us (the story of how Acey was designed), FAQ, Contact and Privacy. |

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 (Create React App), React Router, three.js, KaTeX, react-icons |
| Backend | Node.js 22, Express, TypeScript, Zod validation, Pino logging, Swagger docs |
| Database | PostgreSQL with Prisma ORM and migrations |
| AI | OpenAI API (vision for image problems, structured JSON output) |
| Email | Resend |
| Hosting | Vercel (frontend), Railway (backend), Supabase (PostgreSQL) |

## Repository layout

```
.
├── frontend/                 React app
│   ├── public/
│   │   ├── mascot/           Acey 3D models (body, outfits, poses, props, thumbnails)
│   │   ├── hero/             Home and About hero scene images
│   │   └── about/            About Us process images and sketchbook
│   └── src/
│       ├── pages/            One component per route
│       ├── components/
│       │   ├── acey/         Study buddy: companion, tour, customizer panel
│       │   ├── mascot/       3D scene, model fitting, arm poses, catalog of roles/colors
│       │   ├── home/         Landing page sections
│       │   ├── chat/         AI tutor chat UI
│       │   └── layout/       App shell, header, footer
│       ├── context/          Global app state
│       └── utils/            API client and helpers
├── backend/                  Express + TypeScript API
│   ├── src/
│   │   ├── routes/           REST routes (auth, problems, chat, notes, companion, ...)
│   │   ├── controllers/      Request handlers
│   │   ├── services/         OpenAI, chat and email services
│   │   ├── middleware/       Auth, security headers, error handling
│   │   └── config/           Environment, logger, database, Swagger
│   └── prisma/               Database schema, migrations and seed
├── assets/acey/              Original Acey FBX source files from the 3D team (with checksums)
├── docs/                     Technical documentation
└── tmp/                      Asset build and review scripts used during mascot work
```

## Getting started (local development)

### Prerequisites

- Node.js 22 and npm 9+
- A PostgreSQL database (local or hosted)
- An OpenAI API key

### 1. Install

```bash
npm run install:all
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`. The important values:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL`, `DIRECT_URL` | PostgreSQL connection strings |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | At least 32 characters each (`node generate-secrets.js` creates them) |
| `OPENAI_API_KEY` | Powers hints, solutions, concept notes and the tutor |
| `FRONTEND_URL` | Allowed CORS origin, e.g. `http://localhost:3000` |
| `API_BASE_URL` | Public URL of the API |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Password-reset and contact emails |
| `PORT` | API port, default `3001` |

Never commit `.env` files; they are git-ignored.

### 3. Set up the database

```bash
cd backend
npx prisma migrate deploy
npm run db:seed
```

### 4. Run

In two terminals:

```bash
npm --prefix backend run dev
```

```bash
npm --prefix frontend start
```

The frontend opens on `http://localhost:3000` and calls the API at `http://localhost:3001` (override with `REACT_APP_API_URL`). Swagger API docs are served at `http://localhost:3001/api-docs`.

## Tests

```bash
cd frontend && CI=true npm test
```

```bash
cd backend && npm test
```

## Deployment

- **Frontend (Vercel):** the `frontend/` folder is built with `npm run build`. In production the app calls `/backend/*`, which `frontend/vercel.json` rewrites to the Railway API.
- **Backend (Railway):** builds with `npm run build` (Prisma generate + TypeScript) and runs `prisma migrate deploy` before each deployment.
- **Database:** PostgreSQL on Supabase. The free plan pauses inactive projects; resume it from the Supabase dashboard if sign-in stops working.

## Mascot assets

The Acey models in `frontend/public/mascot/` are GLB files exported from the design team's 3D work. `components/mascot/mascotCatalog.js` lists every role, color and prop set, and `public/mascot/README.md` documents how each asset was prepared. Scripts in `tmp/` rebuild the web-ready models from the original deliveries, and the untouched FBX sources are kept in `assets/acey/`.

## License

© ACE AP STEM. All rights reserved.

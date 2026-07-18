# Deploying Smartledger to Vercel

## Prerequisites

- A **PostgreSQL** database (recommended: [Neon](https://neon.tech) — free tier available)
- A [Vercel](https://vercel.com) account
- Your code pushed to a GitHub / GitLab / Bitbucket repository

---

## Environment Variables

Set these in the Vercel dashboard under **Project → Settings → Environment Variables**:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string (`postgresql://...`) |
| `SESSION_SECRET` | ✅ | Long random string for signing session cookies |
| `ADMIN_EMAIL` | Optional | Email of the user to auto-promote to admin on first boot |
| `LOG_LEVEL` | Optional | Logging verbosity — default `info` |

Generate a secure `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Deploy Steps

### 1 — Push to GitHub

```bash
git add .
git commit -m "chore: prepare for Vercel deployment"
git push origin main
```

### 2 — Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects the `vercel.json` — no framework preset needed
4. Add the environment variables listed above
5. Click **Deploy**

Vercel will:
- Run `pnpm install --frozen-lockfile`
- Run `pnpm run vercel:build` (builds API + frontend)
- Serve the React frontend as static files from the CDN
- Serve `POST /api/*` requests via a Node.js serverless function

### 3 — Database Schema

On first deploy the app creates the `session` table automatically.
All other tables must exist before users can log in.

Run schema push against your production database once:
```bash
DATABASE_URL=<your-prod-url> pnpm --filter @workspace/db run push
```

### 4 — Admin Account

On first boot, the server auto-promotes the oldest registered user to admin.
To target a specific email, set `ADMIN_EMAIL` in Vercel environment variables.

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start API server (port from PORT env, defaults to 3000)
pnpm --filter @workspace/api-server run dev

# Start frontend dev server (separate terminal)
pnpm --filter @workspace/crypto-exchange run dev
```

Set `DATABASE_URL` and `SESSION_SECRET` in a `.env` file at the project root (copy `.env.example`).

---

## Build Locally

```bash
pnpm run vercel:build
```

Outputs:
- API bundle → `artifacts/api-server/dist/`
- Frontend → `artifacts/crypto-exchange/dist/public/`

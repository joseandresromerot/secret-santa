# Secret Santa

Web app to organize Secret Santa draws. Organizers sign in with Google, create
draws, add participants, define restrictions and run the draw. Every participant
receives an email with the person they have to give a gift to.

## Features

- Google sign-in; draws are saved per user and can be resumed at any time.
- 4-step wizard: details → participants → restrictions → review.
- **Groups**: members of the same group never give to each other.
- **Restrictions between groups**: mark pairs of groups (A ↔ B) whose members
  must not give to each other in either direction.
- Feasibility check before drawing; impossible configurations are explained.
- Random draw that always respects the restrictions (perfect matching + random
  swaps for an unbiased result). Nobody can see who got whom.
- Emails via Gmail SMTP, with delivery status and resend (optionally fixing the
  address).
- Spanish and English UI; each draw chooses the language of its emails.

## Stack

Next.js 16 (App Router) · Auth.js (Google) · Drizzle ORM · PostgreSQL (Docker
locally, Neon in production) · next-intl · shadcn/ui (Base UI) · Tailwind ·
Nodemailer · Vitest.

## Local development

```bash
docker compose up -d          # PostgreSQL on localhost:5434
cp .env.example .env.local    # then fill in the values (see below)
npm install
npm run db:migrate
npm run dev
```

If `GMAIL_USER` / `GMAIL_APP_PASSWORD` are empty, emails are printed to the
server console instead of being sent.

## Configuration

### Google OAuth

1. Go to <https://console.cloud.google.com/apis/credentials> and create a
   project.
2. Configure the OAuth consent screen (External) and publish it.
3. Create an **OAuth client ID** of type *Web application* with these
   authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-app>.vercel.app/api/auth/callback/google`
4. Copy the client ID and secret into `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

Generate `AUTH_SECRET` with `npx auth secret` (or `openssl rand -base64 33`).

### Gmail (sending emails)

1. Use a dedicated Gmail account for the app.
2. Enable 2-Step Verification on that account.
3. Create an App Password at <https://myaccount.google.com/apppasswords>.
4. Set `GMAIL_USER` (the address) and `GMAIL_APP_PASSWORD` (16 characters,
   no spaces).

Gmail allows roughly 500 emails per day.

## Deploying to Vercel

1. Create a free Postgres database on [Neon](https://neon.tech) and copy the
   pooled connection string.
2. Import the repository in Vercel.
3. Add the environment variables: `DATABASE_URL`, `AUTH_SECRET`,
   `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`.
4. Deploy. `vercel.json` runs the database migrations before each build.
5. Add the production callback URL to the Google OAuth client (see above).

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run test         # Unit tests (draw algorithm)
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run db:generate  # Generate a migration after changing src/db/schema
npm run db:migrate   # Apply migrations
npm run db:studio    # Browse the database
```

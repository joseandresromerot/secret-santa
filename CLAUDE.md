@AGENTS.md

# Secret Santa — Claude Code Guide

See `README.md` for features, setup and deployment.

## Language Rules
- **Communication with user:** Spanish
- **Everything in the codebase:** English (code, comments, commits, docs)

## Project Structure
```
src/
  app/[locale]/             # Pages (locale-aware). Protected pages under (app)/
  features/draws/
    actions/                # Server actions (always check ownership via lib/guards)
    components/             # Client/server UI for the wizard
    emails/                 # Email templates (strings in messages/*.json → "Email")
    lib/matching.ts         # Draw algorithm (pure, unit tested)
    lib/delivery.ts         # Sends assignment emails and records status
  db/schema/                # Drizzle schema; migrations in db/migrations
  i18n/                     # next-intl config (locales: es default, en)
  auth.ts                   # Auth.js with Google, JWT sessions
  proxy.ts                  # next-intl routing (Next 16 uses proxy.ts, not middleware.ts)
```

## Conventions
- Server components by default; `"use client"` only when needed.
- Server actions return `{ ok, data } | { ok: false, error }`; `error` is a key under `Errors` in messages.
- Never hardcode UI strings — add keys to both `messages/es.json` and `messages/en.json`.
- Never expose who gives to whom in the UI (only email delivery status).
- Completed draws are read-only (except resending emails).
- Schema changes always go through `npm run db:generate` + migrations.
- shadcn/ui here is built on Base UI: use the `render` prop instead of `asChild`.

## Git Rules
- Short, concise commit messages
- Do NOT include Claude as co-author
- Test before committing (`npm run test`, `npm run lint`, `npm run typecheck`, browser check)

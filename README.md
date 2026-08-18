# Everplans

The public website for [everplans.online](https://everplans.online) - a digital
planning platform.

Built with **Next.js** (App Router, TypeScript), **Supabase** and **Tailwind
CSS v4**, deployed on **Vercel**.

## Status

Technical foundation. The eight public routes exist and build, but their
experiences have not been designed yet - each renders a placeholder. The design
system, site shell, page experiences and authentication follow in later phases.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev
```

The app runs at http://localhost:3000.

## Environment

| Variable                               | Where          | Purpose                                        |
| -------------------------------------- | -------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | public         | Supabase project URL                           |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public         | Publishable key; access is bounded by RLS      |

`NEXT_PUBLIC_` values are inlined into the browser bundle at build time - only
put publishable values behind that prefix. Server-only credentials go in
unprefixed variables and are read exclusively from modules marked
`import "server-only"`.

`.env.local` is git-ignored. Preview and production values are set in the
Vercel project's environment variables, using the same names.

## Scripts

| Command             | Does                                       |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Development server                         |
| `npm run build`     | Production build (runs TypeScript)         |
| `npm run start`     | Serve a production build                   |
| `npm run typecheck` | `tsc --noEmit`                             |
| `npm run lint`      | ESLint                                     |

## Conventions

Source layout, naming, import order, styling and the Supabase client rules are
documented in [AGENTS.md](AGENTS.md).

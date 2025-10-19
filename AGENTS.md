# Repository Guidelines

## Project Structure & Module Organization
- `src/app` hosts App Router pages grouped by role (`admin/`, `owner/`, etc.) with shared UI in `_components/` and global layout files.
- Shared building blocks live in `src/components`, domain logic in `src/lib`, and TRPC handlers in `src/server/api` backed by Prisma setup in `src/server/db.ts`.
- Persistent data files sit in `prisma/` (schema, seeds), static assets in `public/`, and Tailwind globals in `src/styles`. Environment helpers are in `src/env.js`.

## Build, Test, and Development Commands
- `pnpm dev` starts the Next.js dev server (Turbopack).
- `pnpm build` produces a production bundle; `pnpm preview` runs the bundle locally.
- `pnpm check` runs Biome formatting + linting; `pnpm check:write` applies safe fixes, `pnpm check:unsafe` for aggressive rewrites.
- `pnpm typecheck` enforces the strict TS config.
- Database helpers: `pnpm db:generate`, `pnpm db:push`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`.

## Coding Style & Naming Conventions
- Biome controls formatting (tabs, double quotes, sorted imports). Run `pnpm check` before every commit.
- Components are PascalCase, utilities camelCase, TRPC routers suffixed `Router`. Prefer the `~/` alias over deep relative imports.
- Tailwind class lists should remain sorted; Biome warns when `clsx`/`cn` usage drifts.

## Testing Guidelines
- Automated tests are not yet configured; rely on `pnpm typecheck`, manual smoke tests for login, bookings, billing, and TRPC client checks.
- If you introduce tests, colocate them with the feature (`*.test.ts/tsx`) and document how to run them in the PR.
- Note manual verification steps for high-risk changes.

## Environment & Data Management
- Copy `env.example` to `.env`, set `DATABASE_URL`, and keep secrets out of version control.
- Start Postgres with `./start-database.sh` (Docker/Podman) or `docker-compose up`; both respect `.env`.
- After schema edits run `pnpm db:migrate` + `pnpm db:generate`, commit the SQL, and confirm seed scripts still run.

## Commit & Pull Request Guidelines
- Use descriptive, sentence-style commit subjects that capture the change scope; avoid bundling unrelated work.
- PRs must state intent, call out breaking changes, link related issues, and attach UI screenshots or recordings when relevant.
- Before requesting review ensure the branch rebases cleanly and `pnpm build`/`pnpm check`/`pnpm typecheck` pass.

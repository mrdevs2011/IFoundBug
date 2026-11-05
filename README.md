# FoundBug

A focused issue-tracking workspace for software teams.

> Find bugs. Fix faster. Ship better software.

## Product capabilities

- Repository-based issue tracking with severity, status, reporter details and device telemetry.
- Screenshot attachments with in-browser annotation and redaction tools.
- Discussion threads, issue reactions, developer notes and acceptance criteria.
- AI prompt generation for one issue or a selected group of issues.
- Team membership, role-based invitations and private issue links.
- Embeddable issue reporter widget for external websites.
- PWA installation support.
- Account-scoped MCP Streamable HTTP endpoint with scoped bearer tokens.

## Stack

- Next.js App Router, React and TypeScript
- Tailwind CSS v4
- Supabase Auth, PostgreSQL, RLS and Realtime
- Vercel deployment

## Local development

Install dependencies, copy .env.example to .env.local, then run npm run dev.
Open http://localhost:3333.

Required client environment variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_APP_URL

Never expose a Supabase service-role key through a NEXT_PUBLIC_* variable.

## Database setup

Take a database backup, then run these files in Supabase Dashboard → SQL Editor in this exact order:

1. sql/IFOUNDBUG_UNIVERSAL.sql
2. sql/V2_PUBLIC_MODEL.sql

Both migrations are designed to be re-runnable and preserve application rows. The base schema is deliberately fail-closed; V2 installs the application access model. If the base file is re-run after V2, run V2 again immediately afterwards.

Additional Supabase Auth and Vercel configuration is documented in sql/README.md.

## Verification

Run npm run lint, npx tsc --noEmit --incremental false, and npm run build before merging.

The application does not substitute mock records when Supabase is unavailable; it reports the data access error instead.

## Repository layout

- src/app: Next.js routes and API handlers
- src/components: shared UI, issue views and dialogs
- src/lib: Supabase access, auth helpers and domain constants
- sql: ordered Supabase schema and security migrations
- public: PWA assets, service worker and reporter widget
- ARCHITECTURE.md: system topology and data boundaries
- RELIABILITY.md: operational guarantees and known limitations

## MCP server

Call the `ifb_help` tool for a short guide. Agents with only GitHub access can push screenshots to a GitHub repo and call `import_github_images { bug, repo, path, ref }`; IFB pulls them into private storage and attaches them to the issue.

The account-scoped MCP endpoint is /api/mcp. Create tokens from the account menu, choose only the required scopes, and set an expiry. Raw bearer tokens are shown once; only their SHA-256 digests are stored.

Configure SUPABASE_SERVICE_ROLE_KEY as a server-only Vercel environment variable and NEXT_PUBLIC_APP_URL as the canonical app origin. Never commit or expose secret material or bearer tokens.


## Product boundaries

FoundBug repositories are organizational containers, not Git repositories. Git hosting and Git-provider integrations are intentionally out of scope. The dashboard lists repositories owned by or shared with the signed-in account; public discovery is separate. New repositories are private by default.

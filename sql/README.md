# IFoundBug — single database setup

The only application SQL file is `IFOUNDBUG_UNIVERSAL.sql`. Run that complete file once in **Supabase Dashboard → SQL Editor**. It is designed to be re-runnable and preserves application rows. Do not run the deleted legacy migration files.

## Required Supabase Auth setting

This app maps usernames to synthetic addresses (`username@ifoundbug.dev`). In **Authentication → Providers → Email**, keep the **Email provider enabled** and turn **Confirm email** off. This disables confirmation emails while preserving email/password sign-in and lets signup create an immediate session. SQL cannot change this Auth dashboard setting. Keep password policy at 8 characters or more.

## Required Vercel environment variables

Set these for the same Supabase project, in every environment you deploy (Production, Preview, and Development):

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL, `https://<project-ref>.supabase.co`.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — that same project's publishable key (`sb_publishable_...`). A legacy anon key may instead be supplied as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Never put a `service_role` or secret key in a `NEXT_PUBLIC_*` variable. After changing variables, redeploy the Vercel project.

## Diagnosing 401 Unauthorized

A 401 from `/auth/v1/signup` or `/rest/v1/ifb_projects` is not fixed by changing SQL when the API key is invalid/missing or the URL and key belong to different Supabase projects. Verify the two variables above are present and from the same project. A missing Auth session also means protected tables cannot be queried. RLS/SQL errors generally need their own Postgres/API error details; do not disable RLS to hide them.


## MCP Server (AI agents)

The universal SQL also creates account-scoped MCP token storage and a private audit log. Raw bearer tokens are never stored. After running the SQL, add this server-only Vercel environment variable for Production, Preview and Development:

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service_role key (or the project secret key supported by your Supabase setup). Never use a `NEXT_PUBLIC_` prefix and never expose it to the browser. Redeploy after saving.
- `NEXT_PUBLIC_APP_URL` — canonical public app origin, e.g. `https://your-app.vercel.app`, so the Settings screen displays the correct endpoint.

The MCP endpoint is `/api/mcp` using Streamable HTTP, JSON-RPC 2.0 and Bearer authentication. Token creation requires a logged-in IFoundBug account. Use one token per AI client, grant only required scopes, and revoke compromised tokens immediately.

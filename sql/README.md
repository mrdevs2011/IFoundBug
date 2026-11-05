# FoundBug — database setup

There are three incremental SQL files. Run `IFOUNDBUG_UNIVERSAL.sql` first, `V2_PUBLIC_MODEL.sql` second, and `V3_ISSUE_SEARCH_INDEXES.sql` third, in **Supabase Dashboard → SQL Editor**. `FOUNDBUG_CANONICAL.sql` is the consolidated fresh-install snapshot of those schema/policy/index scripts plus Realtime publication setup; use either the ordered incremental files or the canonical snapshot, not both. The base file deliberately installs no permissive application policies; the V2 file installs the production access model. Re-running the base file after V2 is fail-closed (it may temporarily revoke public access), so always re-run V2 afterwards. Both files preserve application rows.

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


## Production setup order

1. Take a current database backup.
2. Run `IFOUNDBUG_UNIVERSAL.sql` first.
3. Run `V2_PUBLIC_MODEL.sql` second to install public-project visibility, private issue links, invite flows, role-aware RLS/RPC guards, and private attachment delivery.
4. Verify both scripts complete successfully and test the access matrix before enabling production traffic.

The base file intentionally leaves application tables fail-closed. If it is re-run after V2, immediately re-run V2 to restore the role-aware policies. The V3 index migration is additive and preserves application rows.

## Attachment privacy limitation

The bug-attachments bucket is private. Uploads return guarded `/api/attachments/...` URLs; the route checks issue visibility through RLS or validates the secret issue token before reading the object with the server-only storage key. The V2 migration converts existing public object URLs to the guarded proxy paths. Do not expose the service-role key to client code.

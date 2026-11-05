# Reliability and Production Readiness

## Zero-regression contract

Preserve existing authentication, project and issue workflows, invitation roles, private-link access, widget API contracts, MCP tools and database records. Database changes must be additive or safely repeatable; never disable RLS to hide an application error.

## Verification gates

Run these checks before merging:

- npm run lint
- npx tsc --noEmit --incremental false
- npm run build

Apply both SQL files to an isolated PostgreSQL/Supabase-compatible test database before applying them to production. Test owner and admin boundaries, private project access, private issue links, guest reporting, issue triage guards, comments, votes and invitation expiry.

## Security requirements

- Keep Supabase service-role credentials server-only.
- Use the publishable key in browser code.
- Keep profile reads column-scoped; do not expose Auth user IDs to public clients.
- Treat project membership, issue visibility and triage rights as database-enforced controls.
- Keep private links unguessable and rotate/revoke them when access changes.
- Do not store raw MCP bearer tokens.
- Attachments are stored in a private Storage bucket and streamed only after issue-level RLS or secret-link validation. Legacy public object URLs are converted by the V2 migration.

## Runtime and resource lifecycle

Supabase Realtime subscriptions are tied to component lifecycle and removed during cleanup. Data refresh is event-driven rather than interval polling. Short-lived timers are limited to search debounce and transient copy feedback; component-owned timers are cleared on unmount. Predictable writes update local UI first and roll back if persistence fails; values that must be generated securely on the server show an immediate pending state.

## Known release gates

- Realtime subscriptions are implemented for dashboard, repository and issue views. Private shared-link event delivery depends on RLS and still requires cross-device verification against the production Supabase project.
- Attachments use a private Storage bucket and an authorization-aware streaming route. Public issues are checked through RLS; link-only issues require the secret issue token. The service-role key is used only after access validation and never reaches the browser.
- Supabase production migrations have not been applied from this workstation; run both ordered SQL files in the target Supabase project and verify Vercel environment variables before release.
- Browser-level end-to-end testing against a real Supabase project is required; lint, TypeScript and build alone do not prove live auth, RLS, Storage or Realtime behavior.

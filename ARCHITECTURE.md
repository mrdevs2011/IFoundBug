# IFoundBug Architecture

## Overview

IFoundBug is a Next.js App Router application backed by Supabase Auth and PostgreSQL. The browser is a presentation and interaction client; PostgreSQL owns durable application records, access policies, generated identifiers, and transactional state changes.

## Application layers

- src/app: route composition, route-level state, and API handlers.
- src/components: reusable UI, forms, issue views, annotation, team and MCP dialogs.
- src/lib/db.ts: typed Supabase data access and RPC adapters.
- src/lib/supabase: browser client, server auth and username-based identity mapping.
- sql/IFOUNDBUG_UNIVERSAL.sql: base tables, constraints, indexes, triggers, notifications and storage setup.
- sql/V2_PUBLIC_MODEL.sql: role-aware RLS, private issue links, write guards and transactional RPCs.

## Data and identity boundaries

Supabase Auth owns authentication. Usernames are mapped to stable synthetic email addresses for Supabase Email/Password Auth; the application does not require a real email address. ifb_profiles maps Auth identities to application profile IDs.

The primary records are profiles, projects, project memberships, invitations, bugs, comments, audit events, votes, notifications and MCP tokens. The browser uses the publishable key only. MCP uses a server-only service key after validating an account-scoped token and its scopes.

## Access model

- Public projects and non-sensitive, listed issues can be read publicly.
- Private projects are visible only to project members.
- Private-link issues are excluded from listings and require their secret link or an authorized reporter/member session.
- Public guest issue creation is allowed only when the project enables guest reports; private projects require membership.
- Reporter writes are constrained by database triggers. Triage fields require a project role with triage permission.
- Owner/admin membership changes are guarded in PostgreSQL, not trusted to UI checks.
- MCP bearer tokens are stored as SHA-256 digests and are scoped per account.

## Realtime and state

The dashboard, repository issue list and issue detail views subscribe to Supabase Postgres Changes and refresh only the affected data. Shared-link issue views subscribe using the resolved issue ID; delivery for private rows remains subject to the active RLS policy and must be verified against the production project. Every subscription is removed when its component unmounts. No route uses recurring polling for data refresh. User-facing writes use optimistic state where the result is predictable and roll back on server rejection; server-generated secrets are shown immediately after the server returns them.

## Media and privacy boundary

Issue attachments live in a private Supabase Storage bucket. Uploads store guarded `/api/attachments/...` paths; the route verifies the bug row through RLS or validates the private issue token before using the server-only storage key to stream the object. The V2 migration converts legacy public object URLs to proxy paths without changing stored object keys.

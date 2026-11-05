// ifb_help: the operating manual an AI agent reads before working in IFB.
// Keep every statement true to /api/mcp behaviour; tests assert key facts.

export const HELP_TOPICS = ['quickstart', 'playbooks', 'tools', 'search', 'reporting', 'triage', 'images', 'permissions', 'errors', 'rules'] as const;

const SECTIONS: Record<(typeof HELP_TOPICS)[number], string> = {
  quickstart: `IFB (IFoundBug) is a GitHub-style issue tracker for software bugs. You act on behalf of the token owner.
Model: repository (= project) → issues (= bugs) → comments, activity, attachments.
Issue fields: code (e.g. BRB-12), title, status, severity, priority, environment, assignee, steps, actual/expected behaviour, dev_notes, evidence images.
Identifiers: a repository can be passed as UUID, slug or exact/partial name ("ifb barbershop" works). An issue as UUID or code.

No MCP client? The same tools are available as a REST API: GET /api/v1 lists endpoints (same token, scopes and limits).

First 3 calls in any session:
1. who_am_i → your identity and token scopes (what you are allowed to do).
2. list_projects → repositories you can see, with your membership_role.
3. ifb_help { topic: "playbooks" } → how to handle the user's request.`,

  playbooks: `Map the user's request to a playbook. Always finish with a short summary of what you changed, with issue codes.

A) "Find bugs in my app and push them to <repo>"
  1. Audit the code / app. Collect only real, reproducible problems (no style nits unless asked).
  2. For each: title, severity, priority, environment, steps_to_reproduce, actual_behavior, expected_behavior, section (area), summary with file paths/lines.
  3. create_bugs { project: "<repo>", bugs: [...] } (max 20 per call; split bigger batches).
  4. Read results: created → codes; skipped → duplicate_of (an open issue already covers it; consider add_comment there with new details); error → fix and retry that item only.
  5. Screenshots: see topic "images".

B) "What new bugs came in?" / "Review the inbox"
  1. whats_new { since: "24h" } (or "7d", "30m", ISO date; project optional).
  2. Report: counts by severity, then CRITICAL/HIGH first with code, title, repo, reporter. Mention new comments that need an answer.
  3. Offer next actions (triage, assign, ask reporter for details). Do not change anything unless asked.

C) "Triage these" → see topic "triage".

D) "Change status / assign / reprioritise X"
  update_bug { bug: "BRB-12", status: "IN_PROGRESS", assigned_to: "me" }   (assigned_to: "me" | username | UUID | "" to unassign)
  Many at once: bulk_update_bugs { bugs: ["BRB-1","BRB-2"], status: "CLOSED", comment: "Fixed in v1.4" }.

E2) "How is the project going?" / "Weekly report" → get_insights { project }; report open vs closed trend, median time to close, critical backlog and overloaded people.

E) "Find / show me issues about X" → search_bugs { q: "..." } (topic "search"). Open one with get_bug { project, bug }.

F) "Fix bug X" (you have code access)
  get_bug → list_comments → update_bug { status: "IN_PROGRESS", assigned_to: "me" } → fix → add_comment with root cause + fix summary → update_bug { status: "READY_FOR_QA", dev_notes }.

G) "Discuss / reply" → list_comments then add_comment { bug, content } (internal: true = team-only note, needs a team role).

H) Team setup: create_project, list_members, create_invite { project, role } → share the returned url.`,

  tools: `Tool (required args) [scope] — purpose
ifb_help (topic?) [none] — this manual.
who_am_i () [none] — identity + scopes.
whats_new (since?, project?, only_open?=true, limit?) [bugs:read] — new/updated issues and new comments since a time, across repos you work in.
search_bugs (q, project?, limit?) [bugs:read] — query-language search across your repos.
get_insights (project) [bugs:read] — analytics: totals, median/p90 time to close, severity mix, weekly trend, team workload.
list_projects (include_public?) [projects:read] — repos + membership_role.
discover_public_spaces (search?, limit?) [spaces:discover] — public repos that accept reports.
list_bugs (project, status?, severity?, search?, limit?) [bugs:read] — newest issues in one repo.
get_bug (project, bug) [bugs:read] — full issue.
create_bug (project, title, …fields) [bugs:create] — one issue.
create_bugs (project, bugs[≤20], skip_duplicates?=true) [bugs:create] — batch with duplicate check.
update_bug (bug, status?|severity?|priority?|assigned_to?|dev_notes?|title?|summary?) [bugs:update] — audited change.
bulk_update_bugs (bugs[≤50], status?|severity?|priority?|assigned_to?|dev_notes?, comment?) [bugs:update (+comments:create for comment)].
list_comments (bug) [comments:read]; add_comment (bug, content, internal?) [comments:create].
get_bug_activity (bug) [activity:read] — audit timeline.
list_members (project) [members:read].
list_notifications (limit?, unread_only?) [notifications:read]; mark_notification_read (notification_id) [notifications:update].
create_project (name, …) [projects:create]; update_project (project, …) [projects:update, owner/admin].
create_invite (project, role?, max_uses?, expires_in_days?) / list_invites (project) / revoke_invite (invite_id) [invites:*, owner/admin].
import_github_images (bug, repo, path, ref?, github_token?) [bugs:update or bugs:create] — attach screenshots from GitHub.

Enums
status: REPORTED, TRIAGED, IN_PROGRESS, READY_FOR_QA, VERIFIED, FIXED, CLOSED, WONT_FIX  (open = first four)
severity: CRITICAL, HIGH, MEDIUM, LOW · priority: P0, P1, P2, P3 · environment: PRODUCTION, STAGING, DEVELOPMENT, LOCAL
Bug fields for create: title (≤180, required), summary, section, severity, priority, environment, actual_behavior, expected_behavior, steps_to_reproduce[≤30], evidence_urls[≤10].`,

  search: `search_bugs { q } query language (same as the web UI):
- free text: words match title, code, summary, section, actual/expected behaviour, reporter. "quoted phrase" keeps spaces.
- status:in_progress  priority:P1  severity:high   (case-insensitive; spaces/dashes become _)
- assignee:me | assignee:<username>     author:<name>
- repo:<slug-or-name> (also project:, repository:)
- created:>2026-01-01  created:<2026-02-01  updated:>2026-03-01
Terms are AND-ed. Max 20 terms / 512 chars. Unknown fields return an error listing the supported ones.
Examples: "checkout crash severity:critical status:reported" · "assignee:me status:in_progress" · "repo:barbershop created:>2026-11-01".`,

  reporting: `Write issues a developer can fix without asking questions.
Title: "<Where>: <what goes wrong> <when>" e.g. "Booking: Confirm spins forever on iOS Safari". No "Bug:" prefix, no ALL CAPS, ≤ 80 chars ideal.
summary: 1–3 sentences of impact + suspected cause; include file paths/lines, endpoints, error text.
steps_to_reproduce: numbered, minimal, starting from a URL or state. actual_behavior vs expected_behavior: concrete and observable.
section: product area ("Auth", "Booking", "Payments", "API"). environment: where you saw it.
Severity (impact):
  CRITICAL – data loss, security hole, payments/auth broken, app unusable for most users.
  HIGH – core feature broken or wrong results, no reasonable workaround.
  MEDIUM – feature partly broken, workaround exists.
  LOW – cosmetic, copy, minor UX.
Priority (urgency): P0 now/hotfix, P1 this sprint, P2 soon, P3 backlog. Default MEDIUM/P2 when unsure, and say why in summary.
Security findings: describe impact and location; never paste working secrets or live credentials.
One problem per issue. Same root cause in many places → one issue listing all places.`,

  triage: `Triage = turn REPORTED issues into actionable ones.
1. whats_new { since: "7d" } or search_bugs { q: "status:reported" }.
2. For each: get_bug; check duplicates with search_bugs on key words.
   - duplicate → add_comment "Duplicate of BRB-7" then update_bug { status: "CLOSED" }.
   - missing info → add_comment asking for exact steps/environment; leave REPORTED.
   - valid → update_bug { status: "TRIAGED", severity, priority, assigned_to? }.
   - not a bug / will not do → add_comment with reason, update_bug { status: "WONT_FIX" }.
3. Status meaning: TRIAGED accepted · IN_PROGRESS being fixed · READY_FOR_QA fix deployed for testing · VERIFIED QA confirmed · FIXED done · CLOSED closed without further work · WONT_FIX declined.
4. Propose the plan to the user before applying changes to more than a few issues; then use bulk_update_bugs.`,

  images: `MCP cannot upload files directly. Use GitHub as a bridge (works for agents that only have GitHub access):
1. Commit screenshots to any GitHub repo, e.g. evidence/booking-spinner.png (png/jpg/webp/gif, ≤5 MB each).
2. import_github_images { bug: "BRB-12", repo: "owner/name", path: "evidence/booking-spinner.png", ref: "main" }.
   path may be a folder: every image in it is imported. Max 10 attachments per issue.
3. IFB downloads them, verifies they are real images, stores them privately and attaches them. They appear in the issue.
Private GitHub repo: the IFB server's GITHUB_TOKEN is used, or pass github_token (read-only) — it is never stored.
Remove sensitive screenshots from GitHub afterwards.`,

  permissions: `- Token scopes limit tools (see topic "tools"). who_am_i shows yours.
- Private repository: only members can read or write. Public repository: readable by anyone; create_bug/create_bugs only if it allows guest reports.
- Write roles (update, bulk update, triage): owner, admin, developer, qa_tester, team_lead, product_manager. viewer/hunter can read and comment.
- Reporters may attach images to their own issues.
- Internal comments (internal: true) need a team role; they are hidden from non-team readers.
- Settings and invites: owner/admin only.
- Assignee must be a member of the repository.
- Rate limit: 120 requests/minute per token. Every call is audited.`,

  errors: `"Permission denied: missing <scope>" → token lacks that scope; ask the user to create a token with it (Account menu → MCP settings).
"Project not found or access denied" → wrong name or you are not a member; call list_projects.
"Bug \"X\" not found" → check the code with search_bugs; issues behind a private link are hidden from non-members.
"Only project members with a write role…" → your role is viewer/hunter; ask an admin.
"<name> is not a member of this repository" / "ambiguous" → use list_members and pass the exact username.
"Rate limit exceeded" → wait a minute, then batch (create_bugs, bulk_update_bugs).
Batch tools never fail as a whole: read each item's ok/error and retry only failed items.`,

  rules: `Rules for agents:
1. Only change what the user asked for. Never close, reassign or downgrade issues on your own initiative.
2. Before bulk changes (more than 5 issues) show the list and get confirmation.
3. Never invent reproduction steps or results you did not observe; mark guesses as such in summary.
4. Check duplicates (create_bugs does it for you; for single issues use search_bugs first).
5. Leave a comment explaining every status change you make on someone else's issue.
6. Never put secrets, tokens or personal data in issues or comments.
7. End every task with a summary: created / updated / skipped issue codes and any failures.`,
};

export function helpText(topic?: string): string {
  const t = (topic || '').toLowerCase() as (typeof HELP_TOPICS)[number];
  if (t && SECTIONS[t]) return `# ifb_help: ${t}\n\n${SECTIONS[t]}`;
  if (t) throw new Error(`Unknown topic "${topic}". Use one of: ${HELP_TOPICS.join(', ')}.`);
  return `# IFB agent manual\n\n` + HELP_TOPICS.map((k) => `## ${k}\n${SECTIONS[k]}`).join('\n\n') + `\n\nTip: ifb_help { topic } returns one section (${HELP_TOPICS.join(' | ')}).`;
}

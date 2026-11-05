export const HELP_TOPICS = ['overview', 'agent', 'tools', 'images', 'workflow', 'permissions'] as const;

const SECTIONS: Record<string, string> = {
  overview: `IFB (IFoundBug) = GitHub-style issue tracker for bugs.
- Repository (project): holds issues. Public or private. Public ones can allow guest reports.
- Issue (bug): has code (e.g. IFB-12), status, severity (CRITICAL..LOW), priority (P0..P3), comments, evidence images.
- You talk to IFB through MCP at /api/mcp with a Bearer token (ifbm_...). Token scopes decide what you can do.
- Start with who_am_i, then list_projects.`,
  agent: `How to handle common requests:
- "Find bugs in my app and push them to <repo>": audit the code/app, then create_bugs { project: "<repo name or slug>", bugs: [{ title, severity, steps_to_reproduce, actual_behavior, expected_behavior }] }. Duplicates of open issues are skipped automatically and returned as duplicate_of. Screenshots: see topic images.
- "What new bugs came in?": whats_new { since: "24h" } (or "7d", or an ISO date). Summarise by severity, call out CRITICAL/HIGH first, suggest owners.
- "Change status / assign / reprioritise": update_bug { bug: "IFB-12", status: "IN_PROGRESS", assigned_to: "me" | "username" }. Many at once: bulk_update_bugs { bugs: ["IFB-1","IFB-2"], status: "CLOSED", comment: "Fixed in release 1.4" }.
- "Find X": search_bugs { q: "login crash status:REPORTED severity:HIGH assignee:me created:>2026-01-01" }.
- Before changing many issues, show the list and confirm with the user. Never close or reassign issues the user did not ask about.`,
  tools: `Agent: whats_new, search_bugs, create_bugs (batch + duplicate check), bulk_update_bugs.
Read: who_am_i, list_projects, discover_public_spaces, list_bugs, get_bug, list_comments, list_members, get_bug_activity, list_notifications.
Write: create_project, update_project, create_bug, update_bug, add_comment, mark_notification_read.
Invites: create_invite, list_invites, revoke_invite (owner/admin only).
Images: import_github_images.
Help: ifb_help (this).
Project can be given as UUID, slug or name. Bug as UUID or code.`,
  images: `No file upload over MCP? Use GitHub as a bridge (works for agents that only have GitHub access):
1. Commit the screenshots to any GitHub repo, e.g. evidence/login-bug.png (png/jpg/webp/gif, <=5MB, max 10).
2. Call import_github_images { bug: "IFB-12", repo: "owner/name", path: "evidence/login-bug.png", ref: "main" }.
   path may also be a folder: all images inside are imported.
3. IFB downloads them, stores them privately, and attaches them to the issue. Done.
Private repo: set GITHUB_TOKEN on the IFB server, or pass github_token (read-only token) in the call; it is never stored.
Max 10 attachments per issue. Tip: delete the images from GitHub afterwards if they contain secrets.`,
  workflow: `Report a bug well:
1. list_projects -> pick repository.
2. list_bugs { project, search } -> avoid duplicates.
3. create_bug { project, title, steps_to_reproduce[], actual_behavior, expected_behavior, severity, environment }.
4. Have screenshots? push to GitHub, then import_github_images.
5. Work on it: update_bug { bug, status: "IN_PROGRESS", assigned_to, dev_notes }; add_comment for discussion.
Status flow: REPORTED -> TRIAGED -> IN_PROGRESS -> READY_FOR_QA -> VERIFIED -> FIXED -> CLOSED (or WONT_FIX).`,
  permissions: `- Private repo: you must be a member. Public repo: anyone can read.
- create_bug in a public repo you are not in: only if it allows guest reports.
- update_bug / import_github_images: need a write role (owner, admin, developer, qa_tester, team_lead, product_manager); the reporter may attach images to their own issue.
- Internal comments: team roles only.
- Invites: owner/admin only.
- Missing scope => "Permission denied: missing <scope>". Create a token with more scopes in IFB settings.
- Rate limit: 120 requests/minute per token.`,
};

export function helpText(topic?: string): string {
  const t = (topic || '').toLowerCase();
  if (t && SECTIONS[t]) return `# ifb_help: ${t}\n\n${SECTIONS[t]}`;
  if (t) throw new Error(`Unknown topic "${topic}". Use one of: ${HELP_TOPICS.join(', ')}.`);
  return HELP_TOPICS.map((k) => `## ${k}\n${SECTIONS[k]}`).join('\n\n') + `\n\nTip: ifb_help { topic } returns a single section (${HELP_TOPICS.join(' | ')}).`;
}

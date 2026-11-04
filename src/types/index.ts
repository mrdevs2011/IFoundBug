export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type BugStatus = 
  | 'REPORTED' 
  | 'TRIAGED' 
  | 'IN_PROGRESS' 
  | 'READY_FOR_QA' 
  | 'VERIFIED' 
  | 'FIXED' 
  | 'CLOSED' 
  | 'WONT_FIX';

export type Environment = 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT' | 'LOCAL';
export type MemberRole = 'owner' | 'admin' | 'developer' | 'qa_tester' | 'viewer';

export interface DeviceTelemetry {
  browser: string;
  os: string;
  resolution: string;
  viewport: string;
  userAgent?: string;
  language?: string;
  memory?: string;
  connection?: string;
}

export interface AcceptanceCriterion {
  id: string;
  text: string;
  checked: boolean;
}

export interface Bug {
  id: string;
  code: string; // e.g. "B01", "IFB-101"
  project_id: string;
  title: string;
  summary?: string;
  section: string;
  screen?: string;
  severity: Severity;
  priority: Priority;
  status: BugStatus;
  environment: Environment;
  actual_behavior: string;
  expected_behavior: string;
  steps_to_reproduce: string[];
  acceptance_criteria: AcceptanceCriterion[];
  device_telemetry?: DeviceTelemetry;
  dev_notes?: string;
  search_keys?: string[];
  evidence_urls: string[];
  is_sensitive?: boolean;
  upvotes_count: number;
  reproduced_count: number;
  views_count: number;
  assigned_to?: string;
  reporter_name: string;
  claude_code_prompt?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface BugComment {
  id: string;
  bug_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  is_internal?: boolean;
  reactions?: Record<string, string[]>;
  created_at: string;
}

export interface BugAuditLog {
  id: string;
  bug_id: string;
  actor_name: string;
  action: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  is_public: boolean;
  allow_guest_reports: boolean;
  tech_stack: string[];
  telegram_webhook_enabled?: boolean;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  github_repo_url?: string;
  created_at: string;
}

export interface ProjectInvite {
  id: string;
  project_id: string;
  token: string;
  role: MemberRole;
  max_uses: number;
  uses_count: number;
  expires_at?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'developer' | 'qa_tester' | 'team_lead' | 'product_manager';
  organization?: string;
  created_at: string;
}

import type { BugStatus, Severity, Environment } from '@/types';
export const STATUS_LABEL: Record<BugStatus,string> = { REPORTED:'Open', TRIAGED:'Triaged', IN_PROGRESS:'In progress', READY_FOR_QA:'Ready for QA', VERIFIED:'Verified', FIXED:'Fixed', CLOSED:'Closed', WONT_FIX:"Won't fix" };
export const STATUS_ORDER = Object.keys(STATUS_LABEL) as BugStatus[];
export const DONE_STATUSES: BugStatus[] = ['FIXED','CLOSED','WONT_FIX','VERIFIED'];
export const STATUS_STYLE: Record<BugStatus,string> = { REPORTED:'bg-[#1f6feb]/10 text-[#79c0ff] border-[#1f6feb]/30', TRIAGED:'bg-[#8957e5]/10 text-[#d2a8ff] border-[#8957e5]/30', IN_PROGRESS:'bg-[#d29922]/10 text-[#e3b341] border-[#d29922]/30', READY_FOR_QA:'bg-[#1f6feb]/10 text-[#79c0ff] border-[#1f6feb]/30', VERIFIED:'bg-[#238636]/10 text-[#3fb950] border-[#238636]/30', FIXED:'bg-[#238636]/10 text-[#3fb950] border-[#238636]/30', CLOSED:'bg-[#8b949e]/10 text-[#8b949e] border-[#8b949e]/30', WONT_FIX:'bg-[#8b949e]/10 text-[#8b949e] border-[#8b949e]/30' };
export const SEVERITY_LABEL: Record<Severity,string> = { CRITICAL:'Critical', HIGH:'High', MEDIUM:'Medium', LOW:'Low' };
export const SEVERITY_ORDER: Severity[] = ['CRITICAL','HIGH','MEDIUM','LOW'];
export const SEVERITY_DOT: Record<Severity,string> = { CRITICAL:'bg-[#f85149]', HIGH:'bg-[#db6d28]', MEDIUM:'bg-[#d29922]', LOW:'bg-[#8b949e]' };
export const SEVERITY_STYLE: Record<Severity,string> = { CRITICAL:'bg-[#f85149]/10 text-[#ff7b72] border-[#f85149]/30', HIGH:'bg-[#db6d28]/10 text-[#ffa657] border-[#db6d28]/30', MEDIUM:'bg-[#d29922]/10 text-[#e3b341] border-[#d29922]/30', LOW:'bg-[#8b949e]/10 text-[#8b949e] border-[#8b949e]/30' };
export const ENV_LABEL: Record<Environment,string> = { PRODUCTION:'Production', STAGING:'Staging', DEVELOPMENT:'Development', LOCAL:'Local' };
export function timeAgo(iso:string):string { const s=Math.max(1,Math.floor((Date.now()-new Date(iso).getTime())/1000)); if(s<60)return 'just now'; const m=Math.floor(s/60); if(m<60)return `${m}m ago`; const h=Math.floor(m/60); if(h<24)return `${h}h ago`; const d=Math.floor(h/24); if(d<30)return `${d}d ago`; return new Date(iso).toLocaleDateString('en-US'); }

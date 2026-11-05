// Pull evidence images from a GitHub repository so agents that only have GitHub
// access can hand screenshots to IFB. Only api.github.com is ever contacted.
export const EVIDENCE_EXT: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const MAX_EVIDENCE_FILES = 10;

const REPO_RE = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/;
const REF_RE = /^[A-Za-z0-9_./-]{1,200}$/;

export type GithubSource = { repo: string; path: string; ref?: string; token?: string };
export type FetchedImage = { name: string; ext: string; contentType: string; bytes: Uint8Array };

export function parseGithubSource(a: Record<string, unknown>): GithubSource {
  const repo = String(a.repo || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/+$/, '');
  if (!REPO_RE.test(repo)) throw new Error('repo must look like "owner/name".');
  const path = String(a.path || '').trim().replace(/^\/+|\/+$/g, '');
  if (path.split('/').some((s) => s === '..' || s === '.') || /[\\?#%]/.test(path)) throw new Error('Invalid path.');
  const ref = a.ref ? String(a.ref).trim() : undefined;
  if (ref && (!REF_RE.test(ref) || ref.includes('..'))) throw new Error('Invalid ref.');
  return { repo, path, ref, token: (typeof a.github_token === 'string' && a.github_token) || process.env.GITHUB_TOKEN || undefined };
}

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() || '';

export function sniffImage(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'gif';
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'webp';
  return null;
}

export async function fetchGithubImages(src: GithubSource, fetchImpl: typeof fetch = fetch): Promise<FetchedImage[]> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'ifoundbug-mcp', 'X-GitHub-Api-Version': '2022-11-28' };
  if (src.token) headers.Authorization = `Bearer ${src.token}`;
  const q = src.ref ? `?ref=${encodeURIComponent(src.ref)}` : '';
  const api = (p: string) => `https://api.github.com/repos/${src.repo}/contents/${p.split('/').map(encodeURIComponent).join('/')}${q}`;
  const res = await fetchImpl(api(src.path), { headers });
  if (res.status === 404) throw new Error('GitHub path not found (private repo? pass github_token or set GITHUB_TOKEN).');
  if (!res.ok) throw new Error(`GitHub responded ${res.status}.`);
  const json = await res.json();
  const entries: { type: string; name: string; size: number; download_url: string | null }[] = Array.isArray(json) ? json : [json];
  const files = entries.filter((e) => e.type === 'file' && EVIDENCE_EXT[extOf(e.name)]).slice(0, MAX_EVIDENCE_FILES);
  if (!files.length) throw new Error('No png/jpg/webp/gif images found at that path.');
  const out: FetchedImage[] = [];
  for (const f of files) {
    if (f.size > MAX_EVIDENCE_BYTES) throw new Error(`${f.name} is larger than 5 MB.`);
    // download_url is always on raw.githubusercontent.com; refuse anything else.
    if (!f.download_url || new URL(f.download_url).hostname !== 'raw.githubusercontent.com') throw new Error(`${f.name} has no downloadable URL.`);
    const r = await fetchImpl(f.download_url, { headers: src.token ? { Authorization: `Bearer ${src.token}`, 'User-Agent': 'ifoundbug-mcp' } : { 'User-Agent': 'ifoundbug-mcp' } });
    if (!r.ok) throw new Error(`Could not download ${f.name} (${r.status}).`);
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length > MAX_EVIDENCE_BYTES) throw new Error(`${f.name} is larger than 5 MB.`);
    const real = sniffImage(bytes);
    if (!real) throw new Error(`${f.name} is not a valid image.`);
    out.push({ name: f.name, ext: real, contentType: EVIDENCE_EXT[real], bytes });
  }
  return out;
}

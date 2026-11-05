// Only avatars stored in our own public "avatars" bucket are rendered. External URLs
// (e.g. legacy seed data) fall back to initials so third parties never see viewers' IPs.
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
export const PROFILE_UPDATED_EVENT = 'ifb:profile-updated';

export function avatarPrefix(supabaseUrl: string | undefined): string | null {
  if (!supabaseUrl) return null;
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/avatars/`;
}

export function trustedAvatar(url: string | null | undefined, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL): string | null {
  const prefix = avatarPrefix(supabaseUrl);
  if (!url || !prefix || !url.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length).split('?')[0];
  return /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(rest) ? url : null;
}

/** Username-only identity mapping for Supabase Email/Password Auth.
 * Keep this domain stable: existing accounts were created with this suffix.
 * Supabase Email provider must remain enabled; Confirm email must be OFF.
 */
export const AUTH_EMAIL_DOMAIN = 'ifoundbug.dev';
export function normalizeUsername(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, ''); }
export function usernameToAuthEmail(username: string): string { return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`; }
export function authErrorToEnglish(error: { message?: string; status?: number }): string {
 const message = (error.message || '').toLowerCase();
 if (message.includes('email rate limit exceeded') || message.includes('rate limit')) return 'Email confirmation may still be enabled, or a temporary rate limit was reached. In Authentication → Providers → Email, disable Confirm email and keep the Email provider enabled. Wait for the rate limit to reset, then try again.';
 if (message.includes('email address') && message.includes('invalid')) return 'Supabase rejected the internal sign-in address. Verify that the Email provider is enabled and Auth is configured correctly.';
 if (message.includes('user already registered')) return 'This username is already taken. Sign in or choose another username.';
 if (message.includes('password') && (message.includes('length') || message.includes('characters'))) return 'Password must contain at least 8 characters.';
 if (error.status === 401) return 'The Supabase API key is invalid or belongs to a different project than the URL. Check your Vercel environment variables.';
 return error.message || 'Authentication failed. Please try again.';
}

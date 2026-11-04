/** Username-only identity mapping for Supabase Email/Password Auth.
 * Keep this domain stable: existing accounts were created with this suffix.
 * Supabase Email provider must remain enabled; Confirm email must be OFF.
 */
export const AUTH_EMAIL_DOMAIN = 'ifoundbug.dev';
export function normalizeUsername(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, ''); }
export function usernameToAuthEmail(username: string): string { return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`; }
export function authErrorToUzbek(error: { message?: string; status?: number }): string {
 const message = (error.message || '').toLowerCase();
 if (message.includes('email rate limit exceeded') || message.includes('rate limit')) return 'Supabase email tasdiqlash hali o‘chiq emas yoki vaqtinchalik limitga tushilgan. Authentication → Providers → Email bo‘limida Confirm email ni OFF qil. Email provider esa ON qolishi shart. Limit tugashi uchun biroz kutib, keyin qayta urin.';
 if (message.includes('email address') && message.includes('invalid')) return 'Supabase sintetik login manzilini rad etdi. Email provider yoqilganini va Auth sozlamalarini tekshir.';
 if (message.includes('user already registered')) return 'Bu username allaqachon band. Kirish bo‘limidan foydalan yoki boshqa username tanla.';
 if (message.includes('password') && (message.includes('length') || message.includes('characters'))) return 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak.';
 if (error.status === 401) return 'Supabase API kaliti yaroqsiz yoki URL bilan boshqa loyihaga tegishli. Vercel Environment Variables sozlamalarini tekshir.';
 return error.message || 'Autentifikatsiyada xatolik yuz berdi. Qayta urinib ko‘ring.';
}

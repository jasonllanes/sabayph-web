export const ADMIN_EMAILS = ['llanesjason19@gmail.com'];

export function isAdmin(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes(email ?? '');
}

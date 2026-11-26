export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export interface AuthUser { id: string; email: string | null; role: Role }
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

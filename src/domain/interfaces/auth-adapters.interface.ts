// Propósito del token: un token de reset no sirve como sesión y viceversa
export const TokenPurpose = {
  SESSION: 'session',
  RESET_PASSWORD: 'reset-password',
} as const;

// Contratos de los adaptadores que usan los casos de uso.
// Las implementaciones (JWT, bcrypt) viven en config y se inyectan desde presentation.
export type SignToken = (payload: object, duration?: string) => Promise<string | null>;
export type ValidateToken = <T>(token: string) => Promise<T | null>;
export type HashPassword = (password: string) => string;
export type ComparePassword = (password: string, hashed: string) => boolean;
export type PasswordFingerprint = (hashed: string) => string;

import 'dotenv/config';
import { get } from 'env-var';

// SendGrid solo es obligatorio cuando realmente se envían correos
const SEND_EMAIL = get('SEND_EMAIL').default('false').asBool();

export const envs = {
  PORT: get('PORT').required().asPortNumber(),
  PUBLIC_PATH: get('PUBLIC_PATH').default('public').asString(),
  POSTGRES_URL: get('POSTGRES_URL').required().asString(),
  JWT_SEED: get('JWT_SEED').required().asString(),

  SEND_EMAIL,
  SENDGRID_API_KEY: get('SENDGRID_API_KEY').required(SEND_EMAIL).default('').asString(),
  MAILER_EMAIL: get('MAILER_EMAIL').required(SEND_EMAIL).default('').asString(),

  FRONTEND_URL: get('FRONTEND_URL').required().asString(),
  ACCEPTED_ORIGINS: get('ACCEPTED_ORIGINS').default('http://localhost:4200').asArray(','),

  // Número de proxies delante de la API (Railway = 1). Necesario para que el rate limit vea la IP real
  TRUST_PROXY: get('TRUST_PROXY').default('1').asIntPositive(),

  // Zona horaria del negocio (IANA) usada para calcular días, semanas y meses en el dashboard
  TIMEZONE: get('TIMEZONE').default('America/Mexico_City').asString(),
};

// TIMEZONE debe ser una zona horaria IANA válida (ej: America/Mexico_City)
try {
  new Intl.DateTimeFormat('en-US', { timeZone: envs.TIMEZONE });
} catch {
  throw new Error(`Invalid TIMEZONE env var: ${envs.TIMEZONE}`);
}

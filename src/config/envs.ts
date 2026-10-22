import 'dotenv/config';
import { get } from 'env-var';

export const envs = {
  PORT: get('PORT').required().asPortNumber(),
  PUBLIC_PATH: get('PUBLIC_PATH').default('public').asString(),
  POSTGRES_URL: get('POSTGRES_URL').required().asString(),
  JWT_SEED: get('JWT_SEED').required().asString(),

  SENDGRID_API_KEY: get('SENDGRID_API_KEY').required().asString(),
  MAILER_EMAIL: get('MAILER_EMAIL').required().asString(),
  SEND_EMAIL: get('SEND_EMAIL').default('false').asBool(),

  FRONTEND_URL: get('FRONTEND_URL').required().asString(),
  ACCEPTED_ORIGINS: get('ACCEPTED_ORIGINS').default('http://localhost:4200').asArray(','),

  // Zona horaria del negocio (IANA) usada para calcular días, semanas y meses en el dashboard
  TIMEZONE: get('TIMEZONE').default('America/Mexico_City').asString(),
};

// TIMEZONE debe ser una zona horaria IANA válida (ej: America/Mexico_City)
try {
  new Intl.DateTimeFormat('en-US', { timeZone: envs.TIMEZONE });
} catch {
  throw new Error(`Invalid TIMEZONE env var: ${envs.TIMEZONE}`);
}

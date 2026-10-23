import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Límites por IP (en memoria: válido mientras la API corra en una sola instancia)
export class RateLimitMiddleware {
  // Solo cuentan los intentos fallidos: un usuario que entra bien no consume intentos
  static login = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again in 15 minutes' },
  });

  static forgotPassword = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many password reset requests, please try again in 15 minutes' },
  });
}

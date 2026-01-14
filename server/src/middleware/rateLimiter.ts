import rateLimit from 'express-rate-limit';

// Rate limiter для логіну - захист від bruteforce атак
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 5, // максимум 5 спроб
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true, // Повертає інформацію про rate limit в `RateLimit-*` headers
  legacyHeaders: false, // Відключає `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Рахувати навіть успішні запити
});

// Rate limiter для загальних API запитів
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 хвилина
  max: 100, // максимум 100 запитів на хвилину
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter для операцій створення (POST)
export const createLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 хвилина
  max: 20, // максимум 20 запитів на хвилину
  message: {
    error: 'Too many create requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

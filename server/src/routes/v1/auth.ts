import { Router } from 'express';
import { login } from '../../controllers/auth/login';
import { loginLimiter } from '../../middleware/rateLimiter';

const authRouter = Router();

// Застосовуємо rate limiter для захисту від bruteforce атак
authRouter.post('/login', loginLimiter, login);

export default authRouter;
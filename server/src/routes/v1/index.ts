import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import authRouter from './auth';
import userRouter from './user';
import bookRouter from './books';
// ... (інші імпорти)

const v1Router = Router();

// Маршрут автентифікації залишається публічним (без authMiddleware)
v1Router.use('/auth', authRouter);

// Всі наступні маршрути будуть захищені
v1Router.use(authMiddleware);

v1Router.use('/users', userRouter);
v1Router.use('/books', bookRouter);
// ... (інші маршрути)

export default v1Router;
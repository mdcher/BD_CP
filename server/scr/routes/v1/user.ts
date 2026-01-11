import { Router } from 'express';
import { UserController } from '../../controllers/UserController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { UserRole } from '../../orm/entities/User';

const userRouter = Router();

// Отримати список всіх користувачів
userRouter.get(
  '/',
  [checkJwt, checkRole([UserRole.Admin, UserRole.Librarian])],
  UserController.getAll
);

// Заблокувати користувача (тільки Адмін)
userRouter.put(
  '/:id/block',
  [checkJwt, checkRole([UserRole.Admin])],
  UserController.block
);

// Розблокувати користувача (тільки Адмін)
userRouter.put(
  '/:id/unblock',
  [checkJwt, checkRole([UserRole.Admin])],
  UserController.unblock
);

export default userRouter;

import { Router } from 'express';
import { UserController } from '../../controllers/UserController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { setDatabaseRole } from '../../middleware/setDatabaseRole';
import { UserRole } from '../../orm/entities/User';

const userRouter = Router();

// ВАЖЛИВО: Застосовуємо setDatabaseRole для RLS політик
userRouter.use(setDatabaseRole);

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

userRouter.post('/', [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])], UserController.create);

// Block/unblock a user (for admins)
userRouter.patch('/:id/block', [checkJwt, checkRole([UserRole.Admin])], UserController.toggleBlock);

// Оновити дані користувача (роль, статус блокування, тільки Адмін)
userRouter.put(
    '/:id',
    [checkJwt, checkRole([UserRole.Admin])],
    UserController.updateUser
);

export default userRouter;

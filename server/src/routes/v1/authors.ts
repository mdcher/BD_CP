import { Router } from 'express';
import { AuthorController } from '../../controllers/AuthorController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { setDatabaseRole } from '../../middleware/setDatabaseRole';
import { UserRole } from '../../orm/entities/User';

const authorRouter = Router();

// ВАЖЛИВО: Застосовуємо setDatabaseRole для RLS політик
authorRouter.use(setDatabaseRole);

// Публічний ендпоінт для перегляду всіх авторів
authorRouter.get('/', AuthorController.getAll);

// Публічний ендпоінт для перегляду одного автора
authorRouter.get('/:id', AuthorController.getOne);

// Створити автора (тільки для персоналу)
authorRouter.post(
  '/',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  AuthorController.create
);

// Оновити автора (тільки для персоналу)
authorRouter.put(
  '/:id',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  AuthorController.update
);

// Видалити автора (тільки для адміна)
authorRouter.delete(
  '/:id',
  [checkJwt, checkRole([UserRole.Admin])],
  AuthorController.delete
);

export default authorRouter;

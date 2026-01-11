import { Router } from 'express';
import { GenreController } from '../../controllers/GenreController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { UserRole } from '../../orm/entities/User';

const genreRouter = Router();

// Публічний ендпоінт для перегляду всіх жанрів
genreRouter.get('/', GenreController.getAll);

// Публічний ендпоінт для перегляду одного жанру
genreRouter.get('/:id', GenreController.getOne);

// Створити жанр (тільки для персоналу)
genreRouter.post(
  '/',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  GenreController.create
);

// Оновити жанр (тільки для персоналу)
genreRouter.put(
  '/:id',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  GenreController.update
);

// Видалити жанр (тільки для адміна)
genreRouter.delete(
  '/:id',
  [checkJwt, checkRole([UserRole.Admin])],
  GenreController.delete
);

export default genreRouter;

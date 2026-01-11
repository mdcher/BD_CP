import { Request, Response, NextFunction } from 'express';
import { GenreService } from '../services/GenreService';

export const GenreController = {
  // Отримати всі жанри
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const genres = await GenreService.getAll();
      res.customSuccess(200, 'All genres.', genres);
    } catch (err) {
      next(err);
    }
  },

  // Отримати один жанр
  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const genreId = Number(req.params.id);
      const genre = await GenreService.getOne(genreId);
      res.customSuccess(200, 'Genre details.', genre);
    } catch (err) {
      next(err);
    }
  },

  // Створити жанр
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { genrename } = req.body;
      const newGenre = await GenreService.create(genrename);
      res.customSuccess(201, 'Genre created successfully.', newGenre);
    } catch (err) {
      next(err);
    }
  },

  // Оновити жанр
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const genreId = Number(req.params.id);
      const { genrename } = req.body;
      const updatedGenre = await GenreService.update(genreId, genrename);
      res.customSuccess(200, 'Genre updated successfully.', updatedGenre);
    } catch (err) {
      next(err);
    }
  },

  // Видалити жанр
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const genreId = Number(req.params.id);
      const result = await GenreService.delete(genreId);
      res.customSuccess(200, 'Genre deleted successfully.', result);
    } catch (err) {
      next(err);
    }
  },
};

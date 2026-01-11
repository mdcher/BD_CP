import { Request, Response, NextFunction } from 'express';
import { AuthorService } from '../services/AuthorService';

export const AuthorController = {
  // Отримати всіх авторів
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authors = await AuthorService.getAll();
      res.customSuccess(200, 'All authors.', authors);
    } catch (err) {
      next(err);
    }
  },

  // Отримати одного автора
  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authorId = Number(req.params.id);
      const author = await AuthorService.getOne(authorId);
      res.customSuccess(200, 'Author details.', author);
    } catch (err) {
      next(err);
    }
  },

  // Створити автора
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fullname } = req.body;
      const newAuthor = await AuthorService.create(fullname);
      res.customSuccess(201, 'Author created successfully.', newAuthor);
    } catch (err) {
      next(err);
    }
  },

  // Оновити автора
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authorId = Number(req.params.id);
      const { fullname } = req.body;
      const updatedAuthor = await AuthorService.update(authorId, fullname);
      res.customSuccess(200, 'Author updated successfully.', updatedAuthor);
    } catch (err) {
      next(err);
    }
  },

  // Видалити автора
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authorId = Number(req.params.id);
      const result = await AuthorService.delete(authorId);
      res.customSuccess(200, 'Author deleted successfully.', result);
    } catch (err) {
      next(err);
    }
  },
};

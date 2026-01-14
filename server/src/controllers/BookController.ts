import { Request, Response, NextFunction } from 'express';
import { BookService } from '../services/BookService';

export const BookController = {
  // Отримати всі книги
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const books = await BookService.getAll();
      // ВИПРАВЛЕНО: Передаємо масив напряму
      res.customSuccess(200, 'List of books.', books);
    } catch (err) {
      next(err);
    }
  },

  // Отримати одну книгу за ID
  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const book = await BookService.getOne(Number(req.params.id));
      if (book) {
        res.customSuccess(200, `Book ${req.params.id}.`, book);
      } else {
        res.customSuccess(404, `Book ${req.params.id} not found.`);
      }
    } catch (err) {
      next(err);
    }
  },

  // Створити нову книгу
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Валідацію та DTO можна додати тут для надійності
      const newBook = await BookService.create(req.body);
      res.customSuccess(201, 'Book created successfully.', newBook);
    } catch (err) {
      next(err);
    }
  },

  // Оновити існуючу книгу
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = Number(req.params.id);
      const updatedBook = await BookService.update(bookId, req.body);
      res.customSuccess(200, 'Book updated successfully.', updatedBook);
    } catch (err) {
      next(err);
    }
  },

  // Видалити книгу (для бібліотекарів)
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = Number(req.params.id);
      const result = await BookService.delete(bookId);
      res.customSuccess(200, result.message, result);
    } catch (err) {
      next(err);
    }
  },
};

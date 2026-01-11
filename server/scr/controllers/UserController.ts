import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';

export const UserController = {
  // Отримати всіх користувачів
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await UserService.getAll();
      res.customSuccess(200, 'List of users.', users);
    } catch (err) {
      next(err);
    }
  },

  // Заблокувати користувача
  block: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.params.id);
      const result = await UserService.setLockStatus(userId, true);
      res.customSuccess(200, 'User blocked successfully.', result);
    } catch (err) {
      next(err);
    }
  },

  // Розблокувати користувача
  unblock: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.params.id);
      const result = await UserService.setLockStatus(userId, false);
      res.customSuccess(200, 'User unblocked successfully.', result);
    } catch (err) {
      next(err);
    }
  },
};

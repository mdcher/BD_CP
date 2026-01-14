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
      const adminId = req.jwtPayload.id;
      const result = await UserService.setLockStatus(userId, true, adminId);
      res.customSuccess(200, 'User blocked successfully.', result);
    } catch (err) {
      next(err);
    }
  },

  // Розблокувати користувача
  unblock: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.params.id);
      const adminId = req.jwtPayload.id;
      const result = await UserService.setLockStatus(userId, false, adminId);
      res.customSuccess(200, 'User unblocked successfully.', result);
    } catch (err) {
      next(err);
    }
  },

  // Оновити дані користувача (роль, статус блокування)
  updateUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.jwtPayload.id;
      const targetUserId = Number(req.params.id);
      const { role, isBlocked } = req.body;
      const result = await UserService.updateUser(adminId, targetUserId, { role, isBlocked });
      res.customSuccess(200, 'User updated successfully.', result);
    } catch (err) {
      next(err);
    }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newUser = await UserService.create(req.body);
      res.customSuccess(201, 'User created successfully.', newUser);
    } catch (err) {
      next(err);
    }
  },

  toggleBlock: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.params.id);
      const { isBlocked } = req.body;
      const updatedUser = await UserService.toggleBlock(userId, isBlocked);
      res.customSuccess(200, 'User block status updated.', updatedUser);
    } catch (err) {
      next(err);
    }
  },

  // Оновити вартість типу порушення (для адмінів)
  updateViolationCost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const typeId = Number(req.params.id);
      const { newCost } = req.body;
      const adminId = req.jwtPayload.id;
      const result = await UserService.updateViolationCost(typeId, newCost, adminId);
      res.customSuccess(200, result.message, result);
    } catch (err) {
      next(err);
    }
  },

  // Отримати всі типи порушень
  getViolationTypes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const violationTypes = await UserService.getViolationTypes();
      res.customSuccess(200, 'Violation types.', violationTypes);
    } catch (err) {
      next(err);
    }
  },
};

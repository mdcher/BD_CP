import { Request, Response, NextFunction } from 'express';

export const getLanguage = (req: Request, res: Response, next: NextFunction) => {
  // Mock language middleware
  req.language = 'Reader' as any;
  next();
};

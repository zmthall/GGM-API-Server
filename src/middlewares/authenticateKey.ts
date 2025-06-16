import type { NextFunction, Request, Response } from 'express';
import { ACCESS_KEY } from '../config/accessKey';

export const authenticateKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== ACCESS_KEY) {
    res.status(403).json({ message: 'Forbidden: Invalid API key' });
    
    return;
  }

  next();
};
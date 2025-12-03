// /controllers/verify.controller.ts

import type { Request, Response } from 'express';

export const verifyLogin = async (req: Request, res: Response) => {
   res.json({
    success: true,
    isAdmin: true,
    uid: req.user?.uid,
    email: req.user?.email
  });

  return;
}
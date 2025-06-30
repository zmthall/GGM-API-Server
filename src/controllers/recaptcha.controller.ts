// controllers/recaptcha.controller.ts
import * as recaptchaService from '../services/recaptcha.services';
import { Request, Response } from 'express';

export const verifyRecaptcha = async (req: Request, res: Response) => {
  try {
    const { token, minimumScore } = req.body;
    
    const result = await recaptchaService.verifyRecaptchaToken(token, minimumScore);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    });

    return;
  }
};
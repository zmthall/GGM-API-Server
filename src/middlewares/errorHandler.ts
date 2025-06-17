import type { ErrorRequestHandler } from 'express';
import multer from 'multer';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({
      message: 'Multer upload error',
      error: err.message,
    });

    return;
  }

  res.status(500).json({
    message: 'Unexpected error',
    error: err.message || 'Unknown error',
  });

  return;
};
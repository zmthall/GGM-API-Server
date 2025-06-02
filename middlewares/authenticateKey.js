import { ACCESS_KEY } from '../config/accessKey.js';

export const authenticateKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== ACCESS_KEY) {
    return res.status(403).json({ message: 'Forbidden: Invalid API key' });
  }

  next();
};
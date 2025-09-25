// /controllers/crypto.controller.ts
import { Request, Response } from 'express';
import { cryptoService } from '../services/crypto.services';

export const encrypt = (req: Request, res: Response) => {
  const { plaintext, aad } = req.body ?? {};
  if (typeof plaintext !== 'string') {
    res.status(400).json({ error: 'plaintext must be a string' });
    return;
  }
  try {
    const envelope = cryptoService.encrypt(plaintext, typeof aad === 'string' ? aad : undefined);
    res.json({ success: true, envelope, message: 'Successfully encrypted plaintext.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'encryption failed' });
  }
};

export const decrypt = (req: Request, res: Response) => {
  const { envelope, aad } = req.body ?? {};
  if (typeof envelope !== 'string') {
    res.status(400).json({ error: 'envelope must be a string' });
    return;
  }
  try {
    const plaintext = cryptoService.decrypt(envelope, typeof aad === 'string' ? aad : undefined);
    res.json({ success: true, plaintext, message: 'Successfully decrypted envelope.' });
  } catch (err: any) {
    // GCM auth failures (bad tag/AAD) should be 400, not 500
    res.status(400).json({ error: err.message || 'decryption failed' });
  }
};

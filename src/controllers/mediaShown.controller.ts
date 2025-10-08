// /controllers/mediaShown.controller.ts
import { getSlotMap, replaceShownImageAtSlot, deleteShownImage, deleteAllShownImages, getSlotImage, getSlotImageMeta } from '../services/mediaShown.services';
import crypto from 'node:crypto'
import type { Request, Response } from 'express';

import fs from 'fs';

export const getCommunityShown = (req: Request, res: Response) => {
  const slotMap = getSlotMap();
  res.json({ slots: slotMap });
};

export const updateCommunityShown = (req: Request, res: Response) => {
  const slot = parseInt(req.params.slot, 10);
  const file = req.file;
  
  if (isNaN(slot) || slot < 0 || slot > 7) {
    if(file) {
      fs.unlinkSync(file.path);
      res.status(400).json({ message: 'Slot must be between 0 and 7' });

      return;
    } else {
      res.status(500).json({ message: 'Request file not valid.' });

      return;
    }
  }

  const alt = req.body.alt || null;

  if (!file) {
    res.status(400).json({ message: 'No file uploaded' });

    return;
  }

  try {
    const filename = replaceShownImageAtSlot(slot, file, alt); // ✅ pass `alt` here
    res.status(200).json({
      success: true,
      message: `Slot ${slot} updated`,
      filename,
      alt: alt || null,
    });

    return;
  } catch (error: any) {
    res.status(400).json({ 
      success: false,
      message: 'Upload failed', 
      error: error.message 
    });
    
    return;
  }
};

export const getCommunityShownImage = (req: Request, res: Response) => {
  const slot = parseInt(req.params.slot, 10)
  if (isNaN(slot) || slot < 0 || slot > 7) {
    res.status(400).json({ message: 'Slot must be between 0 and 7' })
    return
  }

  const asBlob = String(req.query.format || '').toLowerCase() === 'blob'

  try {
    if (!asBlob) {
      // JSON (base64) – your existing behavior
      const imageData = getSlotImage(slot)
      res.json({ success: true, ...imageData })
      return
    }

    // Blob/stream
    const { filePath, stat, filename, type } = getSlotImageMeta(slot)

    // Strong ETag based on size+mtime
    const etag = `"${crypto
      .createHash('sha1')
      .update(`${stat.size}-${stat.mtimeMs}`)
      .digest('hex')}"`

    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate')
    res.setHeader('ETag', etag)
    res.setHeader('Last-Modified', stat.mtime.toUTCString())

    if (req.headers['if-none-match'] === etag) {
      res.status(304).end()
      return
    }

    res.status(200)
    res.setHeader('Content-Type', type)
    res.setHeader('Content-Length', String(stat.size))
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)

    const stream = fs.createReadStream(filePath)
    stream.on('error', () => res.status(500).end())
    stream.pipe(res)
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message })
  }
}


export const deleteCommunityShownMedia = async (req: Request, res: Response) => {
  const { slot } = req.params;
  const slotNumber = parseInt(slot, 10);
  
  if (slotNumber === undefined || slotNumber < 0 || slotNumber > 7) {
    res.status(400).json({ message: 'Slot must be an integer from 0 to 7.' });
    
    return;
  }

  try {
    deleteShownImage(slotNumber);
    res.status(200).json({ 
      success: true,
      message: `Image in slot ${slotNumber} deleted.` 
    });

    return;
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: 'Delete failed', error: error.message 
    });

    return;
  }
};

export const deleteAllCommunityShownImages = (req: Request, res: Response) => {
  try {
    deleteAllShownImages();
    res.status(200).json({ message: 'All shown media and metadata deleted.' });

    return
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete all files', error: error.message });

    return;
  }
};
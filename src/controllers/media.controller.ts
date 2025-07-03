// /controllers/media.controller.ts
import type { Request, Response } from 'express';
import { saveCommunityMediaFile, deleteCommunityImageByUUID, removeAltFromImagesJson, fetchCommunityImageData } from '../services/media.services';
import path from 'path';

interface MulterFiles {
  [fieldname: string]: Express.Multer.File[];
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// To use this it is either key single (1 image) or key multi (25 total images)
export const uploadCommunityMedia = async (req: Request, res: Response) => {
  try {
    const files = req.files as MulterFiles
    const singleFiles = files?.single || [];
    const singleFile = singleFiles[0];
    const multiFiles = files?.multi || [];

    if (!singleFile && multiFiles.length === 0) {
      res.status(400).json({ message: 'No files uploaded' });

      return;
    }

    if (singleFiles.length > 1) {
      res.status(400).json({ message: 'Only one image allowed for single uploads.' });

      return;
    }

    // Validate extensions
    const isValidFile = (file: any) => ALLOWED_EXTENSIONS.includes(path.extname(file.originalname).toLowerCase());

    if (singleFile && !isValidFile(singleFile)) {
      res.status(400).json({ message: `Invalid file type: ${singleFile.originalname}` });

      return;
    }

    for (const file of multiFiles) {
      if (!isValidFile(file)) {
        res.status(400).json({ message: `Invalid file type: ${file.originalname}` });

        return;
      }
    }

    const paths = [];

    // Handle single upload
    if (singleFile) {
      const alt = req.body.alt || '';
      const savedPath = saveCommunityMediaFile(singleFile, alt);
      paths.push(savedPath);
    }

    // Handle multi upload
    const alts = req.body.alts || [];
    multiFiles.forEach((file, index) => {
      const alt = Array.isArray(alts) ? alts[index] || '' : '';
      const savedPath = saveCommunityMediaFile(file, alt);
      paths.push(savedPath);
    });

    res.status(200).json({
      message: 'Upload successful',
      single: singleFile?.filename || null,
      multi: multiFiles.map(f => f.filename),
      paths: paths.length === 1 ? paths[0] : paths
    });

    return;
  } catch (error: any) {
    res.status(500).json({ message: 'Upload failed', error: error.message });

    return;
  }
};

export const deleteCommunityImage = (req: Request, res: Response) => {
  const { uuid } = req.params;

  if (!uuid || typeof uuid !== 'string') {
    res.status(400).json({ message: 'Invalid UUID provided' });

    return;
  }

  try {
    const deletedFile = deleteCommunityImageByUUID(uuid);
    removeAltFromImagesJson(uuid);
    res.status(200).json({ message: `Deleted ${deletedFile} and removed alt from images.json` });

    return;
  } catch (error: any) {
    res.status(404).json({ message: error.message });

    return;
  }
};

export const getCommunityImages = (req: Request, res: Response) => {
  try {
    const images = fetchCommunityImageData();
    res.status(200).json(images);

    return;
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve community images', error: error.message });

    return;
  }
};
import { saveCommunityMediaFile, deleteCommunityImageByUUID, removeAltFromImagesJson, fetchCommunityImageData } from '../services/media.services.js';
import path from 'path';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// To use this it is either key single (1 image) or key multi (25 total images)
export const uploadCommunityMedia = async (req, res) => {
  try {
    const singleFiles = req.files?.single || [];
    const singleFile = singleFiles[0];
    const multiFiles = req.files?.multi || [];

    if (!singleFile && multiFiles.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    if (singleFiles.length > 1) {
      return res.status(400).json({ message: 'Only one image allowed for single uploads.' });
    }

    // Validate extensions
    const isValidFile = (file) => ALLOWED_EXTENSIONS.includes(path.extname(file.originalname).toLowerCase());

    if (singleFile && !isValidFile(singleFile)) {
      return res.status(400).json({ message: `Invalid file type: ${singleFile.originalname}` });
    }

    for (const file of multiFiles) {
      if (!isValidFile(file)) {
        return res.status(400).json({ message: `Invalid file type: ${file.originalname}` });
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

    return res.status(200).json({
      message: 'Upload successful',
      single: singleFile?.filename || null,
      multi: multiFiles.map(f => f.filename),
      paths: paths.length === 1 ? paths[0] : paths
    });
  } catch (error) {
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

export const deleteCommunityImage = (req, res) => {
  const { uuid } = req.params;

  if (!uuid || typeof uuid !== 'string') {
    return res.status(400).json({ message: 'Invalid UUID provided' });
  }

  try {
    const deletedFile = deleteCommunityImageByUUID(uuid);
    removeAltFromImagesJson(uuid);
    return res.status(200).json({ message: `Deleted ${deletedFile} and removed alt from images.json` });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const getCommunityImages = (req, res) => {
  try {
    const images = fetchCommunityImageData();
    return res.status(200).json(images);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve community images', error: error.message });
  }
};
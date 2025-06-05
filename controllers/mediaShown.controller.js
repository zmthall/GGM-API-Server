import { getSlotMap, replaceShownImageAtSlot, deleteShownImage, deleteAllShownImages } from '../services/mediaShown.services.js';

import fs from 'fs';

export const getCommunityShown = (req, res) => {
  const slotMap = getSlotMap();
  return res.json({ slots: slotMap });
};

export const updateCommunityShown = (req, res) => {
  const slot = parseInt(req.params.slot, 10);
  const file = req.file;
  
  if (isNaN(slot) || slot < 1 || slot > 8) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ message: 'Slot must be between 1 and 8' });
  }

  const alt = req.body.alt || null;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const filename = replaceShownImageAtSlot(slot, file, alt); // ✅ pass `alt` here
    return res.status(200).json({
      message: `Slot ${slot} updated`,
      filename,
      alt: alt || null,
    });
  } catch (error) {
    return res.status(400).json({ message: 'Upload failed', error: error.message });
  }
};

export const deleteCommunityShownMedia = async (req, res) => {
  const { slot } = req.params;
  const slotNumber = parseInt(slot, 10);

  if (!slotNumber || slotNumber < 1 || slotNumber > 8) {
    return res.status(400).json({ message: 'Slot must be an integer from 1 to 8.' });
  }

  try {
    deleteShownImage(slotNumber);
    return res.status(200).json({ message: `Image in slot ${slotNumber} deleted.` });
  } catch (error) {
    return res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

export const deleteAllCommunityShownImages = (req, res) => {
  try {
    deleteAllShownImages();
    return res.status(200).json({ message: 'All shown media and metadata deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete all files', error: error.message });
  }
};
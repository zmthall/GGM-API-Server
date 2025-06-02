import { saveCommunityMediaFile } from '../services/media.services.js';

export const uploadCommunityMedia = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const savedPath = saveCommunityMediaFile(file);
    return res.status(200).json({ message: 'Uploaded successfully', path: savedPath });
  } catch (error) {
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

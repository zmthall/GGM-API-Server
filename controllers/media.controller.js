import { saveCommunityMediaFile } from '../services/media.services.js';

// To use this it is either key single (1 image) or key multi (25 total images)

export const uploadCommunityMedia = async (req, res) => {
  try {
    const singleFiles = req.files?.single || [];     // single file
    const singleFile = singleFiles[0];
    const multiFiles = req.files?.multi || []; // array of files

    if (!singleFile && multiFiles.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    if (singleFiles.length > 1) {
      return res.status(400).json({ message: 'Only one image is allowed to be uploaded with single file uploads.' });
    }

    return res.status(200).json({
      message: 'Upload successful',
      single: singleFile?.filename || null,
      multi: multiFiles.map(f => f.filename),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};
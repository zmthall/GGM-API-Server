import fs from 'fs';
import path from 'path';
import { FULL_BASE_URL } from '../config/url';

export const IMAGES_DIR = path.resolve('src/uploads/community/images');
export const IMAGES_JSON_PATH = path.join(IMAGES_DIR, 'images.json');

export const ensureImagesJsonExists = () => {
  if (!fs.existsSync(IMAGES_JSON_PATH)) {
    fs.writeFileSync(IMAGES_JSON_PATH, JSON.stringify({}), 'utf-8');
  }
};

export const fetchCommunityImageData = () => {
  const files = fs.readdirSync(IMAGES_DIR).filter(file =>
    ['.jpg', '.jpeg', '.png', '.webp'].some(ext => file.toLowerCase().endsWith(ext))
  );

  let alts: Record<string, string> = {};
  if (fs.existsSync(IMAGES_JSON_PATH)) {
    try {
      alts = JSON.parse(fs.readFileSync(IMAGES_JSON_PATH, 'utf-8'));
    } catch {
      alts = {};
    }
  }

  return files.map(file => {
    const uuid = file.split('.')[0];
    return {
      filename: file,
      url: `${FULL_BASE_URL}/uploads/community/images/${file}`,
      alt: alts[uuid] || ''
    };
  });
};

export const saveCommunityMediaFile = (file: Express.Multer.File, alt = '') => {
  ensureImagesJsonExists();
  const uuid = path.parse(file.filename).name;
  const data = JSON.parse(fs.readFileSync(IMAGES_JSON_PATH, 'utf-8'));

  data[uuid] = alt || ''; // store alt or empty
  fs.writeFileSync(IMAGES_JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');

  return `/uploads/community/images/${file.filename}`;
};

// Delete file by UUID
export const deleteCommunityImageByUUID = (uuid: string) => {
  const files = fs.readdirSync(IMAGES_DIR);
  const match = files.find(f => f.startsWith(uuid));

  if (!match) {
    throw new Error('File not found');
  }

  const filePath = path.join(IMAGES_DIR, match);
  fs.unlinkSync(filePath);
  return match;
};

// Remove UUID from images.json
export const removeAltFromImagesJson = (uuid: string) => {
  if (!fs.existsSync(IMAGES_JSON_PATH)) return;

  const raw = fs.readFileSync(IMAGES_JSON_PATH, 'utf-8');
  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    data = {};
  }

  if (data[uuid]) {
    delete data[uuid];
    fs.writeFileSync(IMAGES_JSON_PATH, JSON.stringify(data, null, 2));
  }
};
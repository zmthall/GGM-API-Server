// /services/mediaShown.services.ts
import fs from 'fs';
import path from 'path';
import { FULL_BASE_URL } from '../config/url';

const SHOWN_DIR = path.resolve(__dirname, '../uploads/community/shown');
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Make sure directory exists
export const ensureShownDir = () => {
  if (!fs.existsSync(SHOWN_DIR)) {
    fs.mkdirSync(SHOWN_DIR, { recursive: true });
  }
};

// GET - map of 1–8 to filename or null
export const getSlotMap = () => {
  ensureShownDir();

  const files = fs.readdirSync(SHOWN_DIR);
  const slotMap = [];

  for (let i = 0; i <= 7; i++) {
    const file = files.find(f => f.startsWith(`${i}.`) && ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()));
    const altPath = path.join(SHOWN_DIR, `${i}.json`);

    let alt = null;
    if (fs.existsSync(altPath)) {
      try {
        const altData = JSON.parse(fs.readFileSync(altPath, 'utf-8'));
        alt = altData.alt || null;
      } catch (err) {
        console.error((err as Error).message)
        alt = null;
      }
    }

    slotMap[i] = file
      ? {
          id: file,
          src: `${FULL_BASE_URL}/uploads/community/shown/${file}`,
          alt
        }
      : null;
  }

  return slotMap;
};

// PUT - Update image at specific slot
export const replaceShownImageAtSlot = (slot: number | string, file: Express.Multer.File, alt = null) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    fs.unlinkSync(file.path); // cleanup temp file
    throw new Error('Invalid file type');
  }

  ensureShownDir();

  // Remove any existing image at this slot
  const existing = fs.readdirSync(SHOWN_DIR).find(f => f.startsWith(`${slot}.`));
  if (existing) {
    fs.unlinkSync(path.join(SHOWN_DIR, existing));
  }

  // Remove any existing alt metadata
  const altPath = path.join(SHOWN_DIR, `${slot}.json`);
  if (fs.existsSync(altPath)) {
    fs.unlinkSync(altPath);
  }

  const finalName = `${slot}${ext}`;
  const destPath = path.join(SHOWN_DIR, finalName);
  fs.renameSync(file.path, destPath);

  // Optionally save alt text
  if (alt && typeof alt === 'string') {
    fs.writeFileSync(altPath, JSON.stringify({ alt }));
  }

  return finalName;
};

// DELETE - Media image at specific slot number
export const deleteShownImage = (slot: number | string) => {
  ensureShownDir();

  const files = fs.readdirSync(SHOWN_DIR);
  const imageFile = files.find(f => f.startsWith(`${slot}.`) && ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()));
  const altFile = `${slot}.json`;

  if (!imageFile && !fs.existsSync(path.join(SHOWN_DIR, altFile))) {
    throw new Error(`No image or alt text found at slot ${slot}`);
  }

  if (imageFile) {
    fs.unlinkSync(path.join(SHOWN_DIR, imageFile));
  }

  if (fs.existsSync(path.join(SHOWN_DIR, altFile))) {
    fs.unlinkSync(path.join(SHOWN_DIR, altFile));
  }

  return { deleted: imageFile || null, altDeleted: fs.existsSync(altFile) };
};

export const deleteAllShownImages = () => {
  ensureShownDir();

  const files = fs.readdirSync(SHOWN_DIR);

  for (const file of files) {
    const fullPath = path.join(SHOWN_DIR, file);

    // Only delete allowed image extensions or .json files
    if (
      ALLOWED_EXTENSIONS.includes(path.extname(file).toLowerCase()) ||
      file.endsWith('.json')
    ) {
      fs.unlinkSync(fullPath);
    }
  }

  return true;
};
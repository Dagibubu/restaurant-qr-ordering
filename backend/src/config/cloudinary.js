import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

// Local fallback: keep uploads on disk and serve them from /uploads
export const UPLOAD_DIR = path.resolve(__dirname, '../../data/uploads');

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp'];

let storage;
if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'restaurant/menu',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
    },
  });
} else {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  });
}

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only JPG, PNG or WEBP images are allowed'));
  },
});

import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload, useCloudinary } from '../config/cloudinary.js';

const router = express.Router();

router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const url = useCloudinary
    ? req.file.path
    : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  res.json({ url, publicId: req.file.filename });
});

// Multer / Cloudinary errors (too big, wrong type, bad credentials…) → readable JSON
router.use((err, _req, res, _next) => {
  const message =
    err.code === 'LIMIT_FILE_SIZE' ? 'Image is larger than 5MB' : err.message || 'Upload failed';
  res.status(400).json({ message });
});

export default router;

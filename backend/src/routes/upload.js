import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.post(
  '/',
  protect,
  adminOnly,
  upload.single('image'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({
      url: req.file.path,
      publicId: req.file.filename,
    });
  }
);

export default router;
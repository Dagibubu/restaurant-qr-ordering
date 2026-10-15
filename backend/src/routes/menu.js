import express from 'express';
import { Category, MenuItem } from '../models/index.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

/* Categories */
router.get('/categories', async (_, res) => {
  const cats = await Category.findAll({ order: [['order', 'ASC']] });
  res.json(cats);
});

router.post('/categories', protect, adminOnly, async (req, res) => {
  const cat = await Category.create(req.body);
  res.json(cat);
});

router.delete('/categories/:id', protect, adminOnly, async (req, res) => {
  await Category.destroy({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* Menu Items */
router.get('/items', async (_, res) => {
  const items = await MenuItem.findAll({
    include: [{ model: Category, as: 'category' }],
  });
  res.json(items);
});

router.post('/items', protect, adminOnly, async (req, res) => {
  const item = await MenuItem.create(req.body);
  res.json(item);
});

router.put('/items/:id', protect, adminOnly, async (req, res) => {
  const item = await MenuItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  await item.update(req.body);
  res.json(item);
});

router.delete('/items/:id', protect, adminOnly, async (req, res) => {
  await MenuItem.destroy({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
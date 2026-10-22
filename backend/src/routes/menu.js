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
  const { name, nameAm, parentId } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });

  if (parentId) {
    const parent = await Category.findByPk(parentId);
    if (!parent) return res.status(400).json({ message: 'Parent category not found' });
    if (parent.parentId)
      return res.status(400).json({ message: 'Sub-categories cannot have their own sub-categories' });
  }

  const cat = await Category.create({
    name: name.trim(),
    nameAm: nameAm?.trim() || null,
    parentId: parentId || null,
    order: await Category.count({ where: { parentId: parentId || null } }),
  });
  res.json(cat);
});

router.delete('/categories/:id', protect, adminOnly, async (req, res) => {
  const cat = await Category.findByPk(req.params.id);
  if (!cat) return res.json({ ok: true });

  if (cat.parentId) {
    // Sub-category: keep its dishes by moving them up to the parent
    await MenuItem.update(
      { categoryId: cat.parentId },
      { where: { categoryId: cat.id } }
    );
  } else {
    // Main category: its sub-categories go with it (dishes are orphaned)
    const subIds = (await Category.findAll({ where: { parentId: cat.id } })).map((c) => c.id);
    await MenuItem.update(
      { categoryId: null },
      { where: { categoryId: [cat.id, ...subIds] } }
    );
    await Category.destroy({ where: { parentId: cat.id } });
  }
  await MenuItem.update({ categoryId: null }, { where: { categoryId: cat.id } });
  await cat.destroy();
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
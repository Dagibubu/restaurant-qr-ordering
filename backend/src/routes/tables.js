import express from 'express';
import QRCode from 'qrcode';
import Table from '../models/Table.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (_, res) => {
  res.json(await Table.findAll({ order: [['number', 'ASC']] }));
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { number } = req.body;
    const table = await Table.create({ number });
    const url = `${process.env.CLIENT_URL}/order/${table.id}`;
    table.qrCode = await QRCode.toDataURL(url);
    await table.save();
    res.json(table);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  await Table.destroy({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
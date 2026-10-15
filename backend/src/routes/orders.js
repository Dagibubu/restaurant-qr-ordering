import express from 'express';
import { Order, Table } from '../models/index.js';
import { protect } from '../middleware/auth.js';
import { getIO } from '../sockets/index.js';

const router = express.Router();

// Create order (public)
router.post('/', async (req, res) => {
  try {
    const { tableId, items, note } = req.body;
    const table = await Table.findByPk(tableId);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const order = await Order.create({
      tableId: table.id,
      items,
      total,
      note,
    });

    const populated = await Order.findByPk(order.id, {
      include: [{ model: Table, as: 'table' }],
    });

    getIO().emit('order:new', populated);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer polls status
router.get('/:id', async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [{ model: Table, as: 'table' }],
  });
  if (!order) return res.status(404).json({ message: 'Not found' });
  res.json(order);
});

// Staff: list orders
router.get('/', protect, async (req, res) => {
  const { status } = req.query;
  let where = {};
  if (status) {
    const { Op } = await import('sequelize');
    where = { status: { [Op.in]: status.split(',') } };
  }
  const orders = await Order.findAll({
    where,
    include: [{ model: Table, as: 'table' }],
    order: [['createdAt', 'DESC']],
  });
  res.json(orders);
});

// Update status
router.patch('/:id/status', protect, async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  await order.update({ status: req.body.status });

  const populated = await Order.findByPk(order.id, {
    include: [{ model: Table, as: 'table' }],
  });
  getIO().emit('order:update', populated);
  res.json(populated);
});

export default router;
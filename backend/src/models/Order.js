import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tableId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'tables', key: 'id' },
  },
  items: {
    // Array of { menuItemId, name, price, quantity }
    type: DataTypes.JSON,
    allowNull: false,
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'preparing',
      'ready',
      'served',
      'completed',
      'cancelled'
    ),
    defaultValue: 'pending',
  },
  note: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'orders',
  timestamps: true,
});

export default Order;
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Table = sequelize.define('Table', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  qrCode: {
    type: DataTypes.TEXT, // base64 image — can be large
  },
}, {
  tableName: 'tables',
  timestamps: true,
});

export default Table;
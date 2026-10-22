import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nameAm: {
    type: DataTypes.STRING,
  },
  // null = main category; otherwise the id of the parent main category
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'categories',
  timestamps: true,
});

export default Category;
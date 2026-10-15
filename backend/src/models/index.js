import Category from './Category.js';
import MenuItem from './MenuItem.js';
import Table from './Table.js';
import Order from './Order.js';
import User from './User.js';

// Category 1—N MenuItem
Category.hasMany(MenuItem, { foreignKey: 'categoryId', as: 'items' });
MenuItem.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Table 1—N Order
Table.hasMany(Order, { foreignKey: 'tableId', as: 'orders' });
Order.belongsTo(Table, { foreignKey: 'tableId', as: 'table' });

export { Category, MenuItem, Table, Order, User };
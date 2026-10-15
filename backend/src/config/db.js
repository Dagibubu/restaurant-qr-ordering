import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storagePath = process.env.DB_STORAGE
  ? path.resolve(process.cwd(), process.env.DB_STORAGE)
  : path.resolve(__dirname, '../../data/restaurant.sqlite');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false,
  define: {
    // Use snake_case in DB (cleaner for SQL)
    underscored: false,
    freezeTableName: true,
  },
  // Required for SQLite + foreign keys
  dialectOptions: {
    // Ensures foreign key constraints are checked
    foreignKeys: true,
  },
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();

    // Disable FK checks during sync (SQLite requirement)
    await sequelize.query('PRAGMA foreign_keys = OFF;');

    // Sync — first try alter, fall back to plain sync
    try {
      await sequelize.sync({ alter: true });
    } catch (err) {
      console.warn('⚠️  alter sync failed, using plain sync:', err.message);
      await sequelize.sync();
    }

    // Re-enable FK checks
    await sequelize.query('PRAGMA foreign_keys = ON;');

    console.log('✅ SQLite connected & synced');
  } catch (err) {
    console.error('❌ DB error:', err);
    process.exit(1);
  }
};
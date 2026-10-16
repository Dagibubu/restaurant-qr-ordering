import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const define = {
  underscored: false,
  freezeTableName: true,
};

// Production: Postgres via DATABASE_URL. Local dev: SQLite file.
export const isPostgres = Boolean(process.env.DATABASE_URL);

const storagePath = process.env.DB_STORAGE
  ? path.resolve(process.cwd(), process.env.DB_STORAGE)
  : path.resolve(__dirname, '../../data/restaurant.sqlite');

export const sequelize = isPostgres
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      define,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: storagePath,
      logging: false,
      define,
      dialectOptions: { foreignKeys: true },
    });

export const connectDB = async () => {
  try {
    await sequelize.authenticate();

    // SQLite needs FK checks off during sync
    if (!isPostgres) await sequelize.query('PRAGMA foreign_keys = OFF;');

    try {
      await sequelize.sync({ alter: true });
    } catch (err) {
      console.warn('⚠️  alter sync failed, using plain sync:', err.message);
      await sequelize.sync();
    }

    if (!isPostgres) await sequelize.query('PRAGMA foreign_keys = ON;');

    console.log(`✅ ${isPostgres ? 'Postgres' : 'SQLite'} connected & synced`);
  } catch (err) {
    console.error('❌ DB error:', err);
    process.exit(1);
  }
};

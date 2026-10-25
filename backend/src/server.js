import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { initSockets } from './sockets/index.js';
import { seedIfEmpty } from './seed.js';
import './models/index.js'; // ← registers associations

import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import tableRoutes from './routes/tables.js';
import orderRoutes from './routes/orders.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes from './routes/upload.js';
import adminAnalyticsRoutes from './routes/adminAnalytics.js';
import { UPLOAD_DIR, useCloudinary } from './config/cloudinary.js';

const app = express();
app.set('trust proxy', 1); // correct https URLs behind Render's proxy
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '5mb' }));

if (!useCloudinary) {
  console.log('📁 Cloudinary not configured — saving uploads to', UPLOAD_DIR);
  app.use('/uploads', express.static(UPLOAD_DIR));
}

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/ai-analytics', adminAnalyticsRoutes);

app.get('/', (_, res) => res.json({ ok: true }));

const server = http.createServer(app);
initSockets(server);

connectDB().then(async () => {
  await seedIfEmpty();
  server.listen(process.env.PORT, () =>
    console.log(`🚀 Server on :${process.env.PORT}`)
  );
});
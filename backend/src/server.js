import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { initSockets } from './sockets/index.js';
import './models/index.js'; // ← registers associations

import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import tableRoutes from './routes/tables.js';
import orderRoutes from './routes/orders.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes from './routes/upload.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (_, res) => res.json({ ok: true }));

const server = http.createServer(app);
initSockets(server);

connectDB().then(() => {
  server.listen(process.env.PORT, () =>
    console.log(`🚀 Server on :${process.env.PORT}`)
  );
});
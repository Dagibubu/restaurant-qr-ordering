import { Server } from 'socket.io';

let io;
export const initSockets = (server) => {
  io = new Server(server, { cors: { origin: process.env.CLIENT_URL } });
  io.on('connection', (socket) => {
    console.log('🔌 socket:', socket.id);
  });
  return io;
};
export const getIO = () => io;
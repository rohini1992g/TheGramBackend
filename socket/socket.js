import express from "express";
import { Server } from "socket.io";
import http from "http";
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    method: ["GET", "POST"],
  },
});

const userSocketMap = {}; //store userid =>socketid
export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`connected userId${userId} : SocketId${socket.id}`);
  }
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (userId) {
      console.log(`disconnected userId${userId} : SocketId${socket.id}`);

      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});
export { app, server, io };

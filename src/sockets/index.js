import { Server } from "socket.io";
import { setupAiNamespace } from "./namespaces/aiNamespace.js";

let ioInstance;

const socketConnection = (server) => {
  const socketconfig = {
    cors: {
      origin: process.env.ALLOWED_ORIGINS || "*",
      methods: ["GET", "POST"]
    }
  };
  ioInstance = new Server(server, socketconfig);

  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) return next();
    return next(new Error("Authentication error"));
  });

  setupAiNamespace(ioInstance);

  console.log("[Socket.IO] Server initialized");
  
  // return so that servers can access ioInstance for emitting outside of connection context
  return ioInstance; 
};

export default socketConnection;
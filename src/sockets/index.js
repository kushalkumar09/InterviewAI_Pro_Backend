import { Server } from "socket.io";
import { setupAiAssistantNamespace } from "./namespaces/aiNamespace.js";

let ioInstance;

const socketConnection = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS || "*",
      methods: ["GET", "POST"]
    }
  });

  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) return next();
    return next(new Error("Authentication error"));
  });

  setupAiAssistantNamespace(ioInstance);

  console.log("--- SocketManager: Namespaces Initialized ---");
  
  return ioInstance; // <--- CRITICAL: Return this so server.js can close it
};

export default socketConnection;
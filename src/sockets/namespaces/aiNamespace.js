import { aiHandler } from "../handlers/ai.handler.js";

export const setupAiNamespace = (io) => {
  // Create AI namespace
  // Local testing: http://localhost:5000/ai-realtime
  // Production: https://yourdomain.com/ai-realtime
  const aiNamespace = io.of("/ai-realtime");

  aiNamespace.on("connection", (socket) => {
    console.log(`[AI-NSP] Connection established : ${socket.id}`);
    // Handler for AI interactions
    aiHandler(socket);
  });

};
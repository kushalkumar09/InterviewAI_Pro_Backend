import geminiService from "../../services/aiService.js";

// Handler for AI interactions
// Events:
// - ai:initialize -> starts Gemini session
// - ai:input -> sends user input to Gemini
// - ai:stop -> terminates Gemini session
// - disconnect -> also terminates session and cleans up

export const aiHandler = (socket) => {
  console.log(`[AI-Handler] Socket connected: ${socket.id}`);

  socket.on("ai:initialize", () => {
    
    console.log(`[AI-Handler] Initialize session for: ${socket.id}`);
    geminiService.initializeSession(socket);
    socket.emit("ai:initialized", { status: "ok", message: "AI Session initialized" });
  });

  socket.on("ai:input", (payload) => {
    console.log(`[AI-Handler] Message received from ${socket.id}: `, payload);
    geminiService.sendToGemini(socket.id, payload); 
    socket.emit("UserInput-received", { status: "ok" , message: "UserInput received by server"});
  });

  socket.on("ai:stop", () => {
    geminiService.terminateSession(socket.id);
    socket.emit("ai:stopped", { status: "ok", message: "AI session stopped" });
  });

  socket.on("disconnect", (reason) => {
    console.log(`[AI-Handler] Disconnected: ${socket.id} Reason: ${reason}`);
    geminiService.terminateSession(socket.id);
  });
};
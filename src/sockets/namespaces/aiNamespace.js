import geminiService from '../../services/aiService.js';

const setupAiNamespace = (io) => {
  const nsp = io.of("/ai-assistant");

  nsp.on("connection", (socket) => {
    console.log(`[AI-NSP] User connected: ${socket.id}`);
    let aiSession = null;

    socket.on("ai:initialize", async () => {
      try {
        aiSession = await geminiService.createLiveSession(
          (data) => socket.emit("ai:output", data),
          (err) => socket.emit("ai:error", err)
        );
        console.log(`[AI-NSP] Gemini Session Active for ${socket.id}`);
      } catch (err) {
        socket.emit("ai:error", { message: "Failed to initialize AI" });
      }
    });

    // Forwarding user audio/text to Gemini
    socket.on("ai:input", (payload) => {
      if (aiSession) aiSession.send(payload);
    });

    // Clean up Gemini session when user disconnects
    socket.on("disconnect", () => {
      if (aiSession) {
        aiSession.stop();
        console.log(`[AI-NSP] Session closed for ${socket.id}`);
      }
    });
  });
};

export const setupAiAssistantNamespace = setupAiNamespace;

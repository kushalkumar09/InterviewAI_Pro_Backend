import { GoogleGenerativeAI } from "@google/generative-ai";

// This service manages Gemini sessions for each connected client.
// It maintains a mapping of socket IDs to Gemini sessions, allowing for real-time communication and proper cleanup on disconnect.
// Events:
// - ai:initialize -> starts Gemini session
// - ai:input -> sends user input to Gemini
// - ai:stop -> terminates Gemini session
// - disconnect -> also terminates session and cleans up


class GeminiService {
  constructor() {
    // The new SDK uses an object for config
    this.client = new GoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    this.activeSessions = new Map();
    this.reconnectAttempts = new Map();
    this.MAX_RETRIES = 3;
  }

  async initializeSession(socket, isReconnect = false) {
    const socketId = socket.id;

    try {
      if (!isReconnect) {
        this.reconnectAttempts.set(socketId, 0);
        await this.terminateSession(socketId);
      }

      console.log(`[GeminiService] ${isReconnect ? 'Recovering' : 'Opening'} session for: ${socketId}`);

      // The Multimodal Live API is accessed via this.client.live.connect
      const session = await this.client.live.connect({
        model: "gemini-2.0-flash-exp",
        config: { 
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });

      this.activeSessions.set(socketId, session);

      // --- EVENT RELAY ---
      session.on("message", (message) => {
        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData) socket.emit("ai:audio-chunk", audioData);

        const textData = message.serverContent?.modelTurn?.parts?.[0]?.text;
        if (textData) socket.emit("ai:text-chunk", textData);

        if (message.serverContent?.turnComplete) {
          socket.emit("ai:turn-complete");
        }
      });

      // --- WATCHDOG ---
      session.on("close", async () => {
        console.warn(`[GeminiService] AI connection closed for: ${socketId}`);
        if (socket.connected) {
          this.handleRecovery(socket);
        } else {
          this.activeSessions.delete(socketId);
        }
      });

      session.on("error", (err) => {
        console.error(`[GeminiService] Gemini Error [${socketId}]:`, err);
        socket.emit("ai:error", { message: "AI stream error" });
      });

      socket.emit(isReconnect ? "ai:recovered" : "ai:ready");

    } catch (error) {
      console.error(`[GeminiService] Connection Failed [${socketId}]:`, error);
      socket.emit("ai:error", { message: "Failed to connect to AI Service" });
    }
  }

  async handleRecovery(socket) {
    const socketId = socket.id;
    const currentRetries = this.reconnectAttempts.get(socketId) || 0;

    if (currentRetries < this.MAX_RETRIES) {
      this.reconnectAttempts.set(socketId, currentRetries + 1);
      setTimeout(() => this.initializeSession(socket, true), 1500);
    } else {
      socket.emit("ai:error", { message: "AI connection lost after retries." });
      this.activeSessions.delete(socketId);
    }
  }

  sendToGemini(socketId, payload) {
    const session = this.activeSessions.get(socketId);
    if (session) {
      // payload should be { turns: ["your text"] } or { realTimeInput: ... }
      session.send(payload); 
    }
  }

  async terminateSession(socketId) {
    const session = this.activeSessions.get(socketId);
    if (session) {
      try {
        await session.close();
      } catch (err) {
        console.error(`[GeminiService] Error closing session:`, err);
      } finally {
        this.activeSessions.delete(socketId);
        this.reconnectAttempts.delete(socketId);
      }
    }
  }
}

const geminiService = new GeminiService();
export default geminiService;
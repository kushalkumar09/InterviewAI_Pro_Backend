import { GoogleGenerativeAI as GoogleGenAI } from "@google/generative-ai";

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
  }

  async createLiveSession(onData, onError) {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      // Connecting to the Multimodal Live API
      const session = await model.live.connect({
        config: { responseModalities: ["AUDIO"] }
      });

      session.on("message", (msg) => onData(msg));
      session.on("error", (err) => onError(err));

      return {
        send: (payload) => session.sendClientContent(payload),
        stop: () => session.close()
      };
    } catch (error) {
      console.error("[GeminiService] Connection Failed:", error);
      throw error;
    }
  }
}

const geminiService = new GeminiService();
export default geminiService;
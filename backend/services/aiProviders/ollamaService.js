const axios = require("axios");

class OllamaService {
  constructor() {
    this.apiUrl = process.env.OLLAMA_API_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama2";
  }

  async generateResponse(prompt, conversationHistory = []) {
    try {
      // Format messages for Ollama
      const messages = [
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: prompt,
        },
      ];

      const response = await axios.post(`${this.apiUrl}/api/chat`, {
        model: this.model,
        messages: messages,
        stream: false,
      });

      return response.data.message;
    } catch (error) {
      console.error("Ollama API error:", error.message);
      throw new Error("Failed to generate AI response");
    }
  }
  async listModels() {
    try {
      return this.getProviderInfo().supportedModels;
    } catch (error) {
      console.error("Error listing Ollama models:", error.message);
      throw new Error("Failed to list models");
    }
  }

  async checkAvailability() {
    try {
      const response = await axios.get(`${this.apiUrl}/api/tags`);
      const models = response.data.models || [];
      const isAvailable = models.some((m) => m.name.includes(this.model));
      return { available: isAvailable, models: models.map((m) => m.name) };
    } catch (error) {
      console.error("Ollama connection error:", error.message);
      return { available: false, models: [] };
    }
  }
  getProviderInfo() {
    return {
      name: "ollama",
      model: this.model,
      supportsStreaming: false,
      supportedModels: [
        {
          id: "llama2",
          name: "Llama 2",
          contextWindow: 4096,
          description: "Llama 2 (local, via Ollama)",
        },
        {
          id: "llama3",
          name: "Llama 3",
          contextWindow: 8192,
          description: "Llama 3 (local, via Ollama)",
        },
      ],
    };
  }
}

module.exports = new OllamaService();

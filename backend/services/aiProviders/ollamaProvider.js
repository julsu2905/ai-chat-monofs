const BaseAIProvider = require("./baseProvider");
const { Ollama } = require("ollama");

class OllamaProvider extends BaseAIProvider {
  constructor(config = {}) {
    super(config);
    // To use Ollama Cloud, set OLLAMA_API_URL to https://cloud.ollama.com/v1 and OLLAMA_API_KEY
    // To use local Ollama, set OLLAMA_API_URL to your local endpoint and OLLAMA_AUTH_TOKEN if needed
    this.client = new Ollama({
      host: process.env.OLLAMA_API_URL || "http://localhost:11434",
      headers: { Authorization: "Bearer " + process.env.OLLAMA_API_KEY },
    });
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
      console.log(
        "🚀 ~ OllamaProvider ~ generateResponse ~ messages:",
        messages,
      );
      const response = await this.client.chat({
        model: this.model,
        messages: messages,
        stream: false,
      });

      return response.message;
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
      const response = await this.client.list();

      const models = response.models || [];
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
      supportsStreaming: true,
      supportedModels: [
        {
          id: "qwen3.5",
          name: "Qwen 3.5",
          contextWindow: 4096,
          description: "Qwen 3.5 (local, via Ollama)",
        },
        {
          id: "ministral-3:8b",
          name: "Ministral 3",
          contextWindow: 8192,
          description: "Ministral 3 (local, via Ollama)",
        },
      ],
    };
  }
}
module.exports = OllamaProvider;

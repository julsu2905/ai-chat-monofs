const BaseAIProvider = require("./baseProvider");
const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiProvider extends BaseAIProvider {
  constructor(config = {}) {
    super(config);
    this.model = config.model || process.env.GEMINI_MODEL || "gemini-1.5-pro";
    // Gemini SDK automatically reads GOOGLE_API_KEY from environment
    this.client = new GoogleGenerativeAI();
  }

  async generateResponse(prompt, conversationHistory = [], options = {}) {
    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
      });

      // Format conversation history for Gemini
      const history = conversationHistory.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      // Create chat session with history
      const chat = model.startChat({
        history: history,
        generationConfig: {
          temperature: options.temperature || 0.7,
          topK: options.topK || 40,
          topP: options.topP || 0.95,
          maxOutputTokens: options.maxTokens || 2048,
        },
        safetySettings: options.safetySettings || [],
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;

      return {
        content: response.text(),
        finishReason: response.candidates[0]?.finishReason,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
          totalTokens: response.usageMetadata?.totalTokenCount,
        },
      };
    } catch (error) {
      console.error("Gemini API error:", error.message);
      throw new Error(
        `Gemini API error: ${error.message || "Failed to generate response"}`,
      );
    }
  }

  async listModels() {
    try {
      // Gemini API doesn't have a list models endpoint yet
      // Return predefined list
      return this.getProviderInfo().supportedModels;
    } catch (error) {
      console.error("Error listing Gemini models:", error.message);
      throw new Error("Failed to list models");
    }
  }

  async checkAvailability() {
    try {
      // Try a simple generation to verify API key
      const model = this.client.getGenerativeModel({ model: this.model });
      await model.generateContent("Test");
      return {
        available: true,
        provider: "Gemini",
        model: this.model,
      };
    } catch (error) {
      return {
        available: false,
        provider: "Gemini",
        error: error.message,
      };
    }
  }

  getProviderInfo() {
    return {
      name: "Gemini",
      model: this.model,
      supportedModels: [
        {
          id: "gemini-2.0-flash-exp",
          name: "Gemini 2.0 Flash (Experimental)",
          contextWindow: 1048576,
          description: "Next generation multimodal with thinking mode",
        },
        {
          id: "gemini-1.5-pro",
          name: "Gemini 1.5 Pro",
          contextWindow: 2097152,
          description: "Most capable Gemini model with huge context",
        },
        {
          id: "gemini-1.5-flash",
          name: "Gemini 1.5 Flash",
          contextWindow: 1048576,
          description: "Fast and efficient for everyday tasks",
        },
        {
          id: "gemini-1.5-flash-8b",
          name: "Gemini 1.5 Flash-8B",
          contextWindow: 1048576,
          description: "Smallest model, great for simple tasks",
        },
        {
          id: "gemini-pro",
          name: "Gemini Pro",
          contextWindow: 32768,
          description: "Previous generation model",
        },
      ],
    };
  }
}

module.exports = GeminiProvider;

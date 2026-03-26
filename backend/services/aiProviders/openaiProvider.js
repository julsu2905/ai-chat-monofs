const BaseAIProvider = require("./baseProvider");
const OpenAI = require("openai");

class OpenAIProvider extends BaseAIProvider {
  constructor(config = {}) {
    super(config);
    this.model = config.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
    this.client = new OpenAI();
  }

  async generateResponse(prompt, conversationHistory = [], options = {}) {
    try {
      // Format messages for OpenAI
      const messages = [
        {
          role: "system",
          content:
            options.systemPrompt ||
            "You are a helpful AI assistant. Provide clear, accurate, and thoughtful responses.",
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: prompt,
        },
      ];

      const requestParams = {
        model: this.model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
      };

      const completion =
        await this.client.chat.completions.create(requestParams);

      const response = completion.choices[0];

      return {
        content: response.message.content,
        usage: completion.usage,
        finishReason: response.finish_reason,
      };
    } catch (error) {
      console.error("OpenAI API error:", error.message);
      if (error.response) {
        console.error("Response data:", error.response.data);
      }
      throw new Error(
        `OpenAI API error: ${error.message || "Failed to generate response"}`,
      );
    }
  }

  async listModels() {
    try {
      const models = await this.client.models.list();
      const chatModels = models.data
        .filter((model) => model.id.includes("gpt"))
        .map((model) => ({
          id: model.id,
          name: model.id,
          created: model.created,
          ownedBy: model.owned_by,
        }));

      return chatModels;
    } catch (error) {
      console.error("Error listing OpenAI models:", error.message);
      throw new Error("Failed to list models");
    }
  }

  async checkAvailability() {
    try {
      // Try to list models to verify API key
      await this.client.models.list();
      return {
        available: true,
        provider: "OpenAI",
        model: this.model,
      };
    } catch (error) {
      return {
        available: false,
        provider: "OpenAI",
        error: error.message,
      };
    }
  }

  getProviderInfo() {
    return {
      name: "OpenAI",
      model: this.model,
      supportedModels: [
        {
          id: "gpt-4o",
          name: "GPT-4 Omni",
          contextWindow: 128000,
          description: "Most capable multimodal model",
        },
        {
          id: "gpt-4o-mini",
          name: "GPT-4 Omni Mini",
          contextWindow: 128000,
          description: "Fast and cost-effective",
        },
        {
          id: "gpt-4-turbo",
          name: "GPT-4 Turbo",
          contextWindow: 128000,
          description: "Enhanced GPT-4 with vision",
        },
        {
          id: "gpt-4",
          name: "GPT-4",
          contextWindow: 8192,
          description: "Most capable GPT-4 model",
        },
        {
          id: "gpt-3.5-turbo",
          name: "GPT-3.5 Turbo",
          contextWindow: 16385,
          description: "Fast and affordable",
        },
      ],
    };
  }
}

module.exports = OpenAIProvider;

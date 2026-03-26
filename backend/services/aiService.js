const OpenAIProvider = require("./aiProviders/openaiProvider");
const GeminiProvider = require("./aiProviders/geminiProvider");
const OllamaProvider = require("./aiProviders/ollamaProvider");

class AIService {
  constructor() {
    this.providers = new Map();
    this.currentProvider = null;
    this.initializeProviders();
  }

  async initializeProviders() {
    console.log("\n=== Initializing AI Providers ===");
    console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
    console.log("GOOGLE_API_KEY exists:", !!process.env.GOOGLE_API_KEY);
    console.log("OLLAMA_API_URL exists:", !!process.env.OLLAMA_API_URL);

    // Initialize Ollama if OLLAMA_API_URL or local server is available
    const ollamaUrl = process.env.OLLAMA_API_URL || "http://localhost:11434";
    if (ollamaUrl) {
      // Try to check Ollama availability synchronously (best effort)
      const ollama = new OllamaProvider();
      await ollama
        .checkAvailability()
        .then((result) => {
          if (result.available) {
            this.providers.set("ollama", ollama);
            console.log("✓ Ollama provider initialized");
          } else {
            console.log("⚠ Ollama provider not available at", ollamaUrl);
          }
        })
        .catch((err) => {
          console.log("⚠ Ollama provider check failed:", err.message);
        });
    } else {
      console.log("⚠ Ollama provider skipped (no OLLAMA_API_URL)");
    }

    // Initialize OpenAI if API key is provided
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAIProvider({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        });
        this.providers.set("openai", openai);
        console.log("✓ OpenAI provider initialized");
      } catch (error) {
        console.error("✗ Failed to initialize OpenAI provider:", error.message);
      }
    } else {
      console.log("⚠ OpenAI provider skipped (no API key)");
    }

    // Initialize Gemini if API key is provided
    if (process.env.GOOGLE_API_KEY) {
      try {
        const gemini = new GeminiProvider({
          model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
        });
        this.providers.set("gemini", gemini);
        console.log("✓ Gemini provider initialized");
      } catch (error) {
        console.error("✗ Failed to initialize Gemini provider:", error.message);
      }
    } else {
      console.log("⚠ Gemini provider skipped (no API key)");
    }

    // Check if any providers were initialized
    if (this.providers.size === 0) {
      console.error("\n❌ ERROR: No AI providers available!");
      console.error("Please set at least one API key in your .env file:");
      console.error("  - OPENAI_API_KEY for OpenAI");
      console.error("  - GOOGLE_API_KEY for Gemini\n");
      return;
    }

    // Set default provider from env or first available
    const defaultProvider = process.env.AI_PROVIDER?.toLowerCase();

    // Try to set the configured provider, or fall back to first available
    if (defaultProvider && this.providers.has(defaultProvider)) {
      this.setProvider(defaultProvider);
      console.log(`✓ Default provider set to: ${defaultProvider}`);
    } else {
      const firstProvider = Array.from(this.providers.keys())[0];
      this.setProvider(firstProvider);
      console.log(`✓ Default provider set to: ${firstProvider}`);
      if (defaultProvider) {
        console.log(
          `⚠ Configured provider "${defaultProvider}" not available, using "${firstProvider}"`,
        );
      }
    }
    console.log("=== Initialization Complete ===\n");
  }

  setProvider(providerName) {
    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      const available = Array.from(this.providers.keys()).join(", ");
      throw new Error(
        `Provider "${providerName}" not available. Available: ${available}`,
      );
    }
    this.currentProvider = provider;
    return provider;
  }

  getProvider(providerName = null) {
    if (providerName) {
      return this.providers.get(providerName.toLowerCase());
    }
    return this.currentProvider;
  }

  async generateResponse(prompt, conversationHistory = [], options = {}) {
    if (!this.currentProvider) {
      throw new Error(
        "No AI provider configured. Please set OPENAI_API_KEY or GOOGLE_API_KEY in your .env file.",
      );
    }

    return await this.currentProvider.generateResponse(
      prompt,
      conversationHistory,
      options,
    );
  }

  async listModels(providerName = null) {
    const provider = providerName
      ? this.getProvider(providerName)
      : this.currentProvider;
    if (!provider) {
      throw new Error("No provider specified");
    }
    return await provider.listModels();
  }

  async checkAvailability(providerName = null) {
    if (providerName) {
      const provider = this.getProvider(providerName);
      return provider
        ? await provider.checkAvailability()
        : { available: false };
    }

    // Check all providers
    const results = {};
    for (const [name, provider] of this.providers) {
      results[name] = await provider.checkAvailability();
    }
    return results;
  }

  getAllProviders() {
    const info = {};
    for (const [name, provider] of this.providers) {
      info[name] = provider.getProviderInfo();
    }
    return info;
  }
}

// Export singleton instance
module.exports = new AIService();

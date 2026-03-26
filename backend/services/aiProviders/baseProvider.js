/**
 * Base AI Provider Interface
 * All AI providers must implement these methods
 */
class BaseAIProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Generate a response from the AI model
   * @param {string} prompt - User prompt
   * @param {Array} conversationHistory - Previous messages
   * @param {Object} options - Additional options (temperature, max_tokens, tools, etc.)
   * @returns {Promise<{content: string, usage?: Object, toolCalls?: Array}>}
   */
  async generateResponse(prompt, conversationHistory = [], options = {}) {
    throw new Error("generateResponse must be implemented");
  }

  /**
   * List available models
   * @returns {Promise<Array<{id: string, name: string, context_window: number}>>}
   */
  async listModels() {
    throw new Error("listModels must be implemented");
  }

  /**
   * Check if the provider/model is available
   * @returns {Promise<{available: boolean, message?: string}>}
   */
  async checkAvailability() {
    throw new Error("checkAvailability must be implemented");
  }

  /**
   * Get provider information
   * @returns {Object} Provider metadata
   */
  getProviderInfo() {
    return {
      name: this.constructor.name,
      config: this.config,
    };
  }
}

module.exports = BaseAIProvider;

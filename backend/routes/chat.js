const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const aiService = require("../services/aiService");

// Get all chats for a session
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chat = await Chat.findOne({ sessionId });

    if (!chat) {
      return res.json({ sessionId, messages: [] });
    }

    res.json(chat);
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// Send a message and get AI response
router.post("/message", async (req, res) => {
  try {
    const { sessionId, message, provider, options = {} } = req.body;

    if (!sessionId || !message) {
      return res
        .status(400)
        .json({ error: "Session ID and message are required" });
    }

    // Switch provider if specified
    if (provider) {
      try {
        aiService.setProvider(provider);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }

    // Find or create chat session
    let chat = await Chat.findOne({ sessionId });
    if (!chat) {
      chat = new Chat({ sessionId, messages: [] });
    }

    // Add user message
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    // Get conversation history (last 10 messages for context)
    const recentMessages = chat.messages.slice(-10);

    // Generate AI response
    const aiResponse = await aiService.generateResponse(
      message,
      recentMessages,
      options,
    );

    const finalContent = aiResponse.content;

    // Add AI response
    const assistantMessage = {
      role: "assistant",
      content: finalContent,
      timestamp: new Date(),
      usage: aiResponse.usage,
    };
    chat.messages.push(userMessage);
    chat.messages.push(assistantMessage);

    // Save to database
    await chat.save();

    res.json({
      userMessage,
      assistantMessage,
      sessionId: chat.sessionId,
    });
  } catch (error) {
    console.error("Error processing message:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to process message" });
  }
});

// Get all sessions
router.get("/sessions", async (req, res) => {
  try {
    const sessions = await Chat.find(
      {},
      { sessionId: 1, createdAt: 1, updatedAt: 1 },
    ).sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Delete a session
router.delete("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    await Chat.deleteOne({ sessionId });
    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

// Check AI service status
router.get("/status", async (req, res) => {
  try {
    const status = await aiService.checkAvailability();
    const providers = aiService.getAllProviders();
    res.json({
      status,
      providers,
      currentProvider: aiService.currentProvider?.getProviderInfo(),
    });
  } catch (error) {
    console.error("Error checking status:", error);
    res.status(500).json({ available: false, error: error.message });
  }
});

// Get all available providers and their info
router.get("/providers", async (req, res) => {
  try {
    const providersObj = aiService.getAllProviders();
    // Convert object to array for frontend
    const providersArray = Object.entries(providersObj).map(([name, info]) => ({
      ...info,
      name,
    }));
    res.json(providersArray);
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({ error: error.message });
  }
});

// Set active provider
router.post("/provider", async (req, res) => {
  try {
    const { provider } = req.body;
    if (!provider) {
      return res.status(400).json({ error: "Provider name is required" });
    }
    aiService.setProvider(provider);
    res.json({
      success: true,
      provider: aiService.currentProvider.getProviderInfo(),
    });
  } catch (error) {
    console.error("Error setting provider:", error);
    res.status(400).json({ error: error.message });
  }
});

// List models for a provider
router.get("/models", async (req, res) => {
  try {
    const { provider } = req.query;
    const models = await aiService.listModels(provider);
    res.json(models);
  } catch (error) {
    console.error("Error listing models:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

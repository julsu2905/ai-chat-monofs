import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import dayjs from "dayjs";
import {
  Bot,
  Menu,
  MessageSquare,
  Plus,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./App.scss";
import DropdownModels from "./components/DropdownModels";
import useWindowSize from "./hooks/useWindowSize";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
}

interface SessionData {
  sessionId: string;
  updatedAt: string;
  createdAt: string;
}

interface ChatMessage {
  _id?: string;
  role: string;
  content: string;
  timestamp: string;
}

export interface Provider {
  name: string;
  model: string;
  supportsStreaming: boolean;
  supportedModels: Model[];
}
interface Model {
  id: string;
  name: string;
  contextWindow: number;
  description: string;
}

function App() {
  const { width } = useWindowSize();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("openai");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  };
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, streamingText]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const loadChatHistory = async () => {
    try {
      const response = await axios.get<SessionData[]>("/api/chat/sessions");
      setChats(
        response.data.map((session) => ({
          id: session.sessionId,
          title: `Chat at ${dayjs(session.updatedAt).format("HH:mm MMM D, YYYY")}`,
          lastMessage: "",
        })),
      );
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await axios.get<Provider[]>("/api/chat/providers");
      setAvailableProviders(response.data);

      // Get current provider from status
      const statusResponse = await axios.get("/api/chat/status");
      if (statusResponse.data.currentProvider) {
        setSelectedProvider(statusResponse.data.currentProvider.name);
        setSelectedModel(statusResponse.data.currentProvider.model);
      } else if (response.data.length > 0) {
        // Fallback: set to first provider and its default model
        setSelectedProvider(response.data[0].name);
        setSelectedModel(response.data[0].model);
      }
    } catch (error) {
      console.error("Error loading providers:", error);
    }
  };

  const handleModelChange = (provider: string, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
  };

  // Load chat history and providers on mount
  useEffect(() => {
    loadChatHistory();
    loadProviders();
  }, []);

  useEffect(() => {
    if (width < 768) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [width]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "sessionId",
        currentChatId || `session-${crypto.randomUUID()}`,
      );
      const response = await axios.post<{ file: { url: string } }>(
        "/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setAttachedFile({
        name: file.name,
        url: response.data.file.url,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    scrollToBottom();

    // Prepare message content with file URL if attached
    let messageContent = input;
    if (attachedFile) {
      messageContent += `\n\n[Attached file: ${attachedFile.name}]\nFile URL: ${attachedFile.url}`;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageContent,
      timestamp: dayjs().toDate(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachedFile(null); // Clear attached file after sending
    setIsThinking(true);

    try {
      // Generate session ID if new chat
      const sessionId = currentChatId || `session-${crypto.randomUUID()}`;

      const response = await axios.post("/api/chat/message", {
        sessionId: sessionId,
        message: messageContent,
        provider: selectedProvider,
        options: {
          model: selectedModel,
        },
      });

      // Simulate thinking time
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsThinking(false);

      // Stream the response
      await streamResponse(response.data.assistantMessage.content);

      // Update current chat ID and reload history
      if (!currentChatId) {
        setCurrentChatId(sessionId);
        loadChatHistory();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsThinking(false);

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: dayjs().toDate(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const streamResponse = async (text: string) => {
    setIsStreaming(true);
    setStreamingText("");

    const words = text.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];
      setStreamingText(currentText);
      await new Promise((resolve) => setTimeout(resolve, 50)); // Adjust speed here
    }

    // Add final message to messages array
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: text,
      timestamp: dayjs().toDate(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setTimeout(scrollToBottom, 0);
    setStreamingText("");
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setStreamingText("");
    setAttachedFile(null);
  };

  const handleChatSelect = async (chatId: string) => {
    try {
      const response = await axios.get(`/api/chat/session/${chatId}`);
      const chatData = response.data;

      if (chatData.messages) {
        setMessages(
          chatData.messages.map((msg: ChatMessage) => ({
            id: msg._id || crypto.randomUUID(),
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: dayjs(msg.timestamp).toDate(),
          })),
        );
      }

      setCurrentChatId(chatId);
      setTimeout(scrollToBottom, 0);
      if (width < 768) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  return (
    <div className="chat-container">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && width < 768 && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
          tabIndex={-1}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.2)",
            zIndex: 40,
          }}
        />
      )}
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <MessageSquare className="inline mr-2" size={20} />
          Chat History
        </div>
        <Button
          variant="outline"
          className="new-chat-btn"
          onClick={handleNewChat}
        >
          <Plus size={16} className="mr-2" />
          New Chat
        </Button>
        <ScrollArea className="sidebar-content">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${currentChatId === chat.id ? "active" : ""}`}
              onClick={() => handleChatSelect(chat.id)}
            >
              {chat.title || "New Chat"}
            </div>
          ))}
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div>
              <Menu size={24} onClick={() => setSidebarOpen((prev) => !prev)} />
            </div>
            <h1>Template.net</h1>
          </div>
        </header>

        {/* Chat Area */}
        <ScrollArea
          className="chat-area"
          ref={(el) => {
            if (el) {
              chatAreaRef.current = el.querySelector(
                "[data-radix-scroll-area-viewport]",
              ) as HTMLDivElement;
            }
          }}
        >
          {messages.length === 0 && !isThinking && !isStreaming && (
            <div className="empty-state">
              <MessageSquare />
              <h2>Start a conversation</h2>
              <p>Send a message to begin chatting with the AI assistant</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="avatar">
                {message.role === "user" ? (
                  <User size={16} />
                ) : (
                  <Bot size={16} />
                )}
              </div>
              <div className="message-content">
                <div className="py-1 px-2">{message.content}</div>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="thinking-indicator">
              <div className="avatar">
                <Bot size={16} />
              </div>
              <div className="thinking-content">
                Thinking
                <div className="dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {isStreaming && streamingText && (
            <div className="message assistant">
              <div className="avatar">
                <Bot size={16} />
              </div>
              <div className="message-content streaming-text">
                {streamingText}
                <span className="cursor"></span>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="input-area">
          {attachedFile && (
            <div className="attached-file">
              {attachedFile.url.match(
                /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i,
              ) && (
                <img
                  src={`${import.meta.env.VITE_FILE_URL}${attachedFile.url}`}
                  alt={attachedFile.name}
                  className="mt-2 rounded-lg border border-gray-200 max-w-14 max-h-14 w-full md:max-w-30  md:max-h-30 object-contain"
                />
              )}
              <div className="file-info hidden md:block">
                <div className="file-name">{attachedFile.name}</div>
              </div>
              {/* Show image preview if the file is an image */}

              <X size={16} className="remove-file" onClick={handleRemoveFile} />
            </div>
          )}
          <div className="input-wrapper">
            <div className="flex gap-3 w-full md:w-fit">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
              <div
                className="upload-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload file"
              >
                <Plus size={width < 768 ? 16 : 20} />
              </div>
              <DropdownModels
                value={selectedModel}
                onValueChange={handleModelChange}
                options={availableProviders}
                disabled={isThinking || isStreaming}
              />
            </div>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              rows={1}
              disabled={isThinking || isStreaming || isUploading}
            />
            <Button
              onClick={handleSend}
              disabled={
                !input.trim() || isThinking || isStreaming || isUploading
              }
              className="send-btn"
            >
              <Sparkles size={16} /> Generate
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import "./App.css";

// Suggested questions shown at the start
const SUGGESTED_QUESTIONS = [
  "What is the refund policy?",
  "What data plans do you offer?",
  "What is 5G technology?",
  "How does international roaming work?"
];

// Map tool names to display labels and emojis
const TOOL_LABELS = {
  search_policy: { emoji: "📋", label: "Searched policy" },
  search_wikipedia: { emoji: "🌐", label: "Searched Wikipedia" }
};

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: "Hello! I'm your Deutsche Telekom support assistant. How can I help you today?",
      tools_used: []
    },
    {
      role: "agent",
      text: "⚠️ Note: The server may take 2-3 minutes to wake up on your first message. This is a one-time delay — all following messages will be fast!",
      tools_used: []
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage || loading) return;

    // Hide suggestions after first message
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: "user", text: userMessage, tools_used: [] }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://telecom-ai-agent.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: "agent",
        text: data.response,
        tools_used: data.tools_used || []
      }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        role: "agent",
        text: "Sorry, I'm having trouble connecting. Please make sure the server is running.",
        tools_used: []
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = async () => {
    try {
      await fetch("https://telecom-ai-agent.onrender.com/reset", { method: "POST" });
    } catch (error) {
      console.error("Reset failed:", error);
    }
    setMessages([{
      role: "agent",
      text: "Hello! I'm your Deutsche Telekom support assistant. How can I help you today?",
      tools_used: []
    }]);
    setShowSuggestions(true);
  };

  return (
    <div className="app">

      {/* Header */}
      <div className="header">
        <div className="header-left">
          <div className="avatar agent-avatar">
            <Bot size={20} />
          </div>
          <div className="header-info">
            <div className="header-name">Telekom Support</div>
            <div className="header-status">● Online</div>
          </div>
        </div>
        <button className="reset-btn" onClick={resetChat}>
          New Chat
        </button>
      </div>

      {/* Messages area */}
      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-row ${msg.role === "user" ? "user-row" : "agent-row"}`}
          >
            {msg.role === "agent" && (
              <div className="avatar agent-avatar small">
                <Bot size={14} />
              </div>
            )}

            <div className="bubble-wrapper">
              <div className={`bubble ${msg.role === "user" ? "user-bubble" : "agent-bubble"}`}>
                {msg.text}
              </div>

              {/* Tool badges — shown under agent messages */}
              {msg.role === "agent" && msg.tools_used && msg.tools_used.length > 0 && (
                <div className="tool-badges">
                  {msg.tools_used.map((tool, i) => (
                    <span key={i} className="tool-badge">
                      {TOOL_LABELS[tool]?.emoji} {TOOL_LABELS[tool]?.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="avatar user-avatar small">
                <User size={14} />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="message-row agent-row">
            <div className="avatar agent-avatar small">
              <Bot size={14} />
            </div>
            <div className="bubble agent-bubble typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {/* Suggested questions */}
        {showSuggestions && (
          <div className="suggestions">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                className="suggestion-chip"
                onClick={() => sendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="input-area">
        <input
          className="input"
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
        >
          <Send size={18} />
        </button>
      </div>

    </div>
  );
}
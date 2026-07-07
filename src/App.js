import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import "./App.css";

// The main chat component
export default function App() {

  // messages — list of all chat messages
  // Each message has: { role: "user" or "agent", text: "..." }
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: "Hello! I'm your Deutsche Telekom support assistant. How can I help you today?"
    }
  ]);

  // input — what the user is currently typing
  const [input, setInput] = useState("");

  // loading — true when waiting for agent response
  // Used to show the typing indicator
  const [loading, setLoading] = useState(false);

  // messagesEndRef — a reference to the bottom of the chat
  // Used to auto-scroll when new messages arrive
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // sendMessage — called when user clicks Send or presses Enter
  const sendMessage = async () => {

    // Don't send empty messages or while waiting for response
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    // Add user message to chat immediately
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      // Send message to FastAPI backend
      const response = await fetch("https://telecom-ai-agent.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      // Add agent response to chat
      setMessages(prev => [...prev, { role: "agent", text: data.response }]);

    } catch (error) {
      // Show error message if backend is unreachable
      setMessages(prev => [...prev, {
        role: "agent",
        text: "Sorry, I'm having trouble connecting. Please make sure the server is running."
      }]);
    }

    setLoading(false);
  };

  // Handle Enter key press in input field
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Reset conversation
  const resetChat = async () => {
    try {
      await fetch("https://telecom-ai-agent.onrender.com/reset", { method: "POST" });
    } catch (error) {
      console.error("Reset failed:", error);
    }
    setMessages([{
      role: "agent",
      text: "Hello! I'm your Deutsche Telekom support assistant. How can I help you today?"
    }]);
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
            {/* Avatar */}
            {msg.role === "agent" && (
              <div className="avatar agent-avatar small">
                <Bot size={14} />
              </div>
            )}

            {/* Message bubble */}
            <div className={`bubble ${msg.role === "user" ? "user-bubble" : "agent-bubble"}`}>
              {msg.text}
            </div>

            {/* User avatar on right */}
            {msg.role === "user" && (
              <div className="avatar user-avatar small">
                <User size={14} />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator — shown while agent is thinking */}
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

        {/* Invisible div at bottom for auto-scroll */}
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
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          <Send size={18} />
        </button>
      </div>

    </div>
  );
}
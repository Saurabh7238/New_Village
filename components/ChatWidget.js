"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize userId from localStorage
  useEffect(() => {
    let id = localStorage.getItem("chatUserId");
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("chatUserId", id);
    }
    setUserId(id);
  }, []);

  // Fetch messages periodically
  useEffect(() => {
    if (!userId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          scrollToBottom();
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: userMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        // Refresh messages
        const messagesRes = await fetch(`/api/chat?userId=${userId}`);
        if (messagesRes.ok) {
          const updatedMessages = await messagesRes.json();
          setMessages(updatedMessages);
          scrollToBottom();
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 font-sans">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-emerald-700 text-white shadow-xl hover:bg-emerald-800 transition-all flex items-center justify-center text-2xl"
          aria-label="Open chat"
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-0 right-0 w-80 h-96 bg-gray-900 text-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="bg-emerald-700 p-4 flex items-center justify-between">
            <h3 className="font-bold text-lg">सेवा बॉट</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-emerald-800 p-1 rounded transition"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-800">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-4">
                <p className="mb-2">नमस्ते! 🙏</p>
                <p>कृपया अपनी सेवा का नाम बताएं।</p>
                <p className="text-xs mt-2">Hello! Please tell your service name.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="संदेश भेजें..."
              disabled={loading}
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white p-2 rounded transition disabled:opacity-50 flex-shrink-0"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
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

  const handleSend = async (directText) => {
    const msg = directText || input;
    if (!msg.trim() || loading) return;

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: msg }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuickReplies(data.quickReplies || []);
        
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
        <div className="absolute bottom-0 right-0 w-80 h-[500px] bg-slate-900 text-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
          {/* Header */}
          <div className="bg-emerald-700 p-4 flex items-center justify-between rounded-t-xl">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
            {messages.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-6">
                <p className="mb-2 text-lg">नमस्ते! 🙏</p>
                <p>कृपया अपनी सेवा चुनें।</p>
                <p className="text-xs mt-3">Select your service below.</p>
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
                    className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-emerald-600 text-white rounded-br-none"
                        : "bg-slate-700 text-slate-100 rounded-bl-none"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            
            {/* Quick Replies */}
            {quickReplies && quickReplies.length > 0 && (
              <div className="mt-4 px-2">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(opt);
                        handleSend(opt);
                      }}
                      className="px-3 py-1.5 text-xs font-medium border-2 border-emerald-600 text-emerald-600 rounded-full hover:bg-emerald-600 hover:text-white transition bg-slate-800 whitespace-nowrap"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-700 p-3 flex gap-2 bg-slate-800">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="संदेश भेजें... / Type message..."
              disabled={loading}
              className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 rounded-lg transition disabled:opacity-50 flex-shrink-0"
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

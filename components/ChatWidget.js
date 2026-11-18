"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Check, Copy, ExternalLink, Send, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/language-provider";

export default function ChatWidget() {
  const { status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const isHindi = language === "hi";
  const text = isHindi
    ? {
      open: "चैट खोलें",
      loginRequired: "लॉगिन आवश्यक है",
      loginFirst: "चैट करने के लिए पहले लॉगिन करें।",
      login: "लॉगिन",
      close: "बंद करें",
      serviceAssistant: "पंचायत सेवा सहायक",
      chatLabel: "पंचायत सेवा चैट",
      messages: "चैट संदेश",
      loginStart: "चैट शुरू करने के लिए लॉगिन करें",
      goLogin: "लॉगिन करें",
      hello: "नमस्ते! 🙏",
      chooseService: "कृपया अपनी सेवा चुनें।",
      selectBelow: "नीचे अपनी सेवा चुनें।",
      preparing: "सहायक जवाब तैयार कर रहा है…",
      confirmationLabel: "टिकट की पुष्टि",
      requestReceived: "अनुरोध प्राप्त हुआ",
      ticket: "टिकट",
      service: "सेवा",
      ward: "वार्ड",
      status: "स्थिति",
      keepNumber: "यह नंबर संभालकर रखें। पंचायत टीम आपके अनुरोध की समीक्षा करेगी।",
      copyTicket: "टिकट कॉपी करें",
      closeChat: "चैट बंद करें",
      trackTicket: "इस टिकट को ट्रैक करें",
      newRequest: "नया अनुरोध शुरू करें",
      typeMessage: "अपना संदेश लिखें",
      loginPlaceholder: "पहले लॉगिन करें...",
      messagePlaceholder: "संदेश भेजें...",
      send: "संदेश भेजें",
      couldNotRefresh: "बातचीत अपडेट नहीं हो सकी। कृपया पुनः प्रयास करें।",
      connectionRefresh: "कनेक्शन में समस्या। चैट इतिहास अपडेट नहीं हो सका।",
      copySuccess: "टिकट नंबर कॉपी हुआ।",
      copyFailure: "स्वचालित रूप से कॉपी नहीं हो सका। टिकट नंबर चुनकर कॉपी करें।",
      couldNotSend: "संदेश नहीं भेजा जा सका। कृपया पुनः प्रयास करें।",
      connectionSend: "कनेक्शन में समस्या। इंटरनेट जांचकर पुनः प्रयास करें।",
    }
    : {
      open: "Open chat",
      loginRequired: "Login required",
      loginFirst: "Please log in first to chat.",
      login: "Login",
      close: "Close",
      serviceAssistant: "Panchayat Service Assistant",
      chatLabel: "Panchayat service chat",
      messages: "Chat messages",
      loginStart: "Please login to start chatting",
      goLogin: "Go to Login",
      hello: "Hello! 🙏",
      chooseService: "Please select your service.",
      selectBelow: "Select your service below.",
      preparing: "Assistant is preparing a response…",
      confirmationLabel: "Ticket confirmation",
      requestReceived: "Request received",
      ticket: "Ticket",
      service: "Service",
      ward: "Ward",
      status: "Status",
      keepNumber: "Keep this number. The Panchayat team will review your request.",
      copyTicket: "Copy ticket",
      closeChat: "Close chat",
      trackTicket: "Track this ticket",
      newRequest: "Start new request",
      typeMessage: "Type your message",
      loginPlaceholder: "Please log in...",
      messagePlaceholder: "Type message...",
      send: "Send message",
      couldNotRefresh: "Could not refresh this conversation. Please try again.",
      connectionRefresh: "Connection problem. Chat history could not be refreshed.",
      copySuccess: "Ticket number copied.",
      copyFailure: "Could not copy automatically. Select and copy the ticket number.",
      couldNotSend: "Message could not be sent. Please try again.",
      connectionSend: "Connection problem. Check your internet and try again.",
    };
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [ticketConfirmation, setTicketConfirmation] = useState(null);
  const [sendError, setSendError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const messagesEndRef = useRef(null);
  const audioContextRef = useRef(null);
  const lastMessageSignatureRef = useRef("");
  const chatWidgetRef = useRef(null);

  const playChatTone = (type = "incoming") => {
    if (typeof window === "undefined") return;

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;

    const audioContext = audioContextRef.current ?? new AudioCtor();
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type === "sent" ? "triangle" : "sine";
    oscillator.frequency.value = type === "sent" ? 720 : 520;

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.14);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  };

  // Fetch messages only if authenticated
  useEffect(() => {
    if (status !== "authenticated" || !isOpen) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat`);
        if (res.status === 401) {
          setMessages([]);
          lastMessageSignatureRef.current = "";
          setLoadError("");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          const chatMessages = Array.isArray(data) ? data : data.messages || [];
          const signature = JSON.stringify(chatMessages);
          const hasNewMessage = signature !== lastMessageSignatureRef.current && chatMessages.length > 0;

          setMessages(chatMessages);
          setLoadError("");
          setQuickReplies(Array.isArray(data.quickReplies) ? data.quickReplies : []);
          setTicketConfirmation(data.confirmation || null);
          lastMessageSignatureRef.current = signature;

          if (hasNewMessage) {
            playChatTone(chatMessages[chatMessages.length - 1]?.sender === "user" ? "sent" : "incoming");
          }

          scrollToBottom();
        } else {
          setLoadError(text.couldNotRefresh);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setLoadError(text.connectionRefresh);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, language, status, text.connectionRefresh, text.couldNotRefresh]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (!chatWidgetRef.current?.contains(event.target)) {
        setIsOpen(false);
        setShowLoginPrompt(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, quickReplies, ticketConfirmation]);

  const copyTicketNumber = async () => {
    try {
      await navigator.clipboard.writeText(ticketConfirmation.ticketId);
      setCopyFeedback(text.copySuccess);
    } catch {
      setCopyFeedback(text.copyFailure);
    }
  };

  const handleSend = async (directText) => {
    if (status !== "authenticated") {
      setShowLoginPrompt(true);
      return;
    }

    const msg = directText || input;
    if (!msg.trim() || loading) return;

    setInput("");
    setLoading(true);
    setSendError("");
    setCopyFeedback("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      if (res.status === 401) {
        setShowLoginPrompt(true);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setQuickReplies(data.quickReplies || []);
        setTicketConfirmation(data.confirmation || null);
        playChatTone("sent");

        const messagesRes = await fetch(`/api/chat`);
        if (messagesRes.ok) {
          const updatedMessages = await messagesRes.json();
          const chatMessages = Array.isArray(updatedMessages) ? updatedMessages : updatedMessages.messages || [];
          setMessages(chatMessages);
          setQuickReplies(Array.isArray(updatedMessages.quickReplies) ? updatedMessages.quickReplies : data.quickReplies || []);
          setTicketConfirmation(updatedMessages.confirmation || data.confirmation || null);
          lastMessageSignatureRef.current = JSON.stringify(chatMessages);
          scrollToBottom();
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setSendError(data.error || text.couldNotSend);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setSendError(text.connectionSend);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;

  return (
    <div ref={chatWidgetRef} className="fixed bottom-4 right-4 z-40 font-sans sm:bottom-5 sm:right-5">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-emerald-700 text-white shadow-xl hover:bg-emerald-800 transition-all flex items-center justify-center text-2xl"
          aria-label={text.open}
        >
          💬
        </button>
      )}

      {showLoginPrompt && (
        <div className="absolute bottom-20 right-0 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-amber-200 dark:border-amber-900 p-4 z-50">
          <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2">
            {text.loginRequired} 🔒
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {text.loginFirst}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowLoginPrompt(false);
                router.push("/signin");
              }}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded text-sm font-semibold transition"
            >
              {text.login}
            </button>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded text-sm transition"
            >
              {text.close}
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <section aria-label={text.chatLabel} className="absolute bottom-0 right-0 flex h-[min(34rem,calc(100dvh-2rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
          <header className="flex items-center justify-between bg-emerald-700 p-4">
            <div>
              <h3 className="text-lg font-bold">सेवा बॉट</h3>
              <p className="text-xs text-emerald-100">{text.serviceAssistant}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-2 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label={text.closeChat}
            >
              <X size={20} />
            </button>
          </header>

          <div aria-label={text.messages} aria-live="polite" aria-relevant="additions text" role="log" className="flex-1 space-y-3 overflow-y-auto bg-slate-900 p-4">
            {status !== "authenticated" ? (
              <div className="text-center text-slate-400 text-sm py-6">
                <p className="mb-2 text-lg">🔒 {text.loginRequired}</p>
                <p>{text.loginStart}</p>
                <button
                  onClick={() => router.push("/signin")}
                  className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded text-sm font-semibold transition"
                >
                  {text.goLogin}
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-6">
                <p className="mb-2 text-lg">{text.hello}</p>
                <p>{text.chooseService}</p>
                <p className="text-xs mt-3">{text.selectBelow}</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={msg._id || `${msg.createdAt}-${idx}`} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${msg.sender === "user" ? "rounded-br-none bg-emerald-600 text-white" : "rounded-bl-none bg-slate-700 text-slate-100"}`}>
                    {msg.message}
                  </div>
                  {msg.createdAt && <time dateTime={msg.createdAt} className="mt-1 px-1 text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</time>}
                </div>
              ))
            )}

            {loading && <p role="status" className="text-xs text-slate-300">{text.preparing}</p>}

            {ticketConfirmation && (
              <section aria-label={text.confirmationLabel} className="rounded-xl border border-emerald-500/60 bg-emerald-950/70 p-3">
                <div className="flex items-center gap-2 font-bold text-emerald-200"><Check className="h-4 w-4" aria-hidden="true" /> {text.requestReceived}</div>
                <dl className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between gap-2"><dt className="text-slate-300">{text.ticket}</dt><dd className="font-bold text-white">#{ticketConfirmation.ticketId}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slate-300">{text.service}</dt><dd className="text-right">{ticketConfirmation.service}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slate-300">{text.ward}</dt><dd>{text.ward} {ticketConfirmation.ward}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slate-300">{text.status}</dt><dd>{ticketConfirmation.status}</dd></div>
                </dl>
                <p className="mt-2 text-xs text-slate-200">{text.keepNumber}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={copyTicketNumber} className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-500 px-2 py-2 text-xs font-semibold hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"><Copy className="h-3.5 w-3.5" aria-hidden="true" />{text.copyTicket}</button>
                  <button onClick={() => setIsOpen(false)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-500 px-2 py-2 text-xs font-semibold hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300">{text.closeChat}</button>
                  <button onClick={() => { setIsOpen(false); router.push(`/chat/track?ticketId=${encodeURIComponent(ticketConfirmation.ticketId)}`); }} className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-700 px-2 py-2 text-xs font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300">{text.trackTicket} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></button>
                </div>
                {copyFeedback && <p aria-live="polite" className="mt-2 text-center text-xs text-emerald-200">{copyFeedback}</p>}
              </section>
            )}
            
            {quickReplies && quickReplies.length > 0 && (
              <div className="mt-4 px-2">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(opt)}
                      disabled={loading}
                      className="whitespace-nowrap rounded-full border-2 border-emerald-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {ticketConfirmation && (
              <button onClick={() => handleSend("Start new request")} disabled={loading} className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50">
                {text.newRequest} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}

            {loadError && <p role="alert" className="rounded-lg bg-amber-950 px-3 py-2 text-xs text-amber-100">{loadError}</p>}
            {sendError && <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-xs text-red-200">{sendError}</p>}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={(event) => { event.preventDefault(); handleSend(); }} className="flex gap-2 border-t border-slate-700 bg-slate-800 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setInput("");
              }}
              aria-label={text.typeMessage}
              placeholder={status !== "authenticated" ? text.loginPlaceholder : text.messagePlaceholder}
              disabled={loading || status !== "authenticated"}
              maxLength={500}
              className="flex-1 bg-white text-slate-900 dark:bg-slate-700 dark:text-white px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 dark:placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading || status !== "authenticated" || !input.trim()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              aria-label={text.send}
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

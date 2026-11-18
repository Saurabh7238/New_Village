"use client";

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/language-provider";

function findRoute(phrase) {
  const value = phrase.toLocaleLowerCase();
  const routes = [
    { path: "/emergency", pattern: /emergency|ambulance|police|आपात|एम्बुलेंस|पुलिस/ },
    { path: "/track", pattern: /track|status|स्थिति|ट्रैक|शिकायत.*स्थिति|स्थिति.*शिकायत/ },
    { path: "/grievance", pattern: /complaint|grievance|report.*issue|शिकायत|समस्या/ },
    { path: "/development", pattern: /development|project|विकास|परियोजना/ },
    { path: "/community", pattern: /community|facility|camp|outage|lost|found|सुविधा|शिविर|खोया|पाया/ },
    { path: "/notices", pattern: /notice|announcement|सूचना|नोटिस/ },
    { path: "/voter", pattern: /voter|मतदाता|वोटर/ },
    { path: "/map", pattern: /map|location|मानचित्र|नक्शा|स्थान/ },
    { path: "/infrastructure", pattern: /infrastructure|facilities|अवसंरचना|सुविधाएं/ },
    { path: "/downloads", pattern: /download|forms|फॉर्म|डाउनलोड/ },
    { path: "/appointments", pattern: /appointment|booking|अपॉइंटमेंट|नियुक्ति/ },
    { path: "/weather", pattern: /weather|मौसम/ },
    { path: "/", pattern: /home|homepage|मुख्य पृष्ठ|होम/ },
  ];
  return routes.find((route) => route.pattern.test(value))?.path || "";
}

export default function VoiceNavigator() {
  const router = useRouter();
  const { language } = useLanguage();
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");

  const startListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setMessage(language === "hi"
        ? "इस ब्राउज़र में आवाज़ से नेविगेशन उपलब्ध नहीं है।"
        : "Voice navigation is not supported by this browser.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      const path = findRoute(transcript);
      if (path) {
        setMessage(language === "hi" ? "पृष्ठ खोला जा रहा है…" : "Opening page…");
        router.push(path);
      } else {
        setMessage(language === "hi"
          ? "पृष्ठ नहीं मिला। सेवा या पृष्ठ का नाम बोलें।"
          : "No page matched. Try saying a service or page name.");
      }
    };
    recognition.onerror = (event) => {
      setMessage(event.error === "not-allowed"
        ? (language === "hi" ? "आवाज़ की अनुमति दें और फिर प्रयास करें।" : "Allow microphone access, then try again.")
        : (language === "hi" ? "आवाज़ समझ नहीं आई। फिर प्रयास करें।" : "Could not hear that. Please try again."));
    };
    recognition.onend = () => setListening(false);

    try {
      setMessage(language === "hi" ? "सुन रहा है… पृष्ठ का नाम बोलें।" : "Listening… say a page or service name.");
      setListening(true);
      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error("Voice navigation could not start:", error);
      setListening(false);
      setMessage(language === "hi" ? "आवाज़ सुविधा शुरू नहीं हो सकी।" : "Voice navigation could not start.");
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <li className="rounded-lg border border-slate-200 p-2 dark:border-slate-600">
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        aria-pressed={listening}
        className="flex min-h-10 w-full items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-teal-50 dark:bg-slate-700 dark:text-white dark:hover:bg-teal-950"
      >
        {listening ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
        {language === "hi" ? (listening ? "सुनना बंद करें" : "आवाज़ से पृष्ठ खोलें") : (listening ? "Stop listening" : "Open a page by voice")}
      </button>
      {message && <p role="status" className="mt-2 px-1 text-xs text-slate-600 dark:text-slate-300">{message}</p>}
    </li>
  );
}

"use client";

import { useLanguage } from "@/app/language-provider";

const contacts = [
  ["Ambulance", "एम्बुलेंस", "108"],
  ["Police", "पुलिस", "112"],
  ["Fire service", "अग्निशमन सेवा", "101"],
  ["Electricity complaint", "बिजली शिकायत", "1912"],
  ["Water supply", "जल आपूर्ति", "1800-180-1551"],
];

export default function EmergencyPage() {
  const { language } = useLanguage();
  const text = language === "hi"
    ? {
      title: "आपातकालीन संपर्क",
      description: "जानलेवा आपात स्थिति में तुरंत संबंधित सेवा को कॉल करें।",
      call: "कॉल करें",
    }
    : {
      title: "Emergency contacts",
      description: "For life-threatening emergencies, call the relevant service immediately.",
      call: "Tap to call",
    };

  return (
    <div className="mx-auto max-w-3xl py-8">
      <h1 lang={language} className="text-3xl font-bold text-red-700 dark:text-red-300">{text.title}</h1>
      <p lang={language} className="mt-2 text-slate-600 dark:text-slate-300">{text.description}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {contacts.map(([name, hindi, number]) => (
          <a
            key={number}
            href={`tel:${number.replace(/[^0-9+]/g, "")}`}
            aria-label={`${language === "hi" ? hindi : name}, ${number}. ${text.call}`}
            className="rounded-xl border border-red-200 bg-white p-5 shadow-sm transition hover:border-red-400 hover:shadow-md dark:border-red-900 dark:bg-slate-800"
          >
            <p lang="en" className="font-bold text-slate-900 dark:text-white">{name}</p>
            <p lang="hi" className="text-sm text-slate-600 dark:text-slate-300">{hindi}</p>
            <p className="mt-3 text-2xl font-bold text-red-700 dark:text-red-300">{number}</p>
            <span lang={language} className="text-sm font-semibold text-red-700 dark:text-red-300">{text.call}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

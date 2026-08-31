"use client";

const contacts = [
  ["Ambulance", "एम्बुलेंस", "108"],
  ["Police", "पुलिस", "112"],
  ["Fire service", "अग्निशमन सेवा", "101"],
  ["Electricity complaint", "बिजली शिकायत", "1912"],
  ["Water supply", "जल आपूर्ति", "1800-180-1551"],
];

export default function EmergencyPage() {
  return <div className="mx-auto max-w-3xl py-8"><h1 className="text-3xl font-bold text-red-700 dark:text-red-300">Emergency contacts / आपातकालीन संपर्क</h1><p className="mt-2 text-slate-600 dark:text-slate-300">For life-threatening emergencies, call the relevant service immediately.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{contacts.map(([name, hindi, number]) => <a key={number} href={`tel:${number.replace(/[^0-9+]/g, "")}`} className="rounded-xl border border-red-200 bg-white p-5 shadow-sm transition hover:border-red-400 hover:shadow-md dark:border-red-900 dark:bg-slate-800"><p className="font-bold text-slate-900 dark:text-white">{name}</p><p className="text-sm text-slate-600 dark:text-slate-300">{hindi}</p><p className="mt-3 text-2xl font-bold text-red-700 dark:text-red-300">{number}</p><span className="text-sm font-semibold text-red-700 dark:text-red-300">Tap to call / कॉल करें</span></a>)}</div></div>;
}

"use client";

"use client";

import Link from "next/link";
import { useLanguage } from "@/app/language-provider";

const applicationSteps = ["Submitted", "Under Review", "Need Documents", "Updated", "Approved", "Completed"];
const appointmentSteps = ["Requested", "Scheduled", "Completed"];

function downloadReceipt({ reference, title, status, date, details = "", language }) {
  const isHindi = language === "hi";
  const content = [
    isHindi ? "ग्राम पंचायत चिउतहारा" : "GRAM PANCHAYAT CHIUTAHARA",
    isHindi ? "नागरिक अनुरोध रसीद" : "Citizen request receipt",
    "",
    `${isHindi ? "संदर्भ" : "Reference"}: ${reference}`,
    `${isHindi ? "सेवा" : "Service"}: ${title}`,
    `${isHindi ? "स्थिति" : "Status"}: ${status}`,
    `${isHindi ? "जमा किया गया" : "Submitted"}: ${new Date(date).toLocaleString(isHindi ? "hi-IN" : "en-IN")}`,
    details && `${isHindi ? "विवरण" : "Details"}: ${details}`,
  ].filter(Boolean).join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reference}-receipt.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RequestStatusCard({ item, type }) {
  const { language } = useLanguage();
  const isHindi = language === "hi";
  const labels = isHindi
    ? {
      appointment: "पंचायत अपॉइंटमेंट",
      otherService: "अन्य सेवा",
      submitted: "जमा किया गया",
      underReview: "समीक्षा में",
      needDocuments: "दस्तावेज़ आवश्यक",
      updated: "अपडेट किया गया",
      approved: "स्वीकृत",
      completed: "पूर्ण",
      requested: "अनुरोधित",
      scheduled: "निर्धारित",
      pending: "लंबित",
      inReview: "समीक्षा में",
      inProgress: "प्रगति में",
      resolved: "हल किया गया",
      latestUpdate: "नवीनतम अपडेट:",
      trackQuery: "प्रश्न ट्रैक करें",
      requestDetails: "अनुरोध विवरण",
      downloadReceipt: "रसीद डाउनलोड करें",
      submittedAt: "जमा किया गया",
      timeline: "स्थिति समयरेखा",
    }
    : {
      appointment: "Panchayat appointment",
      otherService: "Other service",
      submitted: "Submitted",
      underReview: "Under Review",
      needDocuments: "Need Documents",
      updated: "Updated",
      approved: "Approved",
      completed: "Completed",
      requested: "Requested",
      scheduled: "Scheduled",
      pending: "Pending",
      inReview: "In Review",
      inProgress: "In Progress",
      resolved: "Resolved",
      latestUpdate: "Latest update:",
      trackQuery: "Track query",
      requestDetails: "Request details",
      downloadReceipt: "Download receipt",
      submittedAt: "Submitted",
      timeline: "Status timeline",
    };
  const serviceLabels = isHindi
    ? {
      "birth-certificate": "जन्म प्रमाणपत्र",
      "death-certificate": "मृत्यु प्रमाणपत्र",
      "aadhaar-request": "आधार सेवा",
      "aadhar-request": "आधार सेवा",
      "voter-request": "मतदाता सेवा अनुरोध",
    }
    : {};
  const statusLabels = {
    Submitted: labels.submitted,
    "Under Review": labels.underReview,
    "Need Documents": labels.needDocuments,
    Updated: labels.updated,
    Approved: labels.approved,
    Completed: labels.completed,
    Requested: labels.requested,
    Scheduled: labels.scheduled,
    Pending: labels.pending,
    "In Review": labels.inReview,
    "In Progress": labels.inProgress,
    Resolved: labels.resolved,
    New: labels.pending,
  };
  const isAppointment = type === "appointment";
  const isQuery = type === "query";
  const title = isAppointment
    ? labels.appointment
    : isQuery
      ? `${item.category} query: ${item.subject}`
      : (serviceLabels[item.serviceType] || item.serviceType || labels.otherService).replace(/-/g, " ");
  const reference = isAppointment ? item.appointmentNumber : isQuery ? item.queryId : item.applicationNumber;
  const normalizedStatus = isAppointment && item.status === "Pending" ? "Requested" : item.status;
  const querySteps = ["Pending", "In Review", "In Progress", "Resolved"];
  const steps = isAppointment ? appointmentSteps : isQuery ? querySteps : applicationSteps;
  const queryStatus = item.status === "New" ? "Pending" : item.status;
  const timelineStatus = isQuery ? queryStatus : normalizedStatus;
  const activeIndex = Math.max(0, steps.indexOf(timelineStatus));

  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Link href={`/dashboard/requests/${type}/${item.id}`} className="font-bold text-emerald-700 underline hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100">{reference}</Link>
        <p className="mt-1 capitalize text-sm text-slate-600 dark:text-slate-300">{title}</p>
      </div>
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{statusLabels[item.status] || item.status}</span>
    </div>
    <ol className="mt-5 flex items-start overflow-x-auto pb-2" aria-label={`${labels.timeline} ${reference}`}>
      {steps.map((step, index) => <li key={step} className="flex min-w-16 flex-1 flex-col items-center px-1 text-center text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:min-w-0 sm:text-[11px]"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${index <= activeIndex ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>{index < activeIndex ? "✓" : index + 1}</span><span className="mt-1 break-words">{statusLabels[step] || step}</span></li>)}
    </ol>
    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{labels.submittedAt} {new Date(item.createdAt || item.appointmentDate).toLocaleDateString(isHindi ? "hi-IN" : "en-IN")}</p>
    {item.adminRemarks && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-200"><strong>{labels.latestUpdate}</strong> {item.adminRemarks}</p>}
    {isQuery && <Link href={`/track?id=${encodeURIComponent(item.queryId)}`} className="mt-4 inline-block rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950">{labels.trackQuery}</Link>}
    <Link href={`/dashboard/requests/${type}/${item.id}`} className="ml-2 mt-4 inline-block rounded-lg border border-slate-400 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-700">{labels.requestDetails}</Link>
    <button type="button" onClick={() => downloadReceipt({ reference, title, status: statusLabels[item.status] || item.status, date: item.createdAt || item.appointmentDate, details: item.adminRemarks, language })} className="mt-4 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950">{labels.downloadReceipt}</button>
  </article>;
}

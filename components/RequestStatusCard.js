"use client";

const applicationSteps = ["Submitted", "Under Review", "Need Documents", "Approved", "Completed"];
const appointmentSteps = ["Requested", "Scheduled", "Completed"];

function downloadReceipt({ reference, title, status, date, details = "" }) {
  const content = [
    "GRAM PANCHAYAT CHIUTAHARA",
    "Citizen request receipt",
    "",
    `Reference: ${reference}`,
    `Service: ${title}`,
    `Status: ${status}`,
    `Submitted: ${new Date(date).toLocaleString()}`,
    details && `Details: ${details}`,
  ].filter(Boolean).join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reference}-receipt.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RequestStatusCard({ item, type }) {
  const isAppointment = type === "appointment";
  const title = isAppointment ? "Panchayat appointment" : item.serviceType.replace(/-/g, " ");
  const reference = isAppointment ? item.appointmentNumber : item.applicationNumber;
  const normalizedStatus = isAppointment && item.status === "Pending" ? "Requested" : item.status;
  const steps = isAppointment ? appointmentSteps : applicationSteps;
  const activeIndex = Math.max(0, steps.indexOf(normalizedStatus));

  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="font-bold text-emerald-700 dark:text-emerald-300">{reference}</p><p className="mt-1 capitalize text-sm text-slate-600 dark:text-slate-300">{title}</p></div>
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{item.status}</span>
    </div>
    <ol className="mt-5 flex items-start" aria-label={`Status timeline for ${reference}`}>
      {steps.map((step, index) => <li key={step} className="flex flex-1 flex-col items-center text-center text-[11px] font-medium text-slate-500 dark:text-slate-400"><span className={`grid h-6 w-6 place-items-center rounded-full ${index <= activeIndex ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>{index < activeIndex ? "✓" : index + 1}</span><span className="mt-1">{step}</span></li>)}
    </ol>
    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Submitted {new Date(item.createdAt || item.appointmentDate).toLocaleDateString()}</p>
    {item.adminRemarks && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-200"><strong>Latest update:</strong> {item.adminRemarks}</p>}
    <button type="button" onClick={() => downloadReceipt({ reference, title, status: item.status, date: item.createdAt || item.appointmentDate, details: item.adminRemarks })} className="mt-4 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950">Download receipt</button>
  </article>;
}

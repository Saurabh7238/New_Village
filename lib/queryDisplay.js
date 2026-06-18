export const QUERY_CATEGORIES = [
  "Water", "Road", "Electricity", "Health/PHC", "Pension", "Ration",
  "Certificates", "Drainage", "Street Light", "Anganwadi", "School", "Others"
];

export const QUERY_STATUSES = ["New", "In Progress", "Resolved", "Rejected"];
export const QUERY_PRIORITIES = ["High", "Medium", "Low"];

export const QUERY_ROLES = [
  "Ward Member-1", "Ward Member-2", "Ward Member-3", "Ward Member-4", "Ward Member-5",
  "Ward Member-6", "Ward Member-7", "Ward Member-8", "Ward Member-9", "Ward Member-10",
  "Secretary", "JE", "Pradhan"
];

export const QUERY_SLA_MATRIX = {
  "Water": { ack: 24, resolution: 3 },
  "Health/PHC": { ack: 24, resolution: 3 },
  "Electricity": { ack: 48, resolution: 7 },
  "Road": { ack: 48, resolution: 7 },
  "Drainage": { ack: 48, resolution: 7 },
  "Pension": { ack: 72, resolution: 15 },
  "Ration": { ack: 72, resolution: 15 },
  "Certificates": { ack: 72, resolution: 15 },
  "Street Light": { ack: 72, resolution: 30 },
  "Anganwadi": { ack: 72, resolution: 30 },
  "School": { ack: 72, resolution: 30 },
  "Others": { ack: 72, resolution: 30 }
};

export const ABUSE_WORDS = ["badword1", "badword2"];

export function generateQueryId(counter) {
  const year = new Date().getFullYear();
  return `GP/${year}/${String(counter).padStart(5, '0')}`;
}

export function getStatusBgClass(status) {
  const classes = {
    "New": "bg-orange-100 text-orange-800 dark:bg-orange-900",
    "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900",
    "Resolved": "bg-green-100 text-green-800 dark:bg-green-900",
    "Rejected": "bg-red-100 text-red-800 dark:bg-red-900"
  };
  return classes[status] || "bg-gray-100 text-gray-800";
}

export function maskMobile(mobile) {
  if (!mobile || mobile.length < 10) return "XXXXXXXXXX";
  return mobile.slice(0, 5) + "XXXXX";
}

export function formatQueryDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
  return d.toLocaleDateString("en-IN", options);
}

export function calculateProgressPercentage(status) {
  const percentages = {
    "New": 10,
    "Acknowledged": 30,
    "In Progress": 70,
    "Resolved": 100,
    "Rejected": 50
  };
  return percentages[status] || 0;
}

export function getProgressColor(percentage) {
  if (percentage < 30) return "orange";
  if (percentage < 70) return "yellow";
  return "green";
}

export function getSlaDeadline(createdAt, category) {
  const sla = QUERY_SLA_MATRIX[category] || QUERY_SLA_MATRIX["Others"];
  const date = new Date(createdAt);
  let workingDays = sla.resolution;

  while (workingDays > 0) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) workingDays--;
  }

  return date;
}

export function getAcknowledgmentDeadline(createdAt, category) {
  const sla = QUERY_SLA_MATRIX[category] || QUERY_SLA_MATRIX["Others"];
  const date = new Date(createdAt);
  let workingHours = sla.ack;

  while (workingHours > 0) {
    date.setHours(date.getHours() + 1);
    if (date.getDay() !== 0) workingHours--;
  }

  return date;
}

export function getTimeRemaining(createdAt, category, status) {
  const now = new Date();
  const deadline = status === "New"
    ? getAcknowledgmentDeadline(createdAt, category)
    : getSlaDeadline(createdAt, category);

  const diffMs = deadline - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    isOverdue: diffMs < 0,
    days: Math.abs(diffDays),
    hours: Math.abs(diffHours),
    deadline
  };
}

export function isAbusive(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return ABUSE_WORDS.some(word => lowerText.includes(word.toLowerCase()));
}

export function getAutoAssignedOfficer(ward) {
  return `Ward Member-${ward}`;
}

export function calculateSlaStatus(query) {
  const timeData = getTimeRemaining(query.createdAt, query.category, query.status);

  if (query.status === "Resolved" || query.status === "Rejected") {
    return { status: "resolved", percentComplete: 100 };
  }

  if (timeData.isOverdue) {
    return { status: "overdue", percentComplete: calculateProgressPercentage(query.status) };
  }

  return { status: "in-progress", percentComplete: calculateProgressPercentage(query.status) };
}

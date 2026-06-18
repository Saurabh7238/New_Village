import { getTimeRemaining, QUERY_SLA_MATRIX } from "./queryDisplay";

export function checkSlaBreach(query) {
  const timeData = getTimeRemaining(query.createdAt, query.category, query.status);

  if (query.status === "Resolved" || query.status === "Rejected") {
    return { breached: false, type: null, timeData };
  }

  if (query.status === "New" && timeData.isOverdue) {
    return { breached: true, type: "acknowledgment", timeData };
  }

  if (["Acknowledged", "In Progress"].includes(query.status) && timeData.isOverdue) {
    return { breached: true, type: "resolution", timeData };
  }

  return { breached: false, type: null, timeData };
}

export function getEscalationRecipients(query) {
  const breach = checkSlaBreach(query);
  const recipients = [];
  const messages = [];

  if (!breach.breached) {
    return { recipients, messages };
  }

  if (breach.type === "acknowledgment") {
    messages.push(`Query ${query.queryId} pending acknowledgment for ${breach.timeData.hours} hours`);
    recipients.push({ role: "Pradhan", message: messages[0] });
  }

  if (breach.type === "resolution") {
    messages.push(`Query ${query.queryId} overdue by ${breach.timeData.days} days`);
    recipients.push({ role: "BDO", message: messages[0] });
    recipients.push({ role: "Pradhan", message: messages[0] });
  }

  return { recipients, messages };
}

export function calculateSlaStatus(query) {
  const breach = checkSlaBreach(query);
  const sla = QUERY_SLA_MATRIX[query.category];

  let status = "on-track";
  let percentOverdue = 0;

  if (breach.breached) {
    status = "overdue";
    percentOverdue = (breach.timeData.days / sla.resolution) * 100;
  }

  return {
    status,
    percentOverdue: Math.min(percentOverdue, 100),
    breachInfo: breach
  };
}

export function getSlaStatusLabel(query) {
  const status = calculateSlaStatus(query);

  if (query.status === "Resolved" || query.status === "Rejected") {
    return "Completed";
  }

  if (status.status === "overdue") {
    return `Overdue by ${status.breachInfo.timeData.days} days`;
  }

  return `${status.breachInfo.timeData.days} days remaining`;
}

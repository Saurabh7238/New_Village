export const DEVELOPMENT_SCHEMES = [
  '15th Finance Commission',
  'MNREGA',
  'Gram Nidhi',
  'PMAY',
  'Swachh Bharat',
  'Jal Jeevan Mission',
  'PM-KISAN',
  'Other State Scheme',
  'Central Scheme',
  'Other'
];

export const DEVELOPMENT_STATUSES = ['Sanctioned', 'Ongoing', 'Completed', 'On Hold'];

export function getStatusColor(status) {
  const colors = {
    'Sanctioned': 'blue',
    'Ongoing': 'green',
    'Completed': 'emerald',
    'On Hold': 'amber'
  };
  return colors[status] || 'gray';
}

export function getStatusBgClass(status) {
  const classes = {
    'Sanctioned': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Ongoing': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Completed': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    'On Hold': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

export function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatCurrency(amount) {
  if (!amount) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function calculateDaysRemaining(expectedDate) {
  const today = new Date();
  const expected = new Date(expectedDate);
  const diff = expected - today;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

export function groupByScheme(projects) {
  const grouped = {};
  projects.forEach(project => {
    if (!grouped[project.scheme]) {
      grouped[project.scheme] = [];
    }
    grouped[project.scheme].push(project);
  });
  return grouped;
}

export function groupByWard(projects) {
  const grouped = {};
  projects.forEach(project => {
    const wardKey = `Ward ${project.wardNo}`;
    if (!grouped[wardKey]) {
      grouped[wardKey] = [];
    }
    grouped[wardKey].push(project);
  });

  // Sort wards numerically
  const sorted = {};
  Object.keys(grouped).sort((a, b) => {
    const numA = parseInt(a.split(' ')[1]);
    const numB = parseInt(b.split(' ')[1]);
    return numA - numB;
  }).forEach(key => {
    sorted[key] = grouped[key];
  });

  return sorted;
}

export function sortByProgress(projects) {
  return [...projects].sort((a, b) => b.physicalProgress - a.physicalProgress);
}

export function getProgressColor(progress) {
  if (progress >= 80) return 'emerald';
  if (progress >= 60) return 'green';
  if (progress >= 40) return 'yellow';
  if (progress >= 20) return 'orange';
  return 'red';
}

export function getProgressBarClass(progress) {
  if (progress >= 80) return 'bg-emerald-500';
  if (progress >= 60) return 'bg-green-500';
  if (progress >= 40) return 'bg-yellow-500';
  if (progress >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

export const INFRA_TYPES = [
  "Street Light",
  "Water Pump",
  "Road",
  "Solar Panel",
  "Primary School",
  "Primary Health Center",
  "Sanitation Unit",
  "Community Hall",
  "Water Tank",
  "Irrigation Project",
  "Internet Coverage",
  "River Monitoring",
  "Other",
];

export const INFRA_STATUSES = [
  "Operational",
  "Under Maintenance",
  "Broken",
  "Planned",
];

export const INFRA_CATEGORIES = [
  {
    type: "Primary Health Center",
    slug: "health-centers",
    title: "Primary Health Centers",
    description: "Health center facilities and capacity across the village.",
    hubLabel: "Primary Health Centers",
  },
  {
    type: "Primary School",
    slug: "schools",
    title: "Government Schools",
    description:
      "Overview of government schools including facilities and enrollment.",
    hubLabel: "Government Schools",
  },
  {
    type: "Sanitation Unit",
    slug: "sanitation-units",
    title: "Sanitation Units",
    description: "Sanitation units built across the village under panchayat schemes.",
    hubLabel: "Sanitation Units Built",
  },
  {
    type: "Community Hall",
    slug: "community-halls",
    title: "Community Halls",
    description: "Community halls and public gathering spaces in the village.",
    hubLabel: "Community Hall",
  },
  {
    type: "Water Pump",
    slug: "water-pumps",
    title: "Handpumps & Wells",
    description: "Handpumps, wells, and water supply infrastructure.",
    hubLabel: "Handpumps & Wells",
  },
  {
    type: "Water Tank",
    slug: "water-tanks",
    title: "Water Tanks",
    description: "Water tanks installed across the panchayat area.",
    hubLabel: "Water Tanks Installed",
  },
  {
    type: "Irrigation Project",
    slug: "irrigation-projects",
    title: "Irrigation Projects",
    description: "Canals, rainwater harvesting, and irrigation initiatives.",
    hubLabel: "Irrigation Projects",
  },
  {
    type: "Road",
    slug: "roads",
    title: "Roads & Connectivity",
    description: "Village roads and connectivity projects.",
    hubLabel: "Roads Maintained",
  },
  {
    type: "Street Light",
    slug: "street-lights",
    title: "Street Light Installations",
    description: "Street lights installed across the village.",
    hubLabel: "Street Lights Installed",
  },
  {
    type: "Solar Panel",
    slug: "solar-panels",
    title: "Solar Panel Installations",
    description: "Solar energy projects across the panchayat.",
    hubLabel: "Solar Panels",
  },
  {
    type: "Internet Coverage",
    slug: "internet-coverage",
    title: "Internet Coverage",
    description: "CSC centers, towers, and digital connectivity in the village.",
    hubLabel: "Internet Coverage",
  },
  {
    type: "River Monitoring",
    slug: "rivers",
    title: "Rivers Monitored",
    description: "Rivers and water bodies monitored under the panchayat.",
    hubLabel: "Rivers Monitored",
  },
  {
    type: "Other",
    slug: "other",
    title: "Other Infrastructure",
    description: "Additional panchayat infrastructure and development items.",
    hubLabel: "Other Infrastructure",
  },
];

/** Hub page layout — every card maps to an admin-manageable type */
export const INFRA_HUB_SECTIONS = [
  {
    title: "Public Facilities",
    types: [
      "Primary Health Center",
      "Primary School",
      "Sanitation Unit",
      "Community Hall",
    ],
  },
  {
    title: "Water & Irrigation",
    types: ["Water Pump", "Water Tank", "Irrigation Project"],
  },
  {
    title: "Connectivity & Energy",
    types: ["Road", "Street Light", "Solar Panel", "Internet Coverage"],
  },
  {
    title: "Water Bodies",
    types: ["River Monitoring"],
  },
];

export function getInfraCategoryBySlug(slug) {
  return INFRA_CATEGORIES.find((c) => c.slug === slug);
}

export function getInfraCategoryByType(type) {
  return INFRA_CATEGORIES.find((c) => c.type === type);
}

export function formatInfraCost(cost) {
  return cost ? `₹${Number(cost).toLocaleString("en-IN")}` : "N/A";
}

export function formatInfraDate(date) {
  return date ? new Date(date).toLocaleDateString() : "N/A";
}

export function countByInfraType(items) {
  const counts = Object.fromEntries(INFRA_TYPES.map((t) => [t, 0]));
  for (const item of items) {
    if (counts[item.type] !== undefined) counts[item.type]++;
  }
  return counts;
}

export function formatInfraCount(count) {
  if (count === 0) return "No records yet — add from admin panel";
  if (count === 1) return "1 record";
  return `${count} records`;
}

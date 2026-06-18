export const MEMBER_DESIGNATIONS = [
  'Gram Pradhan',
  'Up-Pradhan',
  'Panchayat Secretary',
  'Ward Member',
  'Rozgar Sevak',
  'Panchayat Sahayak',
  'Other'
];

export const MEMBER_STATUSES = ['Active', 'Inactive', 'Ex-Member'];

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export const CATEGORY_OPTIONS = ['General', 'OBC', 'SC', 'ST'];

// Designation hierarchy for display ordering
export const DESIGNATION_HIERARCHY = {
  'Gram Pradhan': 1,
  'Up-Pradhan': 2,
  'Panchayat Secretary': 3,
  'Ward Member': 4,
  'Rozgar Sevak': 5,
  'Panchayat Sahayak': 6,
  'Other': 7
};

export function getSortOrder(member) {
  const hierarchyOrder = DESIGNATION_HIERARCHY[member.designation] || 999;
  return { hierarchy: hierarchyOrder, display: member.displayOrder };
}

export function sortMembersByHierarchy(members) {
  return [...members].sort((a, b) => {
    const aHierarchy = DESIGNATION_HIERARCHY[a.designation] || 999;
    const bHierarchy = DESIGNATION_HIERARCHY[b.designation] || 999;

    if (aHierarchy !== bHierarchy) {
      return aHierarchy - bHierarchy;
    }

    return (a.displayOrder || 999) - (b.displayOrder || 999);
  });
}

export function groupMembersByRole(members) {
  const sorted = sortMembersByHierarchy(members);
  const grouped = {};

  sorted.forEach(member => {
    if (!grouped[member.designation]) {
      grouped[member.designation] = [];
    }
    grouped[member.designation].push(member);
  });

  return grouped;
}

export function groupWardMembersByWard(wardMembers) {
  const grouped = {};

  wardMembers.forEach(member => {
    const wardNo = member.wardNo || 'Unassigned';
    if (!grouped[wardNo]) {
      grouped[wardNo] = [];
    }
    grouped[wardNo].push(member);
  });

  return grouped;
}

export function formatTenure(startDate, endDate) {
  const start = new Date(startDate).getFullYear();
  const end = new Date(endDate).getFullYear();
  return `${start}-${end}`;
}

export function isActiveMember(member) {
  return member.status === 'Active';
}

export function getStatusColor(status) {
  const colors = {
    'Active': 'green',
    'Inactive': 'yellow',
    'Ex-Member': 'gray'
  };
  return colors[status] || 'gray';
}

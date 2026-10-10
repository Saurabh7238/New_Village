const SERVICE_CHANGE_ROUTES = [
  { pattern: /^\/api\/admin\/applications$/, methods: ["PUT", "DELETE"] },
  { pattern: /^\/api\/admin\/appointments$/, methods: ["PUT", "PATCH", "DELETE"] },
  { pattern: /^\/api\/admin\/bulk-actions$/, methods: ["PATCH"] },
  { pattern: /^\/api\/admin\/chat-tickets$/, methods: ["PATCH"] },
  { pattern: /^\/api\/admin\/chats$/, methods: ["DELETE"] },
  { pattern: /^\/api\/admin\/development-reports$/, methods: ["PATCH"] },
  { pattern: /^\/api\/admin\/escalations$/, methods: ["POST"] },
  { pattern: /^\/api\/announcements$/, methods: ["POST"] },
  { pattern: /^\/api\/budget$/, methods: ["POST", "DELETE"] },
  { pattern: /^\/api\/development$/, methods: ["POST", "DELETE"] },
  { pattern: /^\/api\/development\/[^/]+\/updates$/, methods: ["POST"] },
  { pattern: /^\/api\/funds$/, methods: ["POST", "DELETE"] },
  { pattern: /^\/api\/images$/, methods: ["DELETE"] },
  { pattern: /^\/api\/infrastructure$/, methods: ["POST", "DELETE"] },
  { pattern: /^\/api\/members$/, methods: ["POST", "DELETE"] },
  { pattern: /^\/api\/notifications$/, methods: ["POST", "PUT", "DELETE"] },
  { pattern: /^\/api\/notifications\/[^/]+\/documents$/, methods: ["POST", "DELETE"] },
  { pattern: /^\/api\/queries\/[^/]+$/, methods: ["PUT", "DELETE"] },
  { pattern: /^\/api\/queries\/[^/]+\/messages$/, methods: ["POST"] },
  { pattern: /^\/api\/upload$/, methods: ["POST", "PUT"] },
  { pattern: /^\/api\/voter-data$/, methods: ["POST", "PUT", "DELETE"] },
];

const MAIN_ADMIN_ONLY_PAGES = [
  /^\/admin\/users(?:\/|$)/,
  /^\/admin\/home(?:\/|$)/,
  /^\/admin\/reviews(?:\/|$)/,
  /^\/admin\/activity-log(?:\/|$)/,
  /^\/admin\/debug-voters(?:\/|$)/,
  /^\/admin\/documents(?:\/|$)/,
  /^\/admin\/subadmins(?:\/|$)/,
  /^\/admin\/service-changes(?:\/|$)/,
];

const MAIN_ADMIN_ONLY_APIS = [
  /^\/api\/admin\/service-changes$/,
  /^\/api\/admin\/service-change-submit(?:\/|$)/,
  /^\/api\/admin\/subadmins$/,
  /^\/api\/admin\/users(?:\/|$)/,
  /^\/api\/admin\/home-settings$/,
  /^\/api\/admin\/activity-log$/,
  /^\/api\/admin\/analytics$/,
  /^\/api\/admin\/citizen-documents(?:\/|$)/,
  /^\/api\/reviews(?:\/|$)/,
  /^\/api\/import-gram-panchayat-voters$/,
  /^\/api\/migrate-voters$/,
];

export function isServiceChangeRoute(pathname, method) {
  const normalizedMethod = String(method).toUpperCase();
  return SERVICE_CHANGE_ROUTES.some(
    ({ pattern, methods }) => pattern.test(pathname) && methods.includes(normalizedMethod)
  );
}

export function isServiceChangePath(path) {
  try {
    const parsed = new URL(path, "http://localhost");
    return parsed.origin === "http://localhost"
      && SERVICE_CHANGE_ROUTES.some(({ pattern }) => pattern.test(parsed.pathname));
  } catch {
    return false;
  }
}

export function isMainAdminOnlyPage(pathname) {
  return MAIN_ADMIN_ONLY_PAGES.some((pattern) => pattern.test(pathname));
}

export function isMainAdminOnlyApi(pathname) {
  return MAIN_ADMIN_ONLY_APIS.some((pattern) => pattern.test(pathname));
}

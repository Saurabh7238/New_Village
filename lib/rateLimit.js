import Query from "@/models/Query";

export async function checkQueryRateLimit(mobile) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await Query.countDocuments({
      mobile: mobile,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const allowed = count < 3;
    const remaining = Math.max(0, 3 - count);
    const limit = 3;
    const totalToday = count;

    return {
      allowed,
      remaining,
      totalToday,
      limit,
      resetTime: tomorrow.toISOString()
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    return {
      allowed: false,
      remaining: 0,
      totalToday: 0,
      limit: 3,
      resetTime: new Date().toISOString()
    };
  }
}

export function formatRateLimitMessage(rateLimitInfo) {
  if (!rateLimitInfo.allowed) {
    return `You have reached your daily limit of ${rateLimitInfo.limit} queries. Try again tomorrow.`;
  }
  return `You have ${rateLimitInfo.remaining} queries remaining for today.`;
}

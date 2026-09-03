import AuditLog from '@/models/AuditLog';
import User from '@/models/User';

export async function writeAuditLog({ session, action, details = {}, entityType = null, entityId = null }) {
  try {
    const userId = session?.user?.id || null;
    const userName = session?.user?.name || null;
    const userEmail = session?.user?.email || null;
    let uniqueId = session?.user?.uniqueId || null;

    if (userId && !uniqueId) {
      const user = await User.findById(userId).select('uniqueId name email').lean();
      uniqueId = user?.uniqueId || null;
    }

    await AuditLog.create({
      userId: userId || null,
      userName: userName || null,
      userEmail: userEmail || null,
      uniqueId: uniqueId || 'system',
      action,
      entityType,
      entityId: entityId || details?.applicationId || details?.queryId || details?.id || null,
      details,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

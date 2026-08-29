import AuditLog from '@/models/AuditLog';

export async function writeAuditLog({ session, action, details = {} }) {
  try {
    await AuditLog.create({
      uniqueId: session?.user?.id || 'system',
      action,
      details,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

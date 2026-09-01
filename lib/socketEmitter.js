/**
 * Socket.io Event Emitter Utility
 * 
 * This utility allows API routes to emit Socket.io events to connected clients.
 * It communicates with the standalone Socket.io server via HTTP.
 * 
 * Usage:
 *   import { emitToUser } from '@/lib/socketEmitter';
 *   await emitToUser(userId, 'APPLICATION_UPDATED', { status: 'Approved' });
 */

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
const SOCKET_SECRET = process.env.SOCKET_SECRET || 'dev-secret-key-change-in-production';

/**
 * Emit an event to a specific user
 * @param {string} userId - The user ID to emit to
 * @param {string} eventName - The Socket.io event name
 * @param {object} data - Event data to send
 */
export async function emitToUser(userId, eventName, data) {
  if (!userId || !eventName) {
    console.warn('emitToUser: Missing userId or eventName');
    return;
  }

  try {
    const response = await fetch(`${SOCKET_SERVER_URL}/api/emit-to-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-socket-secret': SOCKET_SECRET,
      },
      body: JSON.stringify({ userId, eventName, data }),
    });

    if (!response.ok) {
      console.warn(`Socket emit failed: ${response.status} ${response.statusText}`);
      return;
    }

    const result = await response.json();
    console.log(`[Socket] Emitted '${eventName}' to user ${userId}`);
    return result;
  } catch (error) {
    // Silently fail if Socket.io server is not available
    console.warn(`[Socket] Failed to emit event: ${error.message}`);
  }
}

/**
 * Broadcast an event to all connected users
 * @param {string} eventName - The Socket.io event name
 * @param {object} data - Event data to send
 */
export async function broadcastEvent(eventName, data) {
  if (!eventName) {
    console.warn('broadcastEvent: Missing eventName');
    return;
  }

  try {
    const response = await fetch(`${SOCKET_SERVER_URL}/api/broadcast-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-socket-secret': SOCKET_SECRET,
      },
      body: JSON.stringify({ eventName, data }),
    });

    if (!response.ok) {
      console.warn(`Socket broadcast failed: ${response.status} ${response.statusText}`);
      return;
    }

    const result = await response.json();
    console.log(`[Socket] Broadcasted '${eventName}' to all users`);
    return result;
  } catch (error) {
    console.warn(`[Socket] Failed to broadcast event: ${error.message}`);
  }
}

/**
 * Emit an event to all admins
 * @param {string} eventName - The Socket.io event name
 * @param {object} data - Event data to send
 */
export async function emitToAdmins(eventName, data) {
  if (!eventName) {
    console.warn('emitToAdmins: Missing eventName');
    return;
  }

  try {
    const response = await fetch(`${SOCKET_SERVER_URL}/api/emit-to-admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-socket-secret': SOCKET_SECRET,
      },
      body: JSON.stringify({ eventName, data }),
    });

    if (!response.ok) {
      console.warn(`Socket emit to admins failed: ${response.status} ${response.statusText}`);
      return;
    }

    const result = await response.json();
    console.log(`[Socket] Emitted '${eventName}' to all admins`);
    return result;
  } catch (error) {
    console.warn(`[Socket] Failed to emit to admins: ${error.message}`);
  }
}

/**
 * Emit APPLICATION_UPDATED event - called when admin updates application status
 */
export async function emitApplicationUpdated(application) {
  await emitToUser(application.userId.toString(), 'APPLICATION_UPDATED', {
    applicationId: application._id.toString(),
    applicationNumber: application.applicationNumber,
    serviceType: application.serviceType,
    status: application.status,
    adminRemarks: application.adminRemarks,
    updatedAt: application.updatedAt,
  });
}

/**
 * Emit DOCUMENT_REQUESTED event - called when admin requests more documents
 */
export async function emitDocumentRequested(application, requestedDocuments) {
  await emitToUser(application.userId.toString(), 'DOCUMENT_REQUESTED', {
    applicationId: application._id.toString(),
    applicationNumber: application.applicationNumber,
    serviceType: application.serviceType,
    requestedDocuments,
    adminRemarks: application.adminRemarks,
    message: `Please upload the following documents: ${requestedDocuments.join(', ')}`,
  });
}

/**
 * Emit ESCALATION_ALERT event - called when a query is escalated
 */
export async function emitEscalationAlert(escalation, query) {
  await emitToUser(query.userId.toString(), 'ESCALATION_ALERT', {
    escalationId: escalation._id.toString(),
    queryId: query._id.toString(),
    queryTitle: query.title,
    reason: escalation.reason,
    escalationLevel: escalation.escalationLevel,
    createdAt: escalation.createdAt,
    message: `Your query has been escalated: ${escalation.reason}`,
  });

  // Also notify admins
  await emitToAdmins('QUERY_ESCALATED', {
    escalationId: escalation._id.toString(),
    queryId: query._id.toString(),
    userId: query.userId.toString(),
    queryTitle: query.title,
    reason: escalation.reason,
    escalationLevel: escalation.escalationLevel,
  });
}

/**
 * Emit QUERY_UPDATED event - called when admin responds to query
 */
export async function emitQueryUpdated(query, lastMessage) {
  await emitToUser(query.userId.toString(), 'QUERY_UPDATED', {
    queryId: query._id.toString(),
    title: query.title,
    status: query.status,
    lastMessage: lastMessage?.message,
    lastMessageBy: lastMessage?.senderRole,
    updatedAt: query.updatedAt,
  });
}

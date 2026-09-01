// Socket.io client utilities for real-time notifications
export function getSocketIO() {
  if (typeof window === 'undefined') return null;
  
  // Check if socket.io is already loaded
  if (window.io) {
    return window.io;
  }
  
  // Otherwise return null (socket will be loaded dynamically)
  return null;
}

// Initialize socket connection
export function initSocket() {
  if (typeof window === 'undefined') return null;

  // Load socket.io client
  const script = document.createElement('script');
  script.src = '/socket.io/socket.io.js';
  script.async = true;

  return new Promise((resolve) => {
    script.onload = () => {
      if (window.io) {
        const socket = window.io(undefined, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
          console.log('Connected to real-time server');
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from real-time server');
        });

        resolve(socket);
      } else {
        resolve(null);
      }
    };

    script.onerror = () => {
      resolve(null);
    };

    document.head.appendChild(script);
  });
}

// Notification handlers
export const notificationHandlers = {
  APPLICATION_SUBMITTED: 'application:submitted',
  APPLICATION_UPDATED: 'application:updated',
  STATUS_CHANGED: 'status:changed',
  DOCUMENT_REQUESTED: 'document:requested',
  QUERY_UPDATED: 'query:updated',
  APPOINTMENT_REMINDER: 'appointment:reminder',
  ESCALATION_ALERT: 'escalation:alert',
};

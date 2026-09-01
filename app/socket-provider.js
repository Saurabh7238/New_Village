'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initSocket, notificationHandlers } from '@/lib/socketIO';
import { Bell, AlertCircle } from 'lucide-react';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const notif = { ...notification, id, timestamp: new Date() };
    setNotifications((prev) => [notif, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount((prev) => prev + 1);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    const setupSocket = async () => {
      const socketInstance = await initSocket();
      if (socketInstance) {
        setSocket(socketInstance);
        setIsConnected(true);

        // Listen for various notifications
        socketInstance.on(notificationHandlers.APPLICATION_SUBMITTED, (data) => {
          addNotification({
            type: 'success',
            title: 'New Application',
            message: `${data.applicantName} submitted a ${data.type} request`,
            data,
          });
        });

        socketInstance.on(notificationHandlers.APPLICATION_UPDATED, (data) => {
          addNotification({
            type: 'info',
            title: 'Application Updated',
            message: `Your ${data.type} is now ${data.status}`,
            data,
          });
        });

        socketInstance.on(notificationHandlers.DOCUMENT_REQUESTED, (data) => {
          addNotification({
            type: 'warning',
            title: 'Documents Requested',
            message: `Additional documents needed for your ${data.type}`,
            data,
          });
        });

        socketInstance.on(notificationHandlers.QUERY_UPDATED, (data) => {
          addNotification({
            type: 'info',
            title: 'Query Update',
            message: `Your query "${data.title}" has been updated to ${data.status}`,
            data,
          });
        });

        socketInstance.on(notificationHandlers.ESCALATION_ALERT, (data) => {
          addNotification({
            type: 'error',
            title: 'Escalation Alert',
            message: `Issue escalated: ${data.reason}`,
            data,
          });
        });

        socketInstance.on('disconnect', () => {
          setIsConnected(false);
        });

        socketInstance.on('connect', () => {
          setIsConnected(true);
        });

        return () => {
          socketInstance.disconnect();
        };
      }
    };

    setupSocket();
  }, [addNotification]);

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, notifications, unreadCount, addNotification, clearNotification, markAsRead }}
    >
      {children}
      <NotificationCenter />
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}

// Notification Center Component
function NotificationCenter() {
  const { notifications } = useSocket();

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md pointer-events-none sm:top-24">
      {notifications.map((notif) => (
        <NotificationToast key={notif.id} notification={notif} />
      ))}
    </div>
  );
}

function NotificationToast({ notification }) {
  const { clearNotification } = useSocket();
  const bgColor = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  }[notification.type];

  const Icon = notification.type === 'error' ? AlertCircle : Bell;

  return (
    <div
      className={`${bgColor} text-white p-4 rounded-lg shadow-lg pointer-events-auto flex items-start gap-3 animate-in slide-in-from-top`}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{notification.title}</p>
        <p className="text-xs opacity-90 mt-1">{notification.message}</p>
      </div>
      <button
        onClick={() => clearNotification(notification.id)}
        className="flex-shrink-0 hover:opacity-70 ml-2"
      >
        ✕
      </button>
    </div>
  );
}

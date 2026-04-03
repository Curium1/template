import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { AppNotification, TodoStatus } from './types';

interface NotificationContextValue {
  /** All notifications (newest first) */
  notifications: AppNotification[];

  /** Count of bell-visible notifications (unread + not muted) */
  bellCount: number;

  /** Push a new notification — id is auto-generated if omitted */
  push: (n: Omit<AppNotification, 'id' | 'read' | 'status' | 'muted' | 'createdAt'> & {
    id?: string;
    createdAt?: Date;
    status?: TodoStatus;
  }) => void;

  /** Mark a single notification as read (removes from bell) */
  markAsRead: (id: string) => void;

  /** Mark all bell-visible notifications as read */
  markAllAsRead: () => void;

  /** Mute a notification (removes from bell, keeps in todo) */
  mute: (id: string) => void;

  /** Change todo status */
  setStatus: (id: string, status: TodoStatus) => void;

  /** Remove a notification entirely */
  dismiss: (id: string) => void;

  /** Clear all notifications */
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

let idCounter = 0;
function generateId(): string {
  return `notif_${Date.now()}_${++idCounter}`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const push = useCallback(
    (input: Omit<AppNotification, 'id' | 'read' | 'status' | 'muted' | 'createdAt'> & {
      id?: string;
      createdAt?: Date;
      status?: TodoStatus;
    }) => {
      const notification: AppNotification = {
        ...input,
        id: input.id ?? generateId(),
        read: false,
        status: input.status ?? 'new',
        muted: false,
        createdAt: input.createdAt ?? new Date(),
      };

      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => (!n.read && !n.muted ? { ...n, read: true } : n)),
    );
  }, []);

  const mute = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, muted: true, read: true } : n)),
    );
  }, []);

  const setStatus = useCallback((id: string, status: TodoStatus) => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        // Moving to done also marks as read
        const read = status === 'done' ? true : n.read;
        return { ...n, status, read };
      }),
    );
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const bellCount = notifications.filter(n => !n.read && !n.muted).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, bellCount, push, markAsRead, markAllAsRead, mute, setStatus, dismiss, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}

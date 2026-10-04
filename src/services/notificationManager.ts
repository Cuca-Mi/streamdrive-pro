import { PushNotificationItem } from '../types';

type NotificationListener = (notifications: PushNotificationItem[]) => void;

class NotificationManager {
  private notifications: PushNotificationItem[] = [
    {
      id: 'notif-1',
      title: 'Alerta de Tráfego em Tempo Real',
      message: 'Congestionamento evitado via rota inteligente na Av. Paulista (-8 min economizados).',
      type: 'traffic',
      time: 'Agora',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Transmissão Ao Vivo Iniciada',
      message: 'Extreme Sports 4K iniciou transmissão especial com buffer anti-travamento ativo.',
      type: 'stream',
      time: 'Há 5 min',
      read: false,
    },
    {
      id: 'notif-3',
      title: 'Radar de Velocidade à Frente',
      message: 'Fiscalização eletrônica limite 60 km/h a 400m de distância.',
      type: 'radar',
      time: 'Há 12 min',
      read: true,
    },
  ];
  private listeners: Set<NotificationListener> = new Set();
  private unreadCount: number = 2;

  constructor() {
    this.requestBrowserPermission();
  }

  public async requestBrowserPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (_) {}
    }
  }

  public subscribe(fn: NotificationListener) {
    this.listeners.add(fn);
    fn(this.notifications);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.unreadCount = this.notifications.filter((n) => !n.read).length;
    this.listeners.forEach((fn) => fn(this.notifications));
  }

  public getNotifications(): PushNotificationItem[] {
    return this.notifications;
  }

  public getUnreadCount(): number {
    return this.unreadCount;
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.notify();
  }

  public pushNotification(item: Omit<PushNotificationItem, 'id' | 'time' | 'read'>) {
    const fullItem: PushNotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      time: 'Agora',
      read: false,
    };
    this.notifications.unshift(fullItem);
    if (this.notifications.length > 20) this.notifications.pop();

    // Trigger browser native notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(item.title, {
          body: item.message,
          icon: '/favicon.ico',
        });
      } catch (_) {}
    }

    this.notify();
  }
}

export const notificationManager = new NotificationManager();

import { Channel, Favorite } from '../types';

const OFFLINE_FAVORITES_KEY = 'streamdrive_offline_favorites';
const WATCH_HISTORY_KEY = 'streamdrive_watch_history';

export class OfflineStorageService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private onlineListeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyOnlineChange(true);
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyOnlineChange(false);
      });
    }
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public subscribeOnline(fn: (online: boolean) => void) {
    this.onlineListeners.add(fn);
    fn(this.isOnline);
    return () => {
      this.onlineListeners.delete(fn);
    };
  }

  private notifyOnlineChange(online: boolean) {
    this.onlineListeners.forEach((fn) => fn(online));
  }

  public getOfflineFavorites(): Favorite[] {
    try {
      const data = localStorage.getItem(OFFLINE_FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveOfflineFavorite(favorite: Favorite): void {
    try {
      const list = this.getOfflineFavorites();
      const exists = list.some((item) => item.channelId === favorite.channelId);
      if (!exists) {
        list.push({ ...favorite, savedOffline: true });
        localStorage.setItem(OFFLINE_FAVORITES_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('[OfflineStorage] Error saving favorite offline:', e);
    }
  }

  public removeOfflineFavorite(channelId: string): void {
    try {
      const list = this.getOfflineFavorites().filter((item) => item.channelId !== channelId);
      localStorage.setItem(OFFLINE_FAVORITES_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[OfflineStorage] Error removing favorite offline:', e);
    }
  }

  public isChannelSavedOffline(channelId: string): boolean {
    return this.getOfflineFavorites().some((item) => item.channelId === channelId);
  }

  public logWatchHistory(channel: Channel) {
    try {
      const historyStr = localStorage.getItem(WATCH_HISTORY_KEY);
      let history: { channelId: string; title: string; time: string }[] = historyStr ? JSON.parse(historyStr) : [];
      history = history.filter((h) => h.channelId !== channel.id);
      history.unshift({ channelId: channel.id, title: channel.title, time: new Date().toISOString() });
      if (history.length > 30) history.pop();
      localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
    } catch (_) {}
  }
}

export const offlineStorage = new OfflineStorageService();

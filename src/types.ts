export type StreamType = 'hls' | 'mp4' | 'webm' | 'embed' | 'xtream';

export interface Channel {
  id: string;
  title: string;
  url: string;
  streamType: StreamType;
  category: string;
  logoUrl?: string;
  resolution?: string;
  bufferTargetSec?: number;
  isCustom?: boolean;
  ownerId: string;
  viewsCount?: number;
  createdAt: string;
  description?: string;
  backupUrls?: string[];
}

export interface Favorite {
  id: string;
  userId: string;
  channelId: string;
  title: string;
  url: string;
  category?: string;
  logoUrl?: string;
  savedOffline?: boolean;
  createdAt?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  role?: 'admin' | 'user';
  nightMode?: 'auto' | 'dark' | 'light' | 'car-night-drive';
  highContrast?: boolean;
  fontSize?: 'normal' | 'large' | 'extra-large';
  voiceCommandsEnabled?: boolean;
  voiceFeedbackEnabled?: boolean;
  offlineFavoritesEnabled?: boolean;
  bluetoothAutoconnect?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StreamMetrics {
  id?: string;
  userId?: string;
  channelId: string;
  channelTitle?: string;
  bufferLengthSec: number;
  bitrateKbps: number;
  droppedFrames: number;
  latencyMs: number;
  stallCount: number;
  connectionSpeedKbps?: number;
  isHealthy: boolean;
  fps?: number;
  resolution?: string;
  gpsActive?: boolean;
  timestamp: string;
}

export interface AdminReportData {
  id: string;
  generatedBy: string;
  totalPlays: number;
  avgBufferSec: number;
  uptimePercent: number;
  totalStalls: number;
  activeUsers: number;
  generatedAt: string;
  topChannels: { title: string; count: number }[];
}

export interface NavDestination {
  id: string;
  name: string;
  category: 'gas' | 'parking' | 'food' | 'hospital' | 'home' | 'work';
  distanceKm: number;
  etaMinutes: number;
  lat: number;
  lng: number;
  address: string;
}

export interface PushNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'traffic' | 'stream' | 'system' | 'radar';
  time: string;
  read: boolean;
}

export interface BluetoothDeviceInfo {
  name: string;
  connected: boolean;
  deviceType: 'car_audio' | 'headphone' | 'speaker' | 'dash';
  batteryLevel?: number;
}

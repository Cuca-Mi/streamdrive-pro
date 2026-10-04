import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, signInWithPopup, googleProvider, signOut, handleFirestoreError, OperationType } from './firebase/config';
import { Channel, Favorite, BluetoothDeviceInfo, PushNotificationItem } from './types';
import { INITIAL_CHANNELS } from './data/defaultChannels';
import { StreamPlayer } from './components/StreamPlayer';
import { ChannelSidebar } from './components/ChannelSidebar';
import { HeaderNav } from './components/HeaderNav';
import { GpsDashboard } from './components/GpsDashboard';
import { XtreamModal } from './components/XtreamModal';
import { AdminReportModal } from './components/AdminReportModal';
import { AccessibilityModal, NightModeOption } from './components/AccessibilityModal';
import { CarDashboardMode } from './components/CarDashboardMode';
import { bluetoothCarAudio } from './services/bluetoothCarAudio';
import { voiceAssistant, VoiceAction } from './services/voiceAssistant';
import { navigationGps } from './services/navigationGps';
import { offlineStorage } from './services/offlineStorage';
import { notificationManager } from './services/notificationManager';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Channels state
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem('streamdrive_custom_channels');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...INITIAL_CHANNELS, ...parsed];
      }
    } catch (_) {}
    return INITIAL_CHANNELS;
  });
  const [selectedChannel, setSelectedChannel] = useState<Channel>(INITIAL_CHANNELS[0]);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    return offlineStorage.getOfflineFavorites().map((f) => f.channelId);
  });

  // Navigation & GPS state
  const [isSplitGps, setIsSplitGps] = useState<boolean>(false);
  const [isGpsModalOpen, setIsGpsModalOpen] = useState<boolean>(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(48);

  // Bluetooth Car Audio state
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDeviceInfo | null>(
    bluetoothCarAudio.getConnectedDevice()
  );

  // Voice Assistant state
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  // Driving & Car Mode
  const [isCarMode, setIsCarMode] = useState<boolean>(false);

  // Push Notifications state
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

  // Modals
  const [isXtreamModalOpen, setIsXtreamModalOpen] = useState<boolean>(false);
  const [isAdminReportOpen, setIsAdminReportOpen] = useState<boolean>(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState<boolean>(false);

  // Accessibility & Theme
  const [nightMode, setNightMode] = useState<NightModeOption>('auto');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [voiceFeedback, setVoiceFeedback] = useState<boolean>(true);

  // Connectivity
  const [isOnline, setIsOnline] = useState<boolean>(offlineStorage.getIsOnline());

  // Listen for Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      const isUserAdmin = currentUser?.email === 'cucamiguilito@gmail.com';
      setIsAdmin(isUserAdmin);

      if (currentUser) {
        // Sync user favorites from Firestore if online
        try {
          const favsRef = collection(db, 'users', currentUser.uid, 'favorites');
          const unsubFavs = onSnapshot(
            favsRef,
            (snap) => {
              const favIds = snap.docs.map((d) => d.data().channelId);
              if (favIds.length > 0) {
                setFavorites(favIds);
              }
            },
            (err) => {
              console.warn('[Firebase] Favorites snapshot fallback:', err.message);
            }
          );
          return () => unsubFavs();
        } catch (_) {}
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for online/offline & Notifications
  useEffect(() => {
    const unsubOnline = offlineStorage.subscribeOnline((online) => setIsOnline(online));
    const unsubNotifs = notificationManager.subscribe((notifs) => {
      setNotifications(notifs);
      setUnreadNotifsCount(notificationManager.getUnreadCount());
    });
    const unsubGps = navigationGps.subscribeLocation((loc) => {
      setCurrentSpeed(loc.speedKmH);
    });

    return () => {
      unsubOnline();
      unsubNotifs();
      unsubGps();
    };
  }, []);

  // Handle Voice Assistant Actions
  const handleVoiceAction = useCallback(
    (action: VoiceAction, transcript: string) => {
      setVoiceTranscript(transcript);

      switch (action.type) {
        case 'NEXT_CHANNEL':
          handleNextChannel();
          break;
        case 'PREV_CHANNEL':
          handlePrevChannel();
          break;
        case 'OPEN_GPS':
          setIsSplitGps(true);
          break;
        case 'CLOSE_GPS':
          setIsSplitGps(false);
          setIsGpsModalOpen(false);
          break;
        case 'CAR_MODE':
          setIsCarMode(true);
          break;
        case 'NIGHT_MODE':
          setNightMode('car-night-drive');
          break;
        case 'TOGGLE_FAVORITE':
          handleToggleFavorite(selectedChannel);
          break;
        case 'SWITCH_CHANNEL':
          if (action.payload) {
            const query = action.payload.toLowerCase();
            const found = channels.find((c) => c.title.toLowerCase().includes(query));
            if (found) {
              setSelectedChannel(found);
              voiceAssistant.speak(`Sintonizando ${found.title}`);
            }
          }
          break;
        case 'NAVIGATE_TO':
          setIsSplitGps(true);
          const pois = navigationGps.getNearbyPOIs();
          if (pois.length > 0) {
            navigationGps.calculateRoute(pois[0]);
          }
          break;
        default:
          break;
      }
    },
    [channels, selectedChannel]
  );

  const toggleVoiceAssistant = () => {
    if (isVoiceActive) {
      voiceAssistant.stopListening();
      setIsVoiceActive(false);
    } else {
      const ok = voiceAssistant.startListening((action, text) => {
        handleVoiceAction(action, text);
      });
      setIsVoiceActive(ok);
    }
  };

  // Channel switching handlers
  const handleNextChannel = () => {
    const currentIndex = channels.findIndex((c) => c.id === selectedChannel.id);
    const nextIndex = (currentIndex + 1) % channels.length;
    setSelectedChannel(channels[nextIndex]);
    if (voiceFeedback) voiceAssistant.speak(`Canal ${channels[nextIndex].title}`);
  };

  const handlePrevChannel = () => {
    const currentIndex = channels.findIndex((c) => c.id === selectedChannel.id);
    const prevIndex = (currentIndex - 1 + channels.length) % channels.length;
    setSelectedChannel(channels[prevIndex]);
    if (voiceFeedback) voiceAssistant.speak(`Canal ${channels[prevIndex].title}`);
  };

  // Favorite toggle with offline storage & Firebase Firestore
  const handleToggleFavorite = async (channel: Channel) => {
    const isFav = favorites.includes(channel.id);
    let nextFavorites: string[];

    if (isFav) {
      nextFavorites = favorites.filter((id) => id !== channel.id);
      offlineStorage.removeOfflineFavorite(channel.id);

      if (user) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'favorites', channel.id));
        } catch (_) {}
      }
    } else {
      nextFavorites = [...favorites, channel.id];
      const favObj: Favorite = {
        id: channel.id,
        userId: user ? user.uid : 'local_user',
        channelId: channel.id,
        title: channel.title,
        url: channel.url,
        category: channel.category,
        logoUrl: channel.logoUrl,
        savedOffline: true,
      };
      offlineStorage.saveOfflineFavorite(favObj);

      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'favorites', channel.id), favObj);
        } catch (_) {}
      }

      notificationManager.pushNotification({
        title: 'Favorito Salvo para Uso Offline',
        message: `${channel.title} foi armazenado no cache local do dispositivo.`,
        type: 'stream',
      });
    }

    setFavorites(nextFavorites);
  };

  // Add channel handler from Xtream / direct modal
  const handleAddChannel = (newChannel: Channel) => {
    const updated = [newChannel, ...channels];
    setChannels(updated);
    setSelectedChannel(newChannel);

    // Save custom channels to local storage
    try {
      const customChannels = updated.filter((c) => c.isCustom);
      localStorage.setItem('streamdrive_custom_channels', JSON.stringify(customChannels));
    } catch (_) {}

    notificationManager.pushNotification({
      title: 'Novo Canal Configurado',
      message: `${newChannel.title} pronto para reprodução com buffer inteligente.`,
      type: 'stream',
    });
  };

  // Bluetooth connection
  const handleConnectBluetooth = async () => {
    const dev = await bluetoothCarAudio.connectBluetooth();
    setBluetoothDevice(dev);
    voiceAssistant.speak('Sistema multimídia do carro conectado via Bluetooth.');
  };

  const handleDisconnectBluetooth = () => {
    bluetoothCarAudio.disconnect();
    setBluetoothDevice(null);
    voiceAssistant.speak('Áudio Bluetooth desconectado.');
  };

  // Firebase Google Login
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('[Firebase Auth] Popup error, fallback guest session:', err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Determine CSS classes for Night Mode & Accessibility
  const themeClass =
    nightMode === 'light'
      ? 'bg-neutral-100 text-neutral-900'
      : nightMode === 'car-night-drive'
      ? 'bg-black text-neutral-100 ring-1 ring-red-950/20'
      : 'bg-neutral-950 text-neutral-100';

  const contrastClass = highContrast ? 'contrast-125 border-neutral-600 font-medium' : '';
  const fontClass =
    fontSize === 'large'
      ? 'text-base'
      : fontSize === 'extra-large'
      ? 'text-lg'
      : 'text-sm';

  return (
    <div className={`min-h-screen flex flex-col ${themeClass} ${contrastClass} ${fontClass} transition-colors duration-300 font-sans`}>
      {/* Top Header */}
      <HeaderNav
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        bluetoothDevice={bluetoothDevice}
        onConnectBluetooth={handleConnectBluetooth}
        onDisconnectBluetooth={handleDisconnectBluetooth}
        isVoiceActive={isVoiceActive}
        onToggleVoice={toggleVoiceAssistant}
        onOpenGps={() => setIsSplitGps(!isSplitGps)}
        isCarMode={isCarMode}
        onToggleCarMode={() => setIsCarMode(!isCarMode)}
        notifications={notifications}
        unreadNotifsCount={unreadNotifsCount}
        onMarkNotificationsRead={() => notificationManager.markAllAsRead()}
        onOpenAdminReport={() => setIsAdminReportOpen(true)}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        currentSpeed={currentSpeed}
        isAdmin={isAdmin}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left: TV Channel Sidebar (responsive collapsible on mobile) */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 h-64 md:h-[calc(100vh-4rem)] border-b md:border-b-0">
          <ChannelSidebar
            channels={channels}
            selectedChannel={selectedChannel}
            onSelectChannel={(ch) => setSelectedChannel(ch)}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onOpenAddModal={() => setIsXtreamModalOpen(true)}
            isOnline={isOnline}
          />
        </div>

        {/* Center / Right: Dynamic Viewport (Single Player OR Split GPS & Stream) */}
        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden p-3 gap-3">
          {isSplitGps ? (
            /* Split View: Stream on Top/Left and Live GPS Navigation on Bottom/Right */
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 h-full overflow-hidden">
              <div className="h-full flex flex-col rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900">
                <StreamPlayer
                  channel={selectedChannel}
                  isFavorite={favorites.includes(selectedChannel.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onNextChannel={handleNextChannel}
                  onPrevChannel={handlePrevChannel}
                  onToggleSplitGps={() => setIsSplitGps(false)}
                  isSplitGps={true}
                />
              </div>
              <div className="h-full flex flex-col rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900">
                <GpsDashboard compact={false} onClose={() => setIsSplitGps(false)} />
              </div>
            </div>
          ) : (
            /* Full Single Stream View */
            <div className="flex-1 flex flex-col rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900">
              <StreamPlayer
                channel={selectedChannel}
                isFavorite={favorites.includes(selectedChannel.id)}
                onToggleFavorite={handleToggleFavorite}
                onNextChannel={handleNextChannel}
                onPrevChannel={handlePrevChannel}
                onToggleSplitGps={() => setIsSplitGps(true)}
                isSplitGps={false}
              />
            </div>
          )}
        </main>
      </div>

      {/* CarPlay / Android Auto Driving Mode Overlay */}
      {isCarMode && (
        <CarDashboardMode
          channel={selectedChannel}
          isFavorite={favorites.includes(selectedChannel.id)}
          onToggleFavorite={handleToggleFavorite}
          onNextChannel={handleNextChannel}
          onPrevChannel={handlePrevChannel}
          onExitCarMode={() => setIsCarMode(false)}
          isVoiceActive={isVoiceActive}
          onToggleVoice={toggleVoiceAssistant}
          bluetoothDevice={bluetoothDevice}
          onConnectBluetooth={handleConnectBluetooth}
          voiceTranscript={voiceTranscript}
        />
      )}

      {/* Modals */}
      <XtreamModal
        isOpen={isXtreamModalOpen}
        onClose={() => setIsXtreamModalOpen(false)}
        onAddChannel={handleAddChannel}
        userId={user ? user.uid : 'guest'}
      />

      <AdminReportModal
        isOpen={isAdminReportOpen}
        onClose={() => setIsAdminReportOpen(false)}
        channels={channels}
      />

      <AccessibilityModal
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        nightMode={nightMode}
        onChangeNightMode={setNightMode}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        voiceFeedback={voiceFeedback}
        onToggleVoiceFeedback={() => setVoiceFeedback(!voiceFeedback)}
      />
    </div>
  );
}

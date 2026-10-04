import React, { useState } from 'react';
import {
  Tv,
  Bluetooth,
  Mic,
  MicOff,
  Navigation,
  Bell,
  Sun,
  Moon,
  Eye,
  BarChart3,
  Car,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldAlert,
} from 'lucide-react';
import { BluetoothDeviceInfo, PushNotificationItem } from '../types';
import { User } from 'firebase/auth';

interface HeaderNavProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  bluetoothDevice: BluetoothDeviceInfo | null;
  onConnectBluetooth: () => void;
  onDisconnectBluetooth: () => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  onOpenGps: () => void;
  isCarMode: boolean;
  onToggleCarMode: () => void;
  notifications: PushNotificationItem[];
  unreadNotifsCount: number;
  onMarkNotificationsRead: () => void;
  onOpenAdminReport: () => void;
  onOpenAccessibility: () => void;
  currentSpeed: number;
  isAdmin: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  user,
  onLogin,
  onLogout,
  bluetoothDevice,
  onConnectBluetooth,
  onDisconnectBluetooth,
  isVoiceActive,
  onToggleVoice,
  onOpenGps,
  isCarMode,
  onToggleCarMode,
  notifications,
  unreadNotifsCount,
  onMarkNotificationsRead,
  onOpenAdminReport,
  onOpenAccessibility,
  currentSpeed,
  isAdmin,
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 px-4 bg-neutral-900/95 border-b border-neutral-800 flex items-center justify-between z-30 select-none backdrop-blur-md">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
          <Tv className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-white tracking-tight">StreamDrive</h1>
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-bold border border-indigo-500/30">
              PRO
            </span>
          </div>
          <p className="text-[10px] font-medium text-neutral-400">TV Stream & GPS Handsfree</p>
        </div>
      </div>

      {/* Automotive Quick Controls */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Bluetooth Car Audio status */}
        <button
          onClick={bluetoothDevice?.connected ? onDisconnectBluetooth : onConnectBluetooth}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition ${
            bluetoothDevice?.connected
              ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
              : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-400'
          }`}
          title="Conectar ao sistema de áudio Bluetooth do veículo"
        >
          <Bluetooth className={`w-4 h-4 ${bluetoothDevice?.connected ? 'text-blue-400 animate-pulse' : ''}`} />
          <span>{bluetoothDevice?.connected ? bluetoothDevice.name : 'Conectar Bluetooth'}</span>
        </button>

        {/* Handsfree Voice Assistant button */}
        <button
          onClick={onToggleVoice}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition ${
            isVoiceActive
              ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/30'
              : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-400'
          }`}
          title="Controle por voz mãos-livres para condução segura"
        >
          {isVoiceActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Ouvindo Comandos...</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-neutral-500" />
              <span>Voz Mãos-Livres</span>
            </>
          )}
        </button>

        {/* Real-time GPS & Speed button */}
        <button
          onClick={onOpenGps}
          className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold transition"
          title="Abrir mapa de navegação GPS em tempo real"
        >
          <Navigation className="w-4 h-4 text-blue-400" />
          <span>GPS</span>
          <span className="font-mono text-emerald-400 font-bold">{currentSpeed} km/h</span>
        </button>

        {/* Car Driving Mode Toggle */}
        <button
          onClick={onToggleCarMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold transition ${
            isCarMode
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border-amber-500'
              : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
          }`}
          title="Modo Condução Veicular (Painel Inteligente Otimizado)"
        >
          <Car className="w-4 h-4" />
          <span>Modo Carro</span>
        </button>
      </div>

      {/* Right Tools & User profile */}
      <div className="flex items-center gap-2">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              if (!showNotifDropdown) onMarkNotificationsRead();
            }}
            className="p-2.5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 transition relative"
            title="Notificações Push Personalizadas"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
                <span className="font-bold text-white">Notificações Push</span>
                <span className="text-[10px] text-neutral-400">Tempo Real</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-indigo-400 text-[11px]">{n.title}</span>
                      <span className="text-[10px] text-neutral-500">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-neutral-300">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Accessibility & Theme */}
        <button
          onClick={onOpenAccessibility}
          className="p-2.5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 transition"
          title="Opções de Acessibilidade e Modo Noturno Automático"
        >
          <Eye className="w-4 h-4 text-neutral-300" />
        </button>

        {/* Admin Dashboard */}
        <button
          onClick={onOpenAdminReport}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition ${
            isAdmin
              ? 'bg-purple-950/80 border-purple-500/60 text-purple-300'
              : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
          }`}
          title="Relatórios Detalhados de Desempenho do Administrador"
        >
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <span className="hidden md:inline">Admin</span>
        </button>

        {/* Firebase Login / User Profile */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 transition"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-7 h-7 rounded-xl object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-bold text-white max-w-[100px] truncate">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl p-3 z-50 text-xs">
                <div className="pb-2 mb-2 border-b border-neutral-800">
                  <p className="font-bold text-white truncate">{user.displayName || 'Usuário Autenticado'}</p>
                  <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                  {isAdmin && (
                    <span className="mt-1 inline-block px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold">
                      Administrador do Sistema
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-800 text-rose-400 text-xs font-semibold transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition"
          >
            <LogIn className="w-4 h-4" />
            <span>Login Firebase</span>
          </button>
        )}
      </div>
    </header>
  );
};

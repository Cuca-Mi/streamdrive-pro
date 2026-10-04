import React from 'react';
import { Channel } from '../types';
import { StreamPlayer } from './StreamPlayer';
import { GpsDashboard } from './GpsDashboard';
import {
  Car,
  Mic,
  MicOff,
  Bluetooth,
  Navigation,
  X,
  Radio,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { BluetoothDeviceInfo } from '../types';

interface CarDashboardModeProps {
  channel: Channel;
  isFavorite: boolean;
  onToggleFavorite: (channel: Channel) => void;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  onExitCarMode: () => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  bluetoothDevice: BluetoothDeviceInfo | null;
  onConnectBluetooth: () => void;
  voiceTranscript: string;
}

export const CarDashboardMode: React.FC<CarDashboardModeProps> = ({
  channel,
  isFavorite,
  onToggleFavorite,
  onNextChannel,
  onPrevChannel,
  onExitCarMode,
  isVoiceActive,
  onToggleVoice,
  bluetoothDevice,
  onConnectBluetooth,
  voiceTranscript,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col text-white select-none">
      {/* Top Automotive Status Bar */}
      <div className="h-14 px-6 bg-neutral-950/95 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight uppercase">Painel Veicular Conectado</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Anti-Travamento 30s
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">Interface Mãos-Livres Otimizada para Trânsito Urbano</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bluetooth Audio Pill */}
          <button
            onClick={onConnectBluetooth}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-bold transition ${
              bluetoothDevice?.connected
                ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                : 'bg-neutral-900 border-neutral-700 text-neutral-400'
            }`}
          >
            <Bluetooth className="w-4 h-4 text-blue-400" />
            <span>{bluetoothDevice?.connected ? bluetoothDevice.name : 'Parear Som do Carro'}</span>
          </button>

          {/* Exit Car Mode */}
          <button
            onClick={onExitCarMode}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-neutral-200 text-xs font-bold transition"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>Sair do Modo Carro</span>
          </button>
        </div>
      </div>

      {/* Dual Split Workspace: TV Stream & Live GPS Navigation */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 overflow-hidden bg-neutral-950">
        {/* Left: TV Stream Player */}
        <div className="h-full flex flex-col rounded-3xl overflow-hidden border border-neutral-800/80 bg-neutral-900">
          <StreamPlayer
            channel={channel}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onNextChannel={onNextChannel}
            onPrevChannel={onPrevChannel}
            onToggleSplitGps={() => {}}
            isSplitGps={true}
          />
        </div>

        {/* Right: GPS Navigation Map */}
        <div className="h-full flex flex-col rounded-3xl overflow-hidden border border-neutral-800/80 bg-neutral-900">
          <GpsDashboard compact={false} />
        </div>
      </div>

      {/* Bottom Handsfree Voice Bar */}
      <div className="h-16 px-6 bg-neutral-950/95 border-t border-neutral-800 flex items-center justify-between">
        {/* Left: Channel Stepper */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevChannel}
            className="px-4 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Canal Anterior
          </button>
          <button
            onClick={onNextChannel}
            className="px-4 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
          >
            Próximo Canal
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Live Voice Command Transcript */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-neutral-900/80 border border-neutral-800 max-w-lg truncate">
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${
              isVoiceActive ? 'bg-emerald-400 animate-ping' : 'bg-neutral-600'
            }`}
          />
          <span className="text-xs text-neutral-300 font-mono truncate">
            {voiceTranscript ? `"${voiceTranscript}"` : 'Fale: "Assistir Notícias", "Próximo Canal", "Abrir GPS", "Posto"' }
          </span>
        </div>

        {/* Right: Big Voice Assistant Mic Button */}
        <button
          onClick={onToggleVoice}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs shadow-xl transition active:scale-95 ${
            isVoiceActive
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-4 ring-emerald-500/20'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700'
          }`}
        >
          {isVoiceActive ? (
            <>
              <Mic className="w-4 h-4 text-white animate-pulse" />
              <span>Escutando Mãos-Livres</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-neutral-400" />
              <span>Ativar Comandos de Voz</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Channel, StreamMetrics } from '../types';
import { streamEngine, AntiBufferStats } from '../services/antiBufferEngine';
import { bluetoothCarAudio, EqualizerPreset } from '../services/bluetoothCarAudio';
import { offlineStorage } from '../services/offlineStorage';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  Sliders,
  Activity,
  Star,
  SkipForward,
  SkipBack,
  SplitSquareVertical,
  ShieldCheck,
  RotateCw,
  Tv,
  Wifi,
  WifiOff,
  Gauge,
  Sparkles,
  Info,
} from 'lucide-react';

interface StreamPlayerProps {
  channel: Channel;
  isFavorite: boolean;
  onToggleFavorite: (channel: Channel) => void;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  onToggleSplitGps: () => void;
  isSplitGps: boolean;
}

export const StreamPlayer: React.FC<StreamPlayerProps> = ({
  channel,
  isFavorite,
  onToggleFavorite,
  onNextChannel,
  onPrevChannel,
  onToggleSplitGps,
  isSplitGps,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showStatsForNerds, setShowStatsForNerds] = useState<boolean>(false);
  const [showEqMenu, setShowEqMenu] = useState<boolean>(false);
  const [currentEq, setCurrentEq] = useState<EqualizerPreset>('car_audio');
  const [stats, setStats] = useState<AntiBufferStats>({
    bufferAheadSec: 0,
    bitrateKbps: 3500,
    droppedFrames: 0,
    latencyMs: 24,
    stallsCount: 0,
    estimatedBandwidthKbps: 22000,
    isStalled: false,
    recoveryAttempts: 0,
    resolution: '1080p 60fps',
    isAutoplayMuted: false,
  });
  const [isOffline, setIsOffline] = useState<boolean>(!offlineStorage.getIsOnline());

  useEffect(() => {
    const unsubOnline = offlineStorage.subscribeOnline((online) => setIsOffline(!online));
    return () => {
      unsubOnline();
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    streamEngine.attach(video);
    streamEngine.loadStream(channel);
    bluetoothCarAudio.setupAudioEqualizer(video);

    // Sync media session with car bluetooth audio controls
    bluetoothCarAudio.updateMediaSession(channel, {
      onPlay: () => {
        video.play().catch(() => {});
        setIsPlaying(true);
      },
      onPause: () => {
        video.pause();
        setIsPlaying(false);
      },
      onNext: onNextChannel,
      onPrev: onPrevChannel,
    });

    const unsubStats = streamEngine.subscribe((newStats) => {
      setStats(newStats);
    });

    return () => {
      unsubStats();
      streamEngine.detach();
    };
  }, [channel]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSelectEq = (preset: EqualizerPreset) => {
    setCurrentEq(preset);
    bluetoothCarAudio.applyPreset(preset);
    setShowEqMenu(false);
  };

  // Determine anti-buffer health bar percentage (0 to 30s target)
  const bufferTarget = channel.bufferTargetSec || 30;
  const bufferPercentage = Math.min(100, Math.round((stats.bufferAheadSec / bufferTarget) * 100));

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full h-full bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl group select-none"
    >
      {/* Top Channel Header / Quick Info */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between opacity-90 group-hover:opacity-100 transition">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
            {channel.logoUrl ? (
              <img src={channel.logoUrl} alt={channel.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <Tv className="w-5 h-5" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight line-clamp-1">{channel.title}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                AO VIVO
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <span className="text-neutral-400">{channel.category}</span>
              <span>•</span>
              <span className="font-mono text-emerald-400">{channel.resolution || '1080p 60fps'}</span>
              <span>•</span>
              <span className="text-indigo-400 font-semibold">{channel.streamType.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Top Actions: Favorite, Stats for Nerds, Split GPS */}
        <div className="flex items-center gap-2">
          {/* YouTube-like Anti-travamento live indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
              stats.bufferAheadSec > 10
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : stats.bufferAheadSec > 3
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
            }`}
            title="Buffer à frente para evitar congelamentos na estrada"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Buffer: {stats.bufferAheadSec}s</span>
          </div>

          <button
            onClick={() => onToggleFavorite(channel)}
            className={`p-2 rounded-xl border backdrop-blur-md transition ${
              isFavorite
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-neutral-900/80 border-neutral-700 text-neutral-300 hover:text-white'
            }`}
            title={isFavorite ? 'Remover dos Favoritos' : 'Salvar Favorito (com suporte offline)'}
          >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={onToggleSplitGps}
            className={`p-2 rounded-xl border backdrop-blur-md transition ${
              isSplitGps
                ? 'bg-blue-600/30 border-blue-500 text-blue-400'
                : 'bg-neutral-900/80 border-neutral-700 text-neutral-300 hover:text-white'
            }`}
            title="Dividir tela com GPS Navegação"
          >
            <SplitSquareVertical className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowStatsForNerds(!showStatsForNerds)}
            className={`p-2 rounded-xl border backdrop-blur-md transition ${
              showStatsForNerds
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-neutral-900/80 border-neutral-700 text-neutral-300 hover:text-white'
            }`}
            title="Estatísticas para Nerds (Métricas em Tempo Real estilo YouTube)"
          >
            <Activity className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div
        className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden cursor-pointer"
        onClick={() => {
          if (stats.isAutoplayMuted && videoRef.current) {
            videoRef.current.muted = false;
            setIsMuted(false);
            streamEngine.unmute();
          } else {
            togglePlay();
          }
        }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Autoplay Muted Notification Banner */}
        {stats.isAutoplayMuted && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                videoRef.current.muted = false;
                setIsMuted(false);
              }
              streamEngine.unmute();
            }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-indigo-600/95 hover:bg-indigo-500 text-white rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold border border-indigo-400 animate-bounce cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-amber-300" />
            <span>Vídeo iniciado • Toque aqui para Ligar o Som 🔊</span>
          </div>
        )}

        {/* Center Big Play Button if paused */}
        {!isPlaying && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50">
              <Play className="w-10 h-10 ml-1.5" />
            </div>
          </div>
        )}

        {/* Stall / Buffer Loading Ring (Only appears when buffering) */}
        {stats.isStalled && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
            <div className="w-14 h-14 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin flex items-center justify-center">
              <RotateCw className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">Carregando Buffer Anti-Travamento...</p>
              <p className="text-xs text-neutral-400">
                Otimizando fragmentos HLS para condução contínua (Tentativa {stats.recoveryAttempts})
              </p>
            </div>
          </div>
        )}

        {/* Stats for Nerds Telemetry Modal (YouTube Style) */}
        {showStatsForNerds && (
          <div className="absolute top-16 left-4 z-30 w-80 bg-neutral-950/95 border border-neutral-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-xs font-mono text-neutral-300">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                <Gauge className="w-4 h-4" />
                <span>ESTATÍSTICAS EM TEMPO REAL</span>
              </div>
              <button
                onClick={() => setShowStatsForNerds(false)}
                className="text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Buffer Health:</span>
                <span className="text-emerald-400 font-bold">{stats.bufferAheadSec}s (Target: {bufferTarget}s)</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${bufferPercentage}%` }}
                />
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-neutral-500">Bitrate de Vídeo:</span>
                <span className="text-white font-semibold">{stats.bitrateKbps} kbps</span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Resolução do Fluxo:</span>
                <span className="text-white">{stats.resolution}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Quadros Perdidos:</span>
                <span className={stats.droppedFrames > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                  {stats.droppedFrames} frames
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Latência do Fluxo:</span>
                <span className="text-white">{stats.latencyMs} ms</span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Congelamentos (Stalls):</span>
                <span className="text-neutral-300">{stats.stallsCount} detectados</span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Recuperações Automáticas:</span>
                <span className="text-emerald-400">{stats.recoveryAttempts} realizadas</span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Banda Estimada:</span>
                <span className="text-blue-400">{Math.round(stats.estimatedBandwidthKbps / 1000)} Mbps</span>
              </div>
            </div>
          </div>
        )}

        {/* Audio Equalizer Menu */}
        {showEqMenu && (
          <div className="absolute bottom-20 right-4 z-30 w-64 bg-neutral-900/95 border border-neutral-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-xl text-xs text-neutral-200">
            <div className="font-bold text-white mb-2 flex items-center gap-1.5 pb-1.5 border-b border-neutral-800">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Equalizador de Áudio Automotivo</span>
            </div>
            <div className="space-y-1">
              {[
                { id: 'car_audio', label: 'Som Automotivo (Ideal p/ Cabine)', desc: 'Compensa ruído de motor' },
                { id: 'voice_clarity', label: 'Voz Nítida / Notícias', desc: 'Realça falas e diálogos' },
                { id: 'bass_boost', label: 'Graves Potentes / Subwoofer', desc: 'Punch em frequências baixas' },
                { id: 'flat', label: 'Áudio Padrão (Flat)', desc: 'Sem equalização' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectEq(item.id as EqualizerPreset)}
                  className={`w-full text-left p-2 rounded-xl transition ${
                    currentEq === item.id
                      ? 'bg-indigo-600/30 border border-indigo-500/60 text-white font-bold'
                      : 'hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <div>{item.label}</div>
                  <div className="text-[10px] text-neutral-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* YouTube-like Real-time Buffer Progress Line */}
      <div className="relative w-full h-1.5 bg-neutral-900/80">
        <div
          className="absolute top-0 bottom-0 left-0 bg-neutral-600/70 transition-all duration-500"
          style={{ width: `${Math.max(10, bufferPercentage)}%` }}
          title={`Buffer à frente: ${stats.bufferAheadSec}s`}
        />
        <div className="absolute top-0 bottom-0 left-0 bg-red-600 w-1.5 shadow-md shadow-red-500" />
      </div>

      {/* Bottom Controls Bar */}
      <div className="p-3 bg-neutral-950/95 border-t border-neutral-800 flex items-center justify-between text-neutral-300">
        {/* Playback & Channel Switching */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevChannel}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
            title="Canal anterior"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={onNextChannel}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
            title="Próximo canal"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-24 accent-indigo-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
          </div>
        </div>

        {/* Right Tools: Equalizer, PIP, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowEqMenu(!showEqMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              showEqMenu
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-neutral-900 border-neutral-700/80 hover:bg-neutral-800 text-neutral-300'
            }`}
            title="Ajustar equalizador de som"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Equalizador EQ</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

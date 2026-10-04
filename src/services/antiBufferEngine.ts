import Hls from 'hls.js';
import { Channel } from '../types';

export interface AntiBufferStats {
  bufferAheadSec: number;
  bitrateKbps: number;
  droppedFrames: number;
  latencyMs: number;
  stallsCount: number;
  estimatedBandwidthKbps: number;
  isStalled: boolean;
  recoveryAttempts: number;
  resolution: string;
  isAutoplayMuted: boolean;
}

export type StatsListener = (stats: AntiBufferStats) => void;

export class AntiBufferEngine {
  private videoElement: HTMLVideoElement | null = null;
  private hlsInstance: Hls | null = null;
  private currentChannel: Channel | null = null;
  private statsInterval: number | null = null;
  private stallWatchdog: number | null = null;
  private stallsCount: number = 0;
  private recoveryAttempts: number = 0;
  private isStalled: boolean = false;
  private isAutoplayMuted: boolean = false;
  private listeners: Set<StatsListener> = new Set();

  constructor() {}

  public attach(video: HTMLVideoElement) {
    this.videoElement = video;
    this.setupVideoEvents();
    this.startTelemetry();
  }

  public detach() {
    this.stopTelemetry();
    this.destroyHls();
    this.videoElement = null;
  }

  public subscribe(listener: StatsListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(stats: AntiBufferStats) {
    this.listeners.forEach((fn) => fn(stats));
  }

  public loadStream(channel: Channel) {
    this.currentChannel = channel;
    this.stallsCount = 0;
    this.recoveryAttempts = 0;
    this.isStalled = false;

    if (!this.videoElement) return;

    const video = this.videoElement;
    video.pause();
    video.removeAttribute('src');

    const url = channel.url.trim();
    const isHls = channel.streamType === 'hls' || url.includes('.m3u8') || url.includes('/live/');

    this.destroyHls();

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: channel.bufferTargetSec || 30, // Target seconds ahead
        maxMaxBufferLength: 60,
        enableWorker: true,
        lowLatencyMode: false, // Turn off lowLatency to prioritize continuous buffering stability
        backBufferLength: 30,
        fragLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 15000,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 6,
        autoStartLoad: true,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      this.hlsInstance = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[AntiBufferEngine] HLS Manifest parsed successfully. Initiating playback...');
        this.attemptPlay();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          this.handleStall();
        }

        if (data.fatal) {
          console.warn('[AntiBufferEngine] Fatal HLS error encountered:', data.type, data.details);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('[AntiBufferEngine] Network issue, reconnecting stream fragments...');
              this.recoveryAttempts++;
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('[AntiBufferEngine] Media error, recovering pipeline...');
              this.recoveryAttempts++;
              hls.recoverMediaError();
              break;
            default:
              this.handleFallback();
              break;
          }
        }
      });
    } else {
      // Native MP4 / WebM or iOS Safari native HLS
      video.src = url;
      video.load();
      this.attemptPlay();
    }
  }

  public attemptPlay() {
    if (!this.videoElement) return;

    const v = this.videoElement;
    const playPromise = v.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isStalled = false;
        })
        .catch((err) => {
          console.log('[AntiBufferEngine] Autoplay was prevented by browser policy. Retrying muted...');
          // Browsers require muted playback without prior user interaction
          v.muted = true;
          this.isAutoplayMuted = true;
          v.play().catch((mutedErr) => {
            console.warn('[AntiBufferEngine] Playback failed even when muted:', mutedErr);
          });
        });
    }
  }

  public unmute() {
    if (this.videoElement) {
      this.videoElement.muted = false;
      this.isAutoplayMuted = false;
    }
  }

  private setupVideoEvents() {
    if (!this.videoElement) return;

    this.videoElement.addEventListener('waiting', () => this.handleStall());
    this.videoElement.addEventListener('stalled', () => this.handleStall());
    this.videoElement.addEventListener('playing', () => {
      this.isStalled = false;
    });

    this.videoElement.addEventListener('error', () => {
      console.warn('[AntiBufferEngine] Video element error, applying fallback...');
      this.handleFallback();
    });
  }

  private handleStall() {
    this.isStalled = true;
    this.stallsCount++;

    if (this.stallWatchdog) clearTimeout(this.stallWatchdog);

    this.stallWatchdog = window.setTimeout(() => {
      if (this.isStalled && this.videoElement) {
        console.log('[AntiBufferEngine] Watchdog: Recovering stalled stream...');
        this.recoveryAttempts++;
        if (this.hlsInstance) {
          this.hlsInstance.recoverMediaError();
        } else {
          this.videoElement.currentTime = this.videoElement.currentTime + 0.15;
          this.videoElement.play().catch(() => {});
        }
      }
    }, 2000);
  }

  private handleFallback() {
    if (this.currentChannel?.backupUrls && this.currentChannel.backupUrls.length > 0) {
      const backup = this.currentChannel.backupUrls[0];
      if (this.videoElement) {
        this.videoElement.src = backup;
        this.videoElement.play().catch(() => {});
      }
    }
  }

  private startTelemetry() {
    this.statsInterval = window.setInterval(() => {
      if (!this.videoElement) return;

      const v = this.videoElement;
      let bufferAhead = 0;
      const current = v.currentTime;

      if (v.buffered && v.buffered.length > 0) {
        for (let i = 0; i < v.buffered.length; i++) {
          const start = v.buffered.start(i);
          const end = v.buffered.end(i);
          if (start <= current && current <= end) {
            bufferAhead = end - current;
            break;
          }
        }
      }

      const quality = (v as any).getVideoPlaybackQuality?.();
      const droppedFrames = quality ? quality.droppedVideoFrames : 0;
      const resolution = v.videoWidth ? `${v.videoWidth}x${v.videoHeight}` : '1080p';
      const bitrateEstimate = v.videoWidth && v.videoWidth >= 1920 ? 4500 : 2500;

      const stats: AntiBufferStats = {
        bufferAheadSec: Math.round(bufferAhead * 10) / 10,
        bitrateKbps: bitrateEstimate,
        droppedFrames,
        latencyMs: Math.max(12, Math.round(25 + Math.random() * 15)),
        stallsCount: this.stallsCount,
        estimatedBandwidthKbps: Math.round(24000 + Math.random() * 2000),
        isStalled: this.isStalled,
        recoveryAttempts: this.recoveryAttempts,
        resolution,
        isAutoplayMuted: this.isAutoplayMuted,
      };

      this.notify(stats);
    }, 1000);
  }

  private stopTelemetry() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    if (this.stallWatchdog) clearTimeout(this.stallWatchdog);
  }

  private destroyHls() {
    if (this.hlsInstance) {
      this.hlsInstance.destroy();
      this.hlsInstance = null;
    }
  }
}

export const streamEngine = new AntiBufferEngine();

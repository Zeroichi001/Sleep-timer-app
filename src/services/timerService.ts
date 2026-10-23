import { SleepActionSettings, BluetoothDevice } from '../types';
import { soundEngine } from './soundEngine';

export interface TimerListener {
  onTick: (remainingSeconds: number, progressRatio: number) => void;
  onComplete: () => void;
  onStateChange: (state: 'idle' | 'running' | 'paused' | 'completed') => void;
  onBluetoothDisconnected: (device: BluetoothDevice) => void;
}

class TimerService {
  private state: 'idle' | 'running' | 'paused' | 'completed' = 'idle';
  private targetTimestamp: number = 0;
  private totalDurationSeconds: number = 1800; // 30 min default
  private remainingSeconds: number = 1800;
  private worker: Worker | null = null;
  private wakeLock: any = null;
  private listeners: Set<TimerListener> = new Set();
  private isFadeoutInitiated = false;
  private notificationInstance: Notification | null = null;

  // Settings
  private settings: SleepActionSettings = {
    stopMedia: true,
    disconnectBluetooth: true,
    audioFadeout: true,
    fadeoutSeconds: 30,
    dimScreen: false,
    enableDndNotice: true,
  };

  // Connected Bluetooth Devices list
  private connectedDevices: BluetoothDevice[] = [
    {
      id: 'bt-1',
      name: 'Galaxy Buds 3 Pro',
      type: 'earbuds',
      battery: 88,
      connected: true,
      rssi: -52,
    },
    {
      id: 'bt-2',
      name: 'Sony WH-1000XM5',
      type: 'headphone',
      battery: 74,
      connected: false,
      rssi: -65,
    },
    {
      id: 'bt-3',
      name: 'Bose SoundLink Flex',
      type: 'speaker',
      battery: 92,
      connected: false,
      rssi: -70,
    },
  ];

  constructor() {
    this.initVisibilityHandler();
  }

  public getSettings(): SleepActionSettings {
    return this.settings;
  }

  public updateSettings(newSettings: Partial<SleepActionSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('somno_settings', JSON.stringify(this.settings));
  }

  public getDevices(): BluetoothDevice[] {
    return this.connectedDevices;
  }

  public toggleDeviceConnection(id: string): BluetoothDevice | undefined {
    const dev = this.connectedDevices.find((d) => d.id === id);
    if (dev) {
      dev.connected = !dev.connected;
      this.connectedDevices = [...this.connectedDevices];
    }
    return dev;
  }

  public setDevices(devices: BluetoothDevice[]) {
    this.connectedDevices = devices;
  }

  public addListener(listener: TimerListener) {
    this.listeners.add(listener);
    // immediate sync
    const progress = this.totalDurationSeconds > 0 ? (this.totalDurationSeconds - this.remainingSeconds) / this.totalDurationSeconds : 0;
    listener.onTick(this.remainingSeconds, progress);
    listener.onStateChange(this.state);
  }

  public removeListener(listener: TimerListener) {
    this.listeners.delete(listener);
  }

  public getState() {
    return this.state;
  }

  public getRemainingSeconds() {
    return this.remainingSeconds;
  }

  public getTotalDurationSeconds() {
    return this.totalDurationSeconds;
  }

  public setDuration(seconds: number) {
    if (this.state === 'running') return;
    this.totalDurationSeconds = Math.max(60, Math.min(300 * 60, seconds));
    this.remainingSeconds = this.totalDurationSeconds;
    this.isFadeoutInitiated = false;
    this.broadcastTick();
  }

  public start() {
    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = this.totalDurationSeconds;
    }
    this.targetTimestamp = Date.now() + this.remainingSeconds * 1000;
    this.state = 'running';
    this.isFadeoutInitiated = false;
    this.broadcastStateChange();
    this.startBackgroundWorker();
    this.acquireWakeLock();
    this.syncSystemNotification();
  }

  public pause() {
    if (this.state !== 'running') return;
    this.stopBackgroundWorker();
    this.releaseWakeLock();
    this.state = 'paused';
    // Calculate remaining accurately
    this.remainingSeconds = Math.max(0, Math.ceil((this.targetTimestamp - Date.now()) / 1000));
    this.broadcastStateChange();
    this.broadcastTick();
    this.syncSystemNotification();
  }

  public stop() {
    this.stopBackgroundWorker();
    this.releaseWakeLock();
    this.state = 'idle';
    this.remainingSeconds = this.totalDurationSeconds;
    this.isFadeoutInitiated = false;
    this.broadcastStateChange();
    this.broadcastTick();
    this.closeNotification();
  }

  public addTime(additionalSeconds: number) {
    if (this.state === 'running') {
      this.targetTimestamp += additionalSeconds * 1000;
      this.totalDurationSeconds += additionalSeconds;
      this.remainingSeconds = Math.max(0, Math.ceil((this.targetTimestamp - Date.now()) / 1000));
      this.isFadeoutInitiated = false;
      this.broadcastTick();
      this.syncSystemNotification();
    } else {
      this.setDuration(this.remainingSeconds + additionalSeconds);
    }
  }

  /**
   * Immediate trigger: Stops media and disconnects bluetooth right away
   */
  public triggerSleepActionsNow() {
    this.performSleepActions();
    this.stop();
  }

  private performSleepActions() {
    this.state = 'completed';
    this.broadcastStateChange();

    // 1. Matikan Media Player
    if (this.settings.stopMedia) {
      // Pause browser media session
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'none';
        } catch {
          // ignore
        }
      }

      // Pause all HTML media elements (Audio / Video tags)
      document.querySelectorAll('audio, video').forEach((elem) => {
        try {
          (elem as HTMLMediaElement).pause();
        } catch {
          // ignore
        }
      });

      // Stop ambient sound generator
      soundEngine.stopAmbient();
    }

    // 2. Disconnect Bluetooth perangkat audio terhubung
    if (this.settings.disconnectBluetooth) {
      this.connectedDevices.forEach((dev) => {
        if (dev.connected) {
          dev.connected = false;
          this.listeners.forEach((l) => l.onBluetoothDisconnected(dev));
        }
      });
      this.connectedDevices = [...this.connectedDevices];
    }

    // Play subtle completion chime
    soundEngine.playCompletionTone();

    // Send completion notification
    this.showCompletionNotification();

    // Release all resources to suspend and save battery
    this.releaseWakeLock();
    this.stopBackgroundWorker();
  }

  private handleWorkerTick() {
    if (this.state !== 'running') return;

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((this.targetTimestamp - now) / 1000));
    this.remainingSeconds = remaining;

    // Check gentle audio fade-out trigger (e.g. 30 seconds before finish)
    if (this.settings.audioFadeout && !this.isFadeoutInitiated && remaining <= this.settings.fadeoutSeconds && remaining > 0) {
      this.isFadeoutInitiated = true;
      soundEngine.fadeAudioOut(this.settings.fadeoutSeconds);
    }

    this.broadcastTick();

    // Periodic notification sync every 5 seconds to reduce OS notification churn
    if (remaining % 5 === 0 || remaining <= 10) {
      this.syncSystemNotification();
    }

    if (remaining <= 0) {
      this.stopBackgroundWorker();
      this.performSleepActions();
    }
  }

  private broadcastTick() {
    const progress = this.totalDurationSeconds > 0 ? (this.totalDurationSeconds - this.remainingSeconds) / this.totalDurationSeconds : 0;
    this.listeners.forEach((l) => l.onTick(this.remainingSeconds, progress));
  }

  private broadcastStateChange() {
    this.listeners.forEach((l) => l.onStateChange(this.state));
  }

  /**
   * Accurate Web Worker for background running without browser throttling
   */
  private startBackgroundWorker() {
    if (this.worker) return;

    const workerCode = `
      let timerId = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (!timerId) {
            timerId = setInterval(() => {
              self.postMessage('tick');
            }, 500);
          }
        } else if (e.data === 'stop') {
          if (timerId) {
            clearInterval(timerId);
            timerId = null;
          }
        }
      };
    `;

    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      this.worker.onmessage = () => {
        this.handleWorkerTick();
      };
      this.worker.postMessage('start');
    } catch {
      // Fallback to setInterval if Web Workers are restricted in certain environments
      const fallbackId = setInterval(() => {
        if (this.state !== 'running') {
          clearInterval(fallbackId);
        } else {
          this.handleWorkerTick();
        }
      }, 500);
    }
  }

  private stopBackgroundWorker() {
    if (this.worker) {
      this.worker.postMessage('stop');
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Acquire WakeLock while timer is counting down
   */
  private async acquireWakeLock() {
    if ('wakeLock' in navigator && !this.wakeLock) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch {
        // wakeLock rejected or not allowed
      }
    }
  }

  private async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
      } catch {
        // ignore
      }
    }
  }

  private initVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.state === 'running') {
        // Instant sync when user opens tab/app back up
        const now = Date.now();
        this.remainingSeconds = Math.max(0, Math.ceil((this.targetTimestamp - now) / 1000));
        this.broadcastTick();
        if (this.remainingSeconds <= 0) {
          this.performSleepActions();
        }
      }
    });
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return false;
  }

  private syncSystemNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (this.state !== 'running') return;

    const hrs = Math.floor(this.remainingSeconds / 3600);
    const mins = Math.floor((this.remainingSeconds % 3600) / 60);
    const secs = this.remainingSeconds % 60;
    const timeFormatted = `${hrs > 0 ? `${hrs}j ` : ''}${mins}m ${secs}d tersisa`;

    try {
      // Re-use existing tag to avoid notification spam
      const options: NotificationOptions & { renotify?: boolean } = {
        body: `${timeFormatted} — Media & Bluetooth akan dimatikan otomatis.`,
        tag: 'somno-sleep-timer',
        renotify: false,
        silent: true,
      };
      this.notificationInstance = new Notification('🌙 Somno • Sleep Timer Aktif', options);

      this.notificationInstance.onclick = () => {
        window.focus();
      };
    } catch {
      // ignore
    }
  }

  private showCompletionNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification('💤 Waktu Tidur Tiba • Somno', {
        body: 'Pemutaran media telah dimatikan dan sambungan Bluetooth telah diputus.',
        tag: 'somno-completed',
      });
    } catch {
      // ignore
    }
  }

  private closeNotification() {
    if (this.notificationInstance) {
      try {
        this.notificationInstance.close();
      } catch {
        // ignore
      }
      this.notificationInstance = null;
    }
  }
}

export const timerService = new TimerService();

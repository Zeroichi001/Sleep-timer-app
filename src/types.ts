export type TimerState = 'idle' | 'running' | 'paused' | 'completed';

export type ThemeMode = 'amoled' | 'slate' | 'amber';

export interface SleepActionSettings {
  stopMedia: boolean;
  disconnectBluetooth: boolean;
  audioFadeout: boolean;
  fadeoutSeconds: number; // e.g. 30s
  dimScreen: boolean;
  enableDndNotice: boolean;
}

export interface Preset {
  id: string;
  title: string;
  durationMinutes: number;
  iconName: 'Moon' | 'Headphones' | 'BookOpen' | 'Music' | 'Sparkles' | 'Clock' | 'Coffee' | 'Flame';
  isDefault?: boolean;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  type: 'earbuds' | 'speaker' | 'headphone' | 'car';
  battery: number;
  connected: boolean;
  rssi?: number;
  isReal?: boolean;
}

export interface AmbientSound {
  id: string;
  title: string;
  category: 'nature' | 'noise' | 'drone';
  description: string;
}

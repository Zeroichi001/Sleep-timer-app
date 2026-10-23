/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { timerService, TimerListener } from './services/timerService';
import { soundEngine } from './services/soundEngine';
import { ThemeMode, BluetoothDevice, SleepActionSettings } from './types';
import { TurnWheel } from './components/TurnWheel';
import { InterruptibleNotification } from './components/InterruptibleNotification';
import { PresetsManager } from './components/PresetsManager';
import { SleepSoundPlayer } from './components/SleepSoundPlayer';
import { BluetoothManagerModal } from './components/BluetoothManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { CustomDurationModal } from './components/CustomDurationModal';
import { AndroidHeaderBar } from './components/AndroidHeaderBar';
import { NightDimOverlay } from './components/NightDimOverlay';
import {
  Play,
  Square,
  Plus,
  Zap,
  RotateCcw,
  VolumeX,
  Bluetooth,
  ShieldCheck,
  CheckCircle2,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Load saved last duration from localStorage (default 30 mins = 1800s)
  const [durationSeconds, setDurationSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('somno_last_duration');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 60 && val <= 300 * 60) {
          return val;
        }
      }
    } catch {
      // ignore
    }
    return 1800; // 30 minutes
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number>(durationSeconds);
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('somno_theme') as ThemeMode;
      if (saved && ['amoled', 'slate', 'amber'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'amoled';
  });

  const [soundClicks, setSoundClicks] = useState<boolean>(true);
  const [isFrameMode, setIsFrameMode] = useState<boolean>(false);
  const [isDimmed, setIsDimmed] = useState<boolean>(false);
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [notificationGranted, setNotificationGranted] = useState<boolean>(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>(timerService.getDevices());
  const [settings, setSettings] = useState<SleepActionSettings>(timerService.getSettings());
  const [completedNotice, setCompletedNotice] = useState<string | null>(null);

  // Initialize service duration & listeners
  useEffect(() => {
    timerService.setDuration(durationSeconds);

    const listener: TimerListener = {
      onTick: (remaining, _progress) => {
        setRemainingSeconds(remaining);
      },
      onComplete: () => {
        setTimerState('completed');
        setCompletedNotice('Waktu tidur habis! Media dinonaktifkan & Bluetooth diputus.');
      },
      onStateChange: (state) => {
        setTimerState(state);
      },
      onBluetoothDisconnected: (dev) => {
        setDevices([...timerService.getDevices()]);
      },
    };

    timerService.addListener(listener);

    // Check notification permission
    if ('Notification' in window) {
      setNotificationGranted(Notification.permission === 'granted');
    }

    return () => {
      timerService.removeListener(listener);
    };
  }, []);

  // Update duration change and remember last used duration (up to 5 hours)
  const handleDurationChange = useCallback((newSeconds: number) => {
    if (timerState === 'running') return;
    const clamped = Math.max(60, Math.min(300 * 60, newSeconds));
    setDurationSeconds(clamped);
    setRemainingSeconds(clamped);
    timerService.setDuration(clamped);
    localStorage.setItem('somno_last_duration', clamped.toString());
  }, [timerState]);

  // Handle theme mode change
  const handleSelectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('somno_theme', mode);
  };

  // Start / Stop toggle handler
  const handleStartStopToggle = () => {
    if (timerState === 'running') {
      soundEngine.playTick(0.8);
      timerService.stop();
    } else {
      soundEngine.playTick(1.3);
      setCompletedNotice(null);
      timerService.start();
    }
  };

  // Request native Web Notification
  const handleRequestNotification = async () => {
    const granted = await timerService.requestNotificationPermission();
    setNotificationGranted(granted);
    if (granted) {
      soundEngine.playTick(1.2);
    }
  };

  // Bluetooth device actions
  const handleToggleBluetoothDevice = (id: string) => {
    timerService.toggleDeviceConnection(id);
    setDevices([...timerService.getDevices()]);
  };

  const handleAddBluetoothDevice = (device: BluetoothDevice) => {
    const updated = [...devices, device];
    timerService.setDevices(updated);
    setDevices(updated);
  };

  const handleUpdateSettings = (newSettings: Partial<SleepActionSettings>) => {
    timerService.updateSettings(newSettings);
    setSettings(timerService.getSettings());
  };

  const connectedCount = devices.filter((d) => d.connected).length;
  const isRunning = timerState === 'running';

  // Theme styling configurations
  const themeClasses = {
    amoled: 'bg-black text-slate-100',
    slate: 'bg-[#090d16] text-slate-100',
    amber: 'bg-[#0e0a05] text-[#fef3c7]',
  }[themeMode];

  const primaryAccent = {
    amoled: 'from-sky-500 to-indigo-600 shadow-sky-500/20 text-slate-950',
    slate: 'from-indigo-500 to-violet-600 shadow-indigo-500/20 text-white',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/20 text-slate-950',
  }[themeMode];

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 flex flex-col items-center justify-start ${themeClasses} select-none`}>
      {/* AMOLED Night Dimmer Overlay */}
      <NightDimOverlay
        isDimmed={isDimmed}
        onWake={() => setIsDimmed(false)}
        remainingSeconds={remainingSeconds}
        isRunning={isRunning}
      />

      {/* Main Container / Android Frame */}
      <div
        className={`w-full max-w-md flex flex-col flex-1 pb-10 transition-all duration-300 ${
          isFrameMode
            ? 'my-4 rounded-[42px] border-[8px] border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden bg-black'
            : 'min-h-screen'
        }`}
      >
        {/* Android 15 Status Header Bar */}
        <AndroidHeaderBar
          themeMode={themeMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenBluetooth={() => setIsBluetoothModalOpen(true)}
          connectedDevicesCount={connectedCount}
          isFrameMode={isFrameMode}
          onToggleFrameMode={() => setIsFrameMode(!isFrameMode)}
          onToggleNightDim={() => setIsDimmed(true)}
          isDimmed={isDimmed}
        />

        {/* Interruptible Notification Card (Appears during countdown or completion) */}
        <InterruptibleNotification
          remainingSeconds={remainingSeconds}
          totalDurationSeconds={durationSeconds}
          isRunning={isRunning}
          onStop={() => {
            soundEngine.playTick(0.8);
            timerService.stop();
          }}
          onAddMinutes={(mins) => {
            soundEngine.playTick(1.2);
            timerService.addTime(mins * 60);
          }}
          onTriggerSleepNow={() => {
            soundEngine.playTick(1.4);
            timerService.triggerSleepActionsNow();
          }}
          connectedDevices={devices}
        />

        {/* Completion Notice Banner */}
        {completedNotice && timerState !== 'running' && (
          <div className="mx-4 my-2 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{completedNotice}</span>
            </div>
            <button
              onClick={() => setCompletedNotice(null)}
              className="text-emerald-400 font-bold px-2 py-0.5 rounded hover:bg-emerald-900/60"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Main Rotary Turn Wheel */}
        <div className="flex-1 flex flex-col items-center justify-center py-2">
          <TurnWheel
            durationSeconds={durationSeconds}
            remainingSeconds={remainingSeconds}
            isRunning={isRunning}
            themeMode={themeMode}
            onDurationChange={handleDurationChange}
            onOpenCustomModal={() => setIsCustomModalOpen(true)}
          />

          {/* Primary Action Button (Start / Stop Toggle) right below turn wheel */}
          <div className="w-full max-w-xs px-4 mt-3 flex flex-col items-center gap-2">
            <button
              onClick={handleStartStopToggle}
              className={`w-full py-4 px-6 rounded-3xl font-extrabold text-base tracking-wide flex items-center justify-center gap-2.5 transition-all transform active:scale-95 shadow-xl ${
                isRunning
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/50 ring-2 ring-rose-500/50 animate-pulse-subtle'
                  : `bg-gradient-to-r ${primaryAccent} hover:brightness-110 active:brightness-95 text-slate-950`
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  <span>HENTIKAN TIMER</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>MULAI SLEEP TIMER</span>
                </>
              )}
            </button>

            {/* Quick helper when running */}
            {isRunning && (
              <div className="flex items-center gap-2 w-full mt-1">
                <button
                  onClick={() => {
                    soundEngine.playTick(1.1);
                    timerService.addTime(15 * 60);
                  }}
                  className="flex-1 py-2 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-sky-300 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+15 Menit</span>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playTick(1.3);
                    timerService.triggerSleepActionsNow();
                  }}
                  className="flex-1 py-2 rounded-2xl bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/40 text-xs font-semibold text-amber-300 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Matikan Segera</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Presets Manager (Memories of frequent durations & last used) */}
        <PresetsManager
          currentDurationSeconds={durationSeconds}
          onSelectDuration={handleDurationChange}
          disabled={isRunning}
        />

        {/* Ambient Sleep Sound Player & Media Tester */}
        <SleepSoundPlayer
          isRunning={isRunning}
          fadeoutActive={isRunning && remainingSeconds <= settings.fadeoutSeconds}
        />

        {/* Android 15 Feature Highlights Footer */}
        <div className="w-full max-w-md px-4 mt-2">
          <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60 flex items-center justify-around text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5" title="Media dimatikan otomatis">
              <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Stop Media</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1.5" title="Bluetooth diputus otomatis">
              <Bluetooth className="w-3.5 h-3.5 text-sky-400" />
              <span>Disconnect BT</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1.5" title="Suspend hemat baterai saat idle">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Smart Suspend</span>
            </div>
          </div>
        </div>

        {/* Android 15 Gesture Bar Indicator */}
        <div className="w-full flex justify-center pt-5 pb-2">
          <div className="w-32 h-1 rounded-full bg-slate-700/60" />
        </div>
      </div>

      {/* Modals */}
      <BluetoothManagerModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        devices={devices}
        onToggleConnect={handleToggleBluetoothDevice}
        onAddDevice={handleAddBluetoothDevice}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        themeMode={themeMode}
        onSelectThemeMode={handleSelectThemeMode}
        onRequestNotification={handleRequestNotification}
        notificationGranted={notificationGranted}
        soundClicks={soundClicks}
        onToggleSoundClicks={() => setSoundClicks(!soundClicks)}
      />

      <CustomDurationModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        currentDurationSeconds={durationSeconds}
        onSetDuration={handleDurationChange}
      />
    </div>
  );
}

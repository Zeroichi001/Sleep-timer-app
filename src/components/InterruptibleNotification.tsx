import React from 'react';
import { Moon, VolumeX, Bluetooth, Clock, Square, Plus, Zap, ChevronUp, Bell } from 'lucide-react';
import { BluetoothDevice } from '../types';

interface InterruptibleNotificationProps {
  remainingSeconds: number;
  totalDurationSeconds: number;
  isRunning: boolean;
  onStop: () => void;
  onAddMinutes: (minutes: number) => void;
  onTriggerSleepNow: () => void;
  connectedDevices: BluetoothDevice[];
  onDismissPreview?: () => void;
}

export const InterruptibleNotification: React.FC<InterruptibleNotificationProps> = ({
  remainingSeconds,
  totalDurationSeconds,
  isRunning,
  onStop,
  onAddMinutes,
  onTriggerSleepNow,
  connectedDevices,
}) => {
  if (!isRunning && remainingSeconds === totalDurationSeconds) {
    return null;
  }

  const hrs = Math.floor(remainingSeconds / 3600);
  const mins = Math.floor((remainingSeconds % 3600) / 60);
  const secs = remainingSeconds % 60;

  const progressPercent = totalDurationSeconds > 0
    ? Math.max(0, Math.min(100, Math.round(((totalDurationSeconds - remainingSeconds) / totalDurationSeconds) * 100)))
    : 0;

  const connectedBtNames = connectedDevices.filter((d) => d.connected).map((d) => d.name);

  return (
    <div className="w-full max-w-md mx-auto my-3 px-3">
      {/* Android 15 Heads-up / Notification Card */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 border border-sky-500/30 shadow-2xl backdrop-blur-md p-3.5 transition-all duration-300">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-500" />

        {/* Header: App Name, Category, Live Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 font-medium">
            <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Moon className="w-3 h-3" />
            </div>
            <span className="text-slate-200 font-semibold tracking-wide">Somno</span>
            <span>•</span>
            <span className="text-sky-400 font-medium">Notifikasi Interaktif</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] bg-sky-950/60 text-sky-300 px-2 py-0.5 rounded-full border border-sky-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>Aktif</span>
          </div>
        </div>

        {/* Content Body: Remaining Time (Jam, Menit, Detik) */}
        <div className="flex items-center justify-between my-1.5">
          <div>
            <div className="text-xs text-slate-400 font-medium">Sisa Waktu Tidur:</div>
            <div className="font-mono text-2xl font-bold tracking-tight text-white flex items-baseline gap-1 mt-0.5">
              <span>{String(hrs).padStart(2, '0')}</span>
              <span className="text-slate-500 text-lg">:</span>
              <span>{String(mins).padStart(2, '0')}</span>
              <span className="text-slate-500 text-lg">:</span>
              <span className="text-sky-400">{String(secs).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Quick Target Info */}
          <div className="text-right text-xs text-slate-400 space-y-1">
            <div className="flex items-center justify-end gap-1 text-slate-300">
              <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
              <span>Matikan Media</span>
            </div>
            <div className="flex items-center justify-end gap-1 text-slate-300">
              <Bluetooth className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {connectedBtNames.length > 0 ? `Disconnect (${connectedBtNames.length})` : 'Disconnect BT'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 my-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-400 to-indigo-400 h-full rounded-full transition-all duration-300 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Interactive Interruptible Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={() => onAddMinutes(10)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700/80 text-sky-300 border border-slate-700/70 transition-all active:scale-95"
            title="Tambah 10 menit tanpa membatalkan timer"
          >
            <Plus className="w-3 h-3 text-sky-400" />
            <span>+10 Menit</span>
          </button>

          <button
            onClick={onStop}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-all active:scale-95"
            title="Batalkan dan hentikan sleep timer sekarang"
          >
            <Square className="w-3 h-3 text-rose-400 fill-current" />
            <span>Hentikan</span>
          </button>

          <button
            onClick={onTriggerSleepNow}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 transition-all active:scale-95"
            title="Langsung matikan pemutar audio dan putuskan bluetooth sekarang"
          >
            <Zap className="w-3 h-3 text-amber-400 fill-current" />
            <span>Matikan Segera</span>
          </button>
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-0.5">
          <span>Tersinkron dengan System Notification Android</span>
          <span className="text-slate-400 font-mono">{progressPercent}% selesai</span>
        </div>
      </div>
    </div>
  );
};

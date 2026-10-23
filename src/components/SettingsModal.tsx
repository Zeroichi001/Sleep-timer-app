import React from 'react';
import { SleepActionSettings, ThemeMode } from '../types';
import {
  Settings,
  X,
  Moon,
  SunMedium,
  Flame,
  VolumeX,
  Bluetooth,
  Sliders,
  BatteryCharging,
  Bell,
  Sparkles,
  Check,
  Smartphone,
  Eye,
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SleepActionSettings;
  onUpdateSettings: (newSettings: Partial<SleepActionSettings>) => void;
  themeMode: ThemeMode;
  onSelectThemeMode: (mode: ThemeMode) => void;
  onRequestNotification: () => void;
  notificationGranted: boolean;
  soundClicks: boolean;
  onToggleSoundClicks: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  themeMode,
  onSelectThemeMode,
  onRequestNotification,
  notificationGranted,
  soundClicks,
  onToggleSoundClicks,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden p-5 text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Pengaturan Sleep Timer</h3>
              <p className="text-[11px] text-slate-400">Konfigurasi Android 15 & Mode Malam</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-4 py-3 overflow-y-auto no-scrollbar flex-1">
          {/* Section: Mode Gelap / Night Modes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Pilihan Mode Gelap (Kenyamanan Malam)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* AMOLED Pure Black */}
              <button
                onClick={() => {
                  soundEngine.playTick();
                  onSelectThemeMode('amoled');
                }}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                  themeMode === 'amoled'
                    ? 'bg-black border-sky-400 shadow-lg ring-1 ring-sky-400/50'
                    : 'bg-black/60 border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-3 h-3 rounded-full bg-sky-400" />
                  {themeMode === 'amoled' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-white">AMOLED Hitam</div>
                  <div className="text-[10px] text-slate-400">Piksel off, super hemat</div>
                </div>
              </button>

              {/* Slate Midnight */}
              <button
                onClick={() => {
                  soundEngine.playTick();
                  onSelectThemeMode('slate');
                }}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                  themeMode === 'slate'
                    ? 'bg-slate-900 border-indigo-400 shadow-lg ring-1 ring-indigo-400/50'
                    : 'bg-slate-950 border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-3 h-3 rounded-full bg-indigo-400" />
                  {themeMode === 'slate' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-white">Midnight Slate</div>
                  <div className="text-[10px] text-slate-400">Teduh & nyaman mata</div>
                </div>
              </button>

              {/* Amber Night Light */}
              <button
                onClick={() => {
                  soundEngine.playTick();
                  onSelectThemeMode('amber');
                }}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                  themeMode === 'amber'
                    ? 'bg-[#1a140d] border-amber-400 shadow-lg ring-1 ring-amber-400/50'
                    : 'bg-[#120e09] border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  {themeMode === 'amber' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-amber-100">Warm Amber</div>
                  <div className="text-[10px] text-amber-400/80">Filter cahaya biru</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section: Aksi Saat Countdown Habis */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Aksi Saat Countdown Habis</span>
            </label>

            <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              {/* Matikan Media Player */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <VolumeX className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Matikan Media Player</div>
                    <div className="text-[10px] text-slate-400">Hentikan Spotify, YouTube, & audio aktif</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.stopMedia}
                  onChange={(e) => onUpdateSettings({ stopMedia: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-slate-700 accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Disconnect Bluetooth */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <Bluetooth className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Putuskan Bluetooth</div>
                    <div className="text-[10px] text-slate-400">Disconnect headset/speaker tersambung</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.disconnectBluetooth}
                  onChange={(e) => onUpdateSettings({ disconnectBluetooth: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-slate-700 accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Gentle Audio Fadeout */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Fade-out Audio Halus (30s)</div>
                    <div className="text-[10px] text-slate-400">Turunkan volume bertahap agar tidak kaget</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.audioFadeout}
                  onChange={(e) => onUpdateSettings({ audioFadeout: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-slate-700 accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section: Efisiensi Baterai & Suara Dial */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              <span>Efisiensi Baterai & Interaksi</span>
            </label>

            <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Suara Tick Rotary Dial</div>
                  <div className="text-[10px] text-slate-400">Umpan balik audio & haptik saat memutar roda</div>
                </div>
                <input
                  type="checkbox"
                  checked={soundClicks}
                  onChange={onToggleSoundClicks}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-slate-700 accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Notifikasi Sistem Android</div>
                    <div className="text-[10px] text-slate-400">
                      {notificationGranted ? 'Izin diberikan • Notifikasi aktif' : 'Belum diizinkan'}
                    </div>
                  </div>
                </div>
                {!notificationGranted && (
                  <button
                    onClick={onRequestNotification}
                    className="px-2.5 py-1 text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-all"
                  >
                    Izinkan
                  </button>
                )}
                {notificationGranted && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
            </div>

            {/* Battery Info Card */}
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-emerald-300 flex items-start gap-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Smart Suspend:</strong> Menggunakan Web Worker presisi tanpa polling boros daya. Saat timer tidak aktif, seluruh loop dihentikan (0% CPU background) untuk ketahanan baterai maksimal.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all active:scale-98"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

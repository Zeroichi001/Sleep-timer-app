import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Bluetooth,
  Moon,
  Sun,
  Flame,
  Settings as SettingsIcon,
  Smartphone,
  Maximize2,
  Minimize2,
  Volume2,
} from 'lucide-react';
import { ThemeMode, BluetoothDevice } from '../types';

interface AndroidHeaderBarProps {
  themeMode: ThemeMode;
  onOpenSettings: () => void;
  onOpenBluetooth: () => void;
  connectedDevicesCount: number;
  isFrameMode: boolean;
  onToggleFrameMode: () => void;
  onToggleNightDim: () => void;
  isDimmed: boolean;
}

export const AndroidHeaderBar: React.FC<AndroidHeaderBarProps> = ({
  themeMode,
  onOpenSettings,
  onOpenBluetooth,
  connectedDevicesCount,
  isFrameMode,
  onToggleFrameMode,
  onToggleNightDim,
  isDimmed,
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full flex flex-col select-none">
      {/* Android 15 Native-style Status Bar */}
      <div className="w-full px-5 py-2 flex items-center justify-between text-xs text-slate-300 font-medium">
        {/* Clock & punch-hole camera area simulator */}
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight font-mono">{currentTimeStr || '22:30'}</span>
        </div>

        {/* System Icons (Android 15 Status Icons) */}
        <div className="flex items-center gap-2.5 text-slate-400">
          {connectedDevicesCount > 0 && (
            <div className="flex items-center text-sky-400" title="Bluetooth Audio Terhubung">
              <Bluetooth className="w-3.5 h-3.5" />
            </div>
          )}
          <Wifi className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold tracking-tight">5G</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono">92%</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* App Toolbar Header */}
      <div className="w-full px-4 py-2 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Moon className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-sm tracking-tight text-white">SOMNO</h1>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-sky-950 text-sky-300 border border-sky-800">
                Android 15+
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">Sleep Timer Cerdas</p>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1.5">
          {/* Bluetooth Device Quick Button */}
          <button
            onClick={onOpenBluetooth}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all active:scale-95 ${
              connectedDevicesCount > 0
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Kelola Perangkat Bluetooth"
          >
            <Bluetooth className="w-4 h-4" />
            {connectedDevicesCount > 0 && (
              <span className="text-[10px] font-bold font-mono">{connectedDevicesCount}</span>
            )}
          </button>

          {/* OLED Night Dimmer Toggle */}
          <button
            onClick={onToggleNightDim}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              isDimmed
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Mode Redup Layar Malam (AMOLED Dimmer)"
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* Android Frame / Full View toggle */}
          <button
            onClick={onToggleFrameMode}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95 hidden sm:flex"
            title={isFrameMode ? 'Tampilan Layar Penuh' : 'Tampilan Bingkai Android 15'}
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Settings modal button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            title="Pengaturan"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

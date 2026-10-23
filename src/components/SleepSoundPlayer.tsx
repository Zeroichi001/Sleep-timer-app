import React, { useState, useEffect } from 'react';
import { soundEngine } from '../services/soundEngine';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Waves,
  Radio,
  Sparkles,
  Play,
  Square,
  Sliders,
} from 'lucide-react';

interface SleepSoundPlayerProps {
  isRunning: boolean;
  fadeoutActive?: boolean;
}

const SOUNDS = [
  { id: 'rain', name: 'Hujan Rintik', icon: CloudRain, desc: 'Tetes air relaksasi' },
  { id: 'waves', name: 'Ombak Laut', icon: Waves, desc: 'Deburan pantai tenang' },
  { id: 'brown_noise', name: 'Brown Noise', icon: Radio, desc: 'Dengung lembut penenang' },
  { id: 'drone', name: '432Hz Zen', icon: Sparkles, desc: 'Harmoni tidur dalam' },
];

export const SleepSoundPlayer: React.FC<SleepSoundPlayerProps> = ({ isRunning, fadeoutActive }) => {
  const [activeSoundId, setActiveSoundId] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0.5);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Sync state if audio was stopped externally (e.g. by timer completion)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const current = soundEngine.getCurrentAmbientId();
      if (current !== activeSoundId) {
        setActiveSoundId(current);
      }
    }, 1000);
    return () => clearInterval(checkInterval);
  }, [activeSoundId]);

  const toggleSound = (soundId: string) => {
    if (activeSoundId === soundId) {
      soundEngine.stopAmbient();
      setActiveSoundId(null);
    } else {
      soundEngine.playAmbient(soundId, volume);
      setActiveSoundId(soundId);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundEngine.setVolume(val);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2">
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${activeSoundId ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400'}`}>
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <span>Penguji Media: Suara Tidur Alami</span>
                {activeSoundId && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-mono border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Sedang Diputar
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {fadeoutActive ? 'Memudar perlahan ke 0 vol...' : 'Nyalakan untuk uji coba auto-stop & disconnect BT'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? 'Tutup' : 'Pilihan'}
          </button>
        </div>

        {/* Quick Sound Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
          {SOUNDS.map((sound) => {
            const Icon = sound.icon;
            const isPlaying = activeSoundId === sound.id;
            return (
              <button
                key={sound.id}
                onClick={() => toggleSound(sound.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                  isPlaying
                    ? 'bg-sky-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sound.name}</span>
                </div>
                <span className={`text-[10px] ${isPlaying ? 'text-slate-900' : 'text-slate-400'}`}>
                  {isPlaying ? 'Putar' : sound.desc.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Volume Slider & Controls */}
        {activeSoundId && (
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-3">
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

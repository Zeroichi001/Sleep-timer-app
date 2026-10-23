import React, { useState, useEffect } from 'react';
import { Moon, Sun, Clock, Zap } from 'lucide-react';

interface NightDimOverlayProps {
  isDimmed: boolean;
  onWake: () => void;
  remainingSeconds: number;
  isRunning: boolean;
}

export const NightDimOverlay: React.FC<NightDimOverlayProps> = ({
  isDimmed,
  onWake,
  remainingSeconds,
  isRunning,
}) => {
  const [clockPos, setClockPos] = useState({ x: 0, y: 0 });

  // Burn-in prevention slow drift
  useEffect(() => {
    if (!isDimmed) return;
    const interval = setInterval(() => {
      setClockPos({
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 30,
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [isDimmed]);

  if (!isDimmed) return null;

  const hrs = Math.floor(remainingSeconds / 3600);
  const mins = Math.floor((remainingSeconds % 3600) / 60);
  const secs = remainingSeconds % 60;

  return (
    <div
      onClick={onWake}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer select-none transition-opacity duration-700 animate-in fade-in"
    >
      <div
        className="flex flex-col items-center text-center transition-transform duration-1000 ease-out"
        style={{ transform: `translate(${clockPos.x}px, ${clockPos.y}px)` }}
      >
        <Moon className="w-6 h-6 text-amber-500/30 mb-3" />

        {isRunning ? (
          <div className="font-mono text-3xl font-light text-amber-400/50 tracking-wider">
            {hrs > 0 && <span>{String(hrs).padStart(2, '0')}:</span>}
            <span>{String(mins).padStart(2, '0')}</span>:
            <span>{String(secs).padStart(2, '0')}</span>
          </div>
        ) : (
          <div className="text-xl font-light text-slate-600">Somno Standby</div>
        )}

        <p className="mt-4 text-[11px] text-slate-700 font-mono tracking-widest uppercase">
          Layar AMOLED Redup • Ketuk di mana saja untuk menyalakan
        </p>
      </div>
    </div>
  );
};

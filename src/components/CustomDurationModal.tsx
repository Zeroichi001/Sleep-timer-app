import React, { useState } from 'react';
import { X, Clock, Check } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface CustomDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDurationSeconds: number;
  onSetDuration: (seconds: number) => void;
}

export const CustomDurationModal: React.FC<CustomDurationModalProps> = ({
  isOpen,
  onClose,
  currentDurationSeconds,
  onSetDuration,
}) => {
  const [hours, setHours] = useState(Math.floor(currentDurationSeconds / 3600));
  const [minutes, setMinutes] = useState(Math.floor((currentDurationSeconds % 3600) / 60));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSecs = (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60;
    // Cap up to 5 hours (300 minutes = 18,000 seconds)
    const clamped = Math.max(60, Math.min(300 * 60, totalSecs));
    soundEngine.playTick(1.2);
    onSetDuration(clamped);
    onClose();
  };

  const quickMinutes = [
    { label: '15m', val: 15 },
    { label: '30m', val: 30 },
    { label: '45m', val: 45 },
    { label: '1j', val: 60 },
    { label: '1.5j', val: 90 },
    { label: '2j', val: 120 },
    { label: '3j', val: 180 },
    { label: '4j', val: 240 },
    { label: '5j', val: 300 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xs rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden p-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Durasi Kustom</h3>
              <p className="text-[11px] text-slate-400">Atur waktu spesifik (1m s/d 5 jam)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex items-center justify-center gap-3">
            {/* Hours up to 5 */}
            <div className="flex flex-col items-center">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Jam (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={hours}
                onChange={(e) => setHours(Math.max(0, Math.min(5, Number(e.target.value))))}
                className="w-16 h-14 text-center text-2xl font-bold font-mono rounded-2xl bg-slate-950 border border-slate-700 text-sky-400 focus:outline-none focus:border-sky-400"
              />
            </div>

            <span className="text-2xl font-bold text-slate-600 self-end mb-3">:</span>

            {/* Minutes (0-59) */}
            <div className="flex flex-col items-center">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Menit (0-59)</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                className="w-16 h-14 text-center text-2xl font-bold font-mono rounded-2xl bg-slate-950 border border-slate-700 text-sky-400 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Quick chips up to 5 hours */}
          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 block">Pilihan Cepat (s/d 5 Jam)</span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {quickMinutes.map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    setHours(Math.floor(item.val / 60));
                    setMinutes(item.val % 60);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors active:scale-95"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Durasi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

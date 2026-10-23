import React, { useState } from 'react';
import { Preset } from '../types';
import { soundEngine } from '../services/soundEngine';
import {
  Clock,
  BookmarkPlus,
  Trash2,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface PresetsManagerProps {
  currentDurationSeconds: number;
  onSelectDuration: (seconds: number) => void;
  disabled: boolean;
}

export const PresetsManager: React.FC<PresetsManagerProps> = ({
  currentDurationSeconds,
  onSelectDuration,
  disabled,
}) => {
  // Empty default presets as requested by user
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem('somno_presets');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const currentMinutes = Math.round(currentDurationSeconds / 60);
  const [newDuration, setNewDuration] = useState(currentMinutes);

  const savePresets = (updated: Preset[]) => {
    setPresets(updated);
    localStorage.setItem('somno_presets', JSON.stringify(updated));
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const minutes = Math.max(1, Math.min(300, Number(newDuration) || 30));
    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      durationMinutes: minutes,
      iconName: 'Sparkles',
      isDefault: false,
    };
    const updated = [...presets, newPreset];
    savePresets(updated);
    setIsAdding(false);
    setNewTitle('');
    soundEngine.playTick(1.2);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.filter((p) => p.id !== id);
    savePresets(updated);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-1.5">
      {/* If presets exist, show clean chip list */}
      {presets.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Preset Tersimpan ({presets.length})</span>
            </span>

            {!disabled && !isAdding && (
              <button
                onClick={() => {
                  setNewDuration(currentMinutes);
                  setNewTitle(`Preset ${currentMinutes > 60 ? `${Math.floor(currentMinutes/60)}j ${currentMinutes%60 ? `${currentMinutes%60}m` : ''}` : `${currentMinutes}m`}`);
                  setIsAdding(true);
                }}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
              >
                <BookmarkPlus className="w-3 h-3" />
                <span>+ Simpan</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {presets.map((preset) => {
              const isSelected = currentMinutes === preset.durationMinutes;
              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    if (disabled) return;
                    soundEngine.playTick(1.1);
                    onSelectDuration(preset.durationMinutes * 60);
                  }}
                  className={`group relative flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-400/60 shadow-lg shadow-sky-500/10 font-bold'
                      : 'bg-slate-900/80 text-slate-300 border border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700'
                  } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Sparkles className={`w-3 h-3 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{preset.title}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded-md font-mono ${
                      isSelected ? 'bg-sky-500/30 text-sky-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {preset.durationMinutes > 60
                      ? `${Math.floor(preset.durationMinutes / 60)}j${preset.durationMinutes % 60 ? ` ${preset.durationMinutes % 60}m` : ''}`
                      : `${preset.durationMinutes}m`}
                  </span>

                  {!disabled && (
                    <button
                      onClick={(e) => handleDeletePreset(preset.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 ml-1 transition-opacity"
                      title="Hapus preset"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* When no presets exist, show a minimal, subtle button to save current duration as preset */}
      {presets.length === 0 && !isAdding && !disabled && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setNewDuration(currentMinutes);
              setNewTitle(`Favorit ${currentMinutes > 60 ? `${Math.floor(currentMinutes/60)}j ${currentMinutes%60 ? `${currentMinutes%60}m` : ''}` : `${currentMinutes}m`}`);
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-slate-400 hover:text-sky-300 hover:bg-slate-900 border border-slate-800/80 transition-all active:scale-95"
          >
            <BookmarkPlus className="w-3 h-3 text-sky-400" />
            <span>Simpan durasi ini sebagai preset</span>
          </button>
        </div>
      )}

      {/* Quick Add Custom Preset Form */}
      {isAdding && (
        <form
          onSubmit={handleAddPreset}
          className="p-3 rounded-2xl bg-slate-900 border border-sky-500/40 shadow-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>Simpan Preset Baru (s/d 5 jam)</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nama Preset (cth: Tidur Siang)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              maxLength={24}
              required
              autoFocus
            />
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl px-2">
              <input
                type="number"
                min="1"
                max="300"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-12 py-1 text-xs text-white bg-transparent text-right focus:outline-none font-mono"
              />
              <span className="text-[11px] text-slate-400">m</span>
            </div>
            <button
              type="submit"
              className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

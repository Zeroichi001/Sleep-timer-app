import React, { useRef, useState, useCallback, useEffect } from 'react';
import { soundEngine } from '../services/soundEngine';
import { Edit3, Moon, Sparkles } from 'lucide-react';
import { ThemeMode } from '../types';

interface TurnWheelProps {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  themeMode: ThemeMode;
  onDurationChange: (seconds: number) => void;
  onOpenCustomModal: () => void;
}

export const TurnWheel: React.FC<TurnWheelProps> = ({
  durationSeconds,
  remainingSeconds,
  isRunning,
  themeMode,
  onDurationChange,
  onOpenCustomModal,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Turn wheel dial range: 1 minute up to 180 minutes (3 hours)
  const MAX_MINUTES = 180;
  const MIN_MINUTES = 1;

  // Active display duration in minutes
  const activeSeconds = isRunning ? remainingSeconds : durationSeconds;
  const currentMinutes = Math.max(1, Math.round(activeSeconds / 60));

  const lastMinuteRef = useRef<number>(Math.min(MAX_MINUTES, currentMinutes));

  useEffect(() => {
    lastMinuteRef.current = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, currentMinutes));
  }, [currentMinutes]);

  // Calculate ratio for arc:
  // If running: remaining time / total duration
  // If idle: clamp minutes / 180 (even if custom duration is set to 4h or 5h, dial fills gracefully)
  const displayRatio = isRunning
    ? durationSeconds > 0
      ? Math.max(0, Math.min(1, remainingSeconds / durationSeconds))
      : 0
    : Math.max(0.005, Math.min(1, currentMinutes / MAX_MINUTES));

  // Helper to convert client coordinates to minutes with strict boundary clamping
  const calculateMinutesFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;

      // Angle in degrees from 12 o'clock (0 = top, 90 = right, 180 = bottom, 270 = left)
      let degrees = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (degrees < 0) degrees += 360;

      // Raw minutes corresponding to angle (0° to 360° -> 0m to 180m)
      const rawMinutes = (degrees / 360) * MAX_MINUTES;
      const prev = lastMinuteRef.current;
      let nextMinutes = Math.round(rawMinutes);

      // Strict boundary clamping between 1m and 180m (3 hours):
      // If previous value was near 3h (>= 120m) and pointer crosses 12 o'clock into low quadrant (< 60m),
      // DO NOT wrap to 1m — clamp hard at 180m!
      if (prev >= 120 && rawMinutes < 60) {
        nextMinutes = MAX_MINUTES;
      }
      // If previous value was near 1m (<= 60m) and pointer crosses 12 o'clock into high quadrant (> 120m),
      // DO NOT wrap to 180m — clamp hard at 1m!
      else if (prev <= 60 && rawMinutes > 120) {
        nextMinutes = MIN_MINUTES;
      } else {
        nextMinutes = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, nextMinutes));
      }

      if (nextMinutes !== lastMinuteRef.current) {
        lastMinuteRef.current = nextMinutes;
        soundEngine.playTick(1 + (nextMinutes / MAX_MINUTES) * 0.4);
        onDurationChange(nextMinutes * 60);
      }
    },
    [onDurationChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRunning) return;
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    calculateMinutesFromEvent(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isRunning) return;
    calculateMinutesFromEvent(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Wheel scroll handler (for trackpad / mousewheel) with clamping
  const handleWheel = (e: React.WheelEvent) => {
    if (isRunning) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    const clampedCurrent = Math.min(MAX_MINUTES, currentMinutes);
    const newMinutes = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, clampedCurrent + delta));
    if (newMinutes !== currentMinutes) {
      soundEngine.playTick();
      onDurationChange(newMinutes * 60);
    }
  };

  // Estimated Bedtime / Stop time calculation
  const targetDate = new Date(Date.now() + activeSeconds * 1000);
  const formattedStopTime = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Formatting hours, minutes, seconds
  const hrs = Math.floor(activeSeconds / 3600);
  const mins = Math.floor((activeSeconds % 3600) / 60);
  const secs = activeSeconds % 60;

  // Geometry parameters
  const size = 300;
  const strokeWidth = 14;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2; // 150

  // Arc stroke offset:
  // Circle is rotated -90deg around center in SVG so it starts at 12 o'clock.
  // strokeDashoffset uncovers the arc clockwise as displayRatio increases.
  const strokeDashoffset = circumference * (1 - displayRatio);

  // Exact Knob position calculation:
  // Angle starts at 12 o'clock (0°) and sweeps clockwise by displayRatio * 360°.
  // In unrotated SVG coordinate system:
  // theta from +X axis = (displayRatio * 360) - 90 degrees.
  const knobAngleDeg = displayRatio * 360;
  const knobAngleRad = ((knobAngleDeg - 90) * Math.PI) / 180;
  const knobX = center + radius * Math.cos(knobAngleRad);
  const knobY = center + radius * Math.sin(knobAngleRad);

  // Theme colors
  const themeColors = {
    amoled: {
      accent: '#38bdf8', // Sky 400
      track: '#161d2a',
      knob: '#ffffff',
      pulseBg: 'rgba(56, 189, 248, 0.08)',
    },
    slate: {
      accent: '#818cf8', // Indigo 400
      track: '#1b2234',
      knob: '#c7d2fe',
      pulseBg: 'rgba(129, 140, 248, 0.08)',
    },
    amber: {
      accent: '#fbbf24', // Amber 400
      track: '#261e15',
      knob: '#fef3c7',
      pulseBg: 'rgba(251, 191, 36, 0.08)',
    },
  }[themeMode];

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-3">
      {/* Dial Wheel Container without outer CSS rotation to guarantee perfect alignment */}
      <div
        className="relative flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="filter drop-shadow-xl select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={themeColors.accent} stopOpacity="0.8" />
              <stop offset="100%" stopColor={themeColors.accent} stopOpacity="1" />
            </linearGradient>
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background circle track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={themeColors.track}
            strokeWidth={strokeWidth}
            className="transition-colors duration-300"
          />

          {/* Tick Marks around the perimeter */}
          {Array.from({ length: 36 }).map((_, i) => {
            const tickAngle = ((i * 10 - 90) * Math.PI) / 180;
            const isMajor = i % 3 === 0;
            const innerR = radius - (isMajor ? 11 : 6);
            const outerR = radius - 3;
            const x1 = center + innerR * Math.cos(tickAngle);
            const y1 = center + innerR * Math.sin(tickAngle);
            const x2 = center + outerR * Math.cos(tickAngle);
            const y2 = center + outerR * Math.sin(tickAngle);

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? '#475569' : '#233044'}
                strokeWidth={isMajor ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}

          {/* Progress Arc: Starts at top (12 o'clock) and sweeps clockwise */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#arcGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            filter="url(#glowEffect)"
            className={isRunning ? 'transition-all duration-300 ease-linear' : 'transition-none'}
          />

          {/* Rotary Knob Handle: Exactly aligned with the tail of the arc */}
          <g transform={`translate(${knobX}, ${knobY})`} className="cursor-pointer">
            <circle
              r={strokeWidth * 1.15}
              fill="#0b1120"
              stroke={themeColors.accent}
              strokeWidth="3"
              filter="drop-shadow(0px 2px 7px rgba(0,0,0,0.85))"
            />
            <circle r={strokeWidth * 0.45} fill={themeColors.knob} />
          </g>
        </svg>

        {/* Center Content: Large Digits, Estimated Bedtime, Custom Time Button */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          {/* Subtle Ambient Pulse Background when running */}
          {isRunning && (
            <div
              className="absolute w-44 h-44 rounded-full animate-pulse-subtle -z-10"
              style={{ backgroundColor: themeColors.pulseBg }}
            />
          )}

          {/* Status Label */}
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-1 bg-slate-900/80 border border-slate-700/60 text-slate-300">
            {isRunning ? (
              <>
                <span className="w-2 h-2 rounded-full animate-ping mr-0.5" style={{ backgroundColor: themeColors.accent }} />
                <span>Timer Berjalan</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-slate-400" />
                <span>Putar Wheel</span>
              </>
            )}
          </div>

          {/* Main Time Counter Display */}
          {isRunning ? (
            <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
              {hrs > 0 && <span>{String(hrs).padStart(2, '0')}:</span>}
              <span>{String(mins).padStart(2, '0')}</span>:
              <span className="text-3xl sm:text-4xl" style={{ color: themeColors.accent }}>
                {String(secs).padStart(2, '0')}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight text-white font-mono">
                  {hrs > 0 ? `${hrs}j ${mins > 0 ? `${mins}m` : ''}` : `${currentMinutes}`}
                </span>
                {hrs === 0 && <span className="text-xl font-medium text-slate-400">menit</span>}
              </div>
              <span className="text-xs text-slate-400 font-medium mt-0.5">
                (1m - 3 jam)
              </span>
            </div>
          )}

          {/* Estimated Stop Time Subtitle */}
          <div className="mt-2 text-xs font-medium text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400/80" />
            <span>
              {isRunning ? 'Berhenti pada ' : 'Estimasi mati '}
              <strong className="text-slate-200 font-semibold">{formattedStopTime}</strong>
            </span>
          </div>

          {/* Custom Duration Button (clickable inside center) */}
          {!isRunning && (
            <button
              onClick={onOpenCustomModal}
              className="pointer-events-auto mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 transition-all shadow-sm active:scale-95"
              title="Ketik durasi kustom hingga 5 jam"
            >
              <Edit3 className="w-3 h-3 text-slate-400" />
              <span>Kustom (s/d 5j)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

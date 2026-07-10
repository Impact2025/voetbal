import { useRef } from 'react';

interface SkillRaterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  color?: string;
}

const SkillRater = ({ label, value, onChange, disabled = false, color = '#00FF9D' }: SkillRaterProps) => {
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const clamp = (v: number) => Math.max(1, Math.min(10, v));

  const fromPointer = (clientX: number) => {
    if (!barRef.current) return value;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return clamp(Math.round(pct * 10) || 1);
  };

  const emit = (next: number) => {
    if (next === value) return;
    onChange(next);
  };

  const onDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    emit(fromPointer(e.clientX));
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || disabled) return;
    emit(fromPointer(e.clientX));
  };

  const onUp = () => { dragging.current = false; };

  const fillPct = (value / 10) * 100;
  const thumbLeft = `calc(${fillPct}% - 7px)`;

  const valueColor = value >= 8 ? color : value >= 5 ? '#374151' : '#f97316';

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 leading-none">{label}</span>
        <span
          className="text-xs font-black tabular-nums w-6 text-center py-0.5 rounded leading-none"
          style={{ color: valueColor }}
        >
          {value}
        </span>
      </div>

      {/* Track */}
      <div
        ref={barRef}
        className={`relative h-2 rounded-full select-none touch-none ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
        style={{ backgroundColor: '#e5e7eb' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
          style={{ width: `${fillPct}%`, backgroundColor: color, transition: 'width 60ms linear' }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: thumbLeft, backgroundColor: color, transition: 'left 60ms linear' }}
        />
      </div>
    </div>
  );
};

export default SkillRater;

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
    return clamp(Math.ceil(pct * 10));
  };

  const onDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onChange(fromPointer(e.clientX));
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || disabled) return;
    onChange(fromPointer(e.clientX));
  };

  const onUp = () => { dragging.current = false; };

  const label_color = value >= 9 ? '#FFD700' : value >= 7 ? color : value >= 5 ? '#64748b' : value >= 3 ? '#f97316' : '#ef4444';

  return (
    <div className={disabled ? 'opacity-55' : ''}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-600 leading-none">{label}</span>
        <span
          className="text-sm font-black tabular-nums px-1.5 py-0.5 rounded-md leading-none"
          style={{ color: label_color, backgroundColor: `${label_color}18` }}
        >
          {value}
        </span>
      </div>

      <div
        ref={barRef}
        className={`flex items-end gap-[3px] h-5 select-none touch-none ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1;
          const filled = n <= value;
          const isLast = n === value;
          return (
            <div
              key={n}
              className="flex-1 rounded-t-sm transition-all duration-100"
              style={{
                height: filled ? '100%' : '42%',
                backgroundColor: filled ? color : '#d1d5db',
                boxShadow: isLast ? `0 0 6px ${color}90` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SkillRater;

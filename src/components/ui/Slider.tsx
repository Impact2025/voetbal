import type { ChangeEvent } from 'react';
import { NEON_COLOR } from '../../utils/constants';

interface SliderProps {
  label: string;
  value: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  light?: boolean;
}

const Slider = ({ label, value, onChange, min = 0, max = 10, step = 1, disabled = false, light = false }: SliderProps) => (
  <div className={disabled ? 'opacity-50' : ''}>
    <label className={`block text-sm font-medium capitalize mb-1.5 ${light ? 'text-gray-500' : 'text-gray-400'}`}>{label}</label>
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full h-1.5 rounded-full appearance-none ${light ? 'bg-gray-200 slider-thumb-light' : 'bg-gray-700 slider-thumb'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ touchAction: 'none' }}
      />
      <span className="font-bold text-base w-6 text-center tabular-nums shrink-0" style={{ color: NEON_COLOR }}>{value}</span>
    </div>
    <style>{`
      .slider-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: ${NEON_COLOR}; border: 2px solid #1A1A1A; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; box-shadow: 0 0 0 2px ${NEON_COLOR}30; }
      .slider-thumb::-moz-range-thumb { width: 20px; height: 20px; background: ${NEON_COLOR}; border: 2px solid #1A1A1A; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; }
      .slider-thumb-light::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; background: ${NEON_COLOR}; border: 2px solid #ffffff; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; box-shadow: 0 1px 4px rgba(0,0,0,0.15), 0 0 0 2px ${NEON_COLOR}25; }
      .slider-thumb-light::-moz-range-thumb { width: 18px; height: 18px; background: ${NEON_COLOR}; border: 2px solid #ffffff; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; }
    `}</style>
  </div>
);

export default Slider;

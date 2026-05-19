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
}

const Slider = ({ label, value, onChange, min = 0, max = 10, step = 1, disabled = false }: SliderProps) => (
  <div className={disabled ? 'opacity-50' : ''}>
    <label className="block text-sm font-medium text-gray-400 capitalize mb-2">{label}</label>
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full h-3 bg-gray-700 rounded-lg appearance-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} slider-thumb`}
        style={{ touchAction: 'none' }}
      />
      <span className="font-bold text-lg w-8 text-center" style={{ color: NEON_COLOR }}>{value}</span>
    </div>
    <style>{`
      .slider-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 28px; height: 28px; background: ${NEON_COLOR}; border: 3px solid #1A1A1A; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; box-shadow: 0 0 0 2px ${NEON_COLOR}40; }
      .slider-thumb::-moz-range-thumb { width: 28px; height: 28px; background: ${NEON_COLOR}; border: 3px solid #1A1A1A; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; }
    `}</style>
  </div>
);

export default Slider;

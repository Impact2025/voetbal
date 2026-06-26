import { useState, useEffect } from 'react';
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

const Slider = ({ label, value, onChange, min = 0, max = 10, step = 1, disabled = false, light = false }: SliderProps) => {
  const [inputVal, setInputVal] = useState(String(value));

  useEffect(() => { setInputVal(String(value)); }, [value]);

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    const n = parseInt(e.target.value);
    if (!isNaN(n) && n >= min && n <= max) onChange(e);
  };

  const handleNumberBlur = () => {
    const n = parseInt(inputVal);
    if (isNaN(n) || n < min || n > max) setInputVal(String(value));
  };

  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <label className={`block text-sm font-medium mb-1.5 ${light ? 'text-gray-500' : 'text-gray-400'}`}>{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`flex-1 h-1.5 rounded-full appearance-none ${light ? 'bg-gray-200 slider-thumb-light' : 'bg-gray-700 slider-thumb'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          style={{ touchAction: 'none' }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputVal}
          onChange={handleNumberChange}
          onBlur={handleNumberBlur}
          disabled={disabled}
          className={`w-12 text-center font-bold text-sm tabular-nums rounded-lg border px-1 py-0.5 outline-none transition-colors ${
            light
              ? 'bg-white border-gray-200 text-gray-800 focus:border-emerald-400'
              : 'bg-gray-800 border-gray-700 focus:border-emerald-500'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{ color: NEON_COLOR }}
        />
      </div>
      <style>{`
        .slider-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: ${NEON_COLOR}; border: 2px solid #1A1A1A; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; box-shadow: 0 0 0 2px ${NEON_COLOR}30; }
        .slider-thumb::-moz-range-thumb { width: 20px; height: 20px; background: ${NEON_COLOR}; border: 2px solid #1A1A1A; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; }
        .slider-thumb-light::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; background: ${NEON_COLOR}; border: 2px solid #ffffff; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; box-shadow: 0 1px 4px rgba(0,0,0,0.15), 0 0 0 2px ${NEON_COLOR}25; }
        .slider-thumb-light::-moz-range-thumb { width: 18px; height: 18px; background: ${NEON_COLOR}; border: 2px solid #ffffff; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
};

export default Slider;

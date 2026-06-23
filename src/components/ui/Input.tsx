import type { ChangeEvent } from 'react';

interface InputProps {
  label?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
  light?: boolean;
}

const Input = ({ label, value, onChange, placeholder, type = 'text', disabled = false, className = '', autoComplete, light = false }: InputProps) => (
  <div className={className}>
    {label && <label className={`block text-sm font-medium mb-2 ${light ? 'text-gray-600' : 'text-gray-400'}`}>{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete ?? (type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off')}
      className={`w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--neon-color] ${light ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-offset-white' : 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:ring-offset-gray-900'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
  </div>
);

export default Input;

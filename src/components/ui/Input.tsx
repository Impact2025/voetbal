import type { ChangeEvent } from 'react';

interface InputProps {
  label?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}

const Input = ({ label, value, onChange, placeholder, type = 'text', disabled = false, className = '' }: InputProps) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[--neon-color] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
  </div>
);

export default Input;

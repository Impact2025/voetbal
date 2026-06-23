import type { ChangeEvent, ReactNode } from 'react';

interface TextareaProps {
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  light?: boolean;
  rows?: number;
}

const Textarea = ({ label, value, onChange, placeholder, disabled = false, className = '', children, light = false, rows = 4 }: TextareaProps) => (
  <div className={className}>
    <div className="flex justify-between items-center mb-1.5">
      {label && <label className={`block text-sm font-medium ${light ? 'text-gray-500' : 'text-gray-400'}`}>{label}</label>}
      {children}
    </div>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`w-full rounded-xl px-3 py-3 text-sm resize-none transition-colors focus:outline-none focus:ring-2 ${
        light
          ? 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-offset-white focus:ring-[--neon-color] focus:border-transparent'
          : 'bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:ring-offset-gray-900 focus:ring-[--neon-color]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
  </div>
);

export default Textarea;

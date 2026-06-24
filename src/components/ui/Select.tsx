import type { ChangeEvent, ReactNode } from 'react';

interface SelectProps {
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  light?: boolean;
}

const Select = ({ label, value, onChange, children, disabled = false, className = '', light = false }: SelectProps) => (
  <div className={className}>
    {label && <label className={`block text-sm font-medium mb-2 ${light ? 'text-gray-600' : 'text-gray-400'}`}>{label}</label>}
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--neon-color] ${light ? 'bg-white border-gray-300 text-gray-900 focus:ring-offset-white' : 'bg-gray-900/50 border-gray-700 text-white focus:ring-offset-gray-900'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </select>
  </div>
);

export default Select;

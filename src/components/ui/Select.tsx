import type { ChangeEvent, ReactNode } from 'react';

interface SelectProps {
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

const Select = ({ label, value, onChange, children, disabled = false, className = '' }: SelectProps) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[--neon-color] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </select>
  </div>
);

export default Select;

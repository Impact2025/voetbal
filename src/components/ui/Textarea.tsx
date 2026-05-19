import type { ChangeEvent, ReactNode } from 'react';

interface TextareaProps {
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

const Textarea = ({ label, value, onChange, placeholder, disabled = false, className = '', children }: TextareaProps) => (
  <div className={className}>
    <div className="flex justify-between items-center mb-2">
      {label && <label className="block text-sm font-medium text-gray-400">{label}</label>}
      {children}
    </div>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={4}
      disabled={disabled}
      className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[--neon-color] resize-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
  </div>
);

export default Textarea;

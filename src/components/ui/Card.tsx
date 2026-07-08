import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  light?: boolean;
}

const Card = ({ children, className = '', light = true }: CardProps) => (
  <div className={light
    ? `bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm ${className}`
    : `bg-black/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg shadow-black/30 ${className}`
  }>
    {children}
  </div>
);

export default Card;

import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps) => (
  <div className={`bg-black/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg shadow-black/30 ${className}`}>
    {children}
  </div>
);

export default Card;

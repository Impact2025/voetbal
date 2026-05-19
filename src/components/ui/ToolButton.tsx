import React, { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

const ToolButton = React.forwardRef<HTMLButtonElement, ToolButtonProps>(
  ({ children, className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-lg bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/70 hover:text-white transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[#00FF9D] ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);

ToolButton.displayName = 'ToolButton';

export default ToolButton;

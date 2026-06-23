import React, { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  light?: boolean;
}

const ToolButton = React.forwardRef<HTMLButtonElement, ToolButtonProps>(
  ({ children, className = '', light = false, ...props }, ref) => (
    <button
      ref={ref}
      className={light
        ? `flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-green-600 ${className}`
        : `flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-lg bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/70 hover:text-white transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[#00FF9D] ${className}`
      }
      {...props}
    >
      {children}
    </button>
  )
);

ToolButton.displayName = 'ToolButton';

export default ToolButton;

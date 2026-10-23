import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5',
    };

    const variants = {
      primary: 'bg-[#4F46E5] text-white hover:bg-[#4338CA] focus:ring-[#4F46E5] shadow-xs',
      gradient: 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white hover:opacity-95 focus:ring-[#4F46E5] shadow-xs',
      secondary: 'bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF] border border-[#C7D2FE] focus:ring-[#4F46E5]',
      outline: 'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] focus:ring-[#4F46E5]',
      ghost: 'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

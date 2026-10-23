'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1C1917]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${widths[maxWidth]} bg-white rounded-2xl border border-[#E4DDD2] shadow-xl overflow-hidden z-10 my-8`}
      >
        <div className="px-6 py-5 border-b border-[#E4DDD2] flex items-center justify-between">
          <div>
            <h3 id="modal-title" className="text-lg font-semibold text-[#1C1917]">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#625D56] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[#625D56] hover:text-[#1C1917] p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'forest',
  showLabel = false,
  className = '',
}: {
  value: number;
  max?: number;
  variant?: 'forest' | 'terracotta' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const fills = {
    forest: 'bg-[#1B4332]',
    terracotta: 'bg-[#C85A32]',
    warning: 'bg-amber-500',
    danger: 'bg-red-600',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-[#625D56] mb-1 font-medium">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-2.5 bg-[#F4EFE6] rounded-full overflow-hidden border border-[#E4DDD2]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${fills[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

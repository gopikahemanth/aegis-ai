import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const typeStyles: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: 'bg-emerald-950/90', border: 'border-emerald-800/80', text: 'text-emerald-200' },
  error:   { bg: 'bg-red-950/90', border: 'border-red-800/80', text: 'text-red-200' },
  warning: { bg: 'bg-amber-950/90', border: 'border-amber-800/80', text: 'text-amber-200' },
  info:    { bg: 'bg-indigo-950/90', border: 'border-indigo-800/80', text: 'text-indigo-200' },
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const style = typeStyles[toast.type];

  return (
    <div
      role="alert"
      className={[
        'flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-xl',
        'pointer-events-auto transition-all animate-slideUp min-w-[300px] max-w-md',
        style.bg,
        style.border,
        style.text,
      ].join(' ')}
    >
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-current opacity-70 hover:opacity-100 p-1 rounded cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
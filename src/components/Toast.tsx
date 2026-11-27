import React from 'react';
import { Check, ShieldAlert, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ToastProps {
  message: string | null | undefined;
  type?: 'success' | 'error';
  onClose?: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-4 right-4 z-[120] flex items-center gap-2.5 px-4 py-3 text-white rounded-xl shadow-lg border text-sm font-medium animate-slide-in",
        type === 'error'
          ? "bg-rose-600 border-rose-500"
          : "bg-slate-900 border-slate-800"
      )}
    >
      {type === 'error' ? (
        <ShieldAlert className="w-4 h-4 text-rose-200 shrink-0" />
      ) : (
        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
      )}
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-1 text-slate-400 hover:text-white transition-colors p-0.5 rounded focus:outline-none"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

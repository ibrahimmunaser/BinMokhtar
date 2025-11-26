'use client';

import { useEffect } from 'react';
import { CheckCircle, X, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  message: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
  imageUrl?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Toast({
  message,
  description,
  type = 'success',
  duration = 5000,
  onClose,
  imageUrl,
  actionLabel,
  onAction,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-md overflow-hidden rounded-lg shadow-2xl ring-1",
        "bg-surface-2 ring-line/50",
        "animate-in slide-in-from-top-full duration-300"
      )}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon or Image */}
          <div className="flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={message}
                className="h-16 w-16 rounded object-cover"
              />
            ) : (
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                type === 'success' && "bg-green-100 text-green-600",
                type === 'error' && "bg-red-100 text-red-600",
                type === 'info' && "bg-bmr-ink/10 text-bmr-ink"
              )}>
                {type === 'success' && <CheckCircle className="h-5 w-5" />}
                {type === 'info' && <ShoppingBag className="h-5 w-5" />}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pt-0.5">
            <p className="text-sm font-semibold text-bmr-black">
              {message}
            </p>
            {description && (
              <p className="mt-1 text-sm text-bmr-muted">
                {description}
              </p>
            )}
            
            {/* Action Button */}
            {actionLabel && onAction && (
              <button
                onClick={onAction}
                className="mt-3 text-sm font-medium text-bmr-ink hover:text-bmr-fg transition-colors underline"
              >
                {actionLabel}
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-md p-1 hover:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-bmr-ink transition-colors"
            aria-label="Close notification"
          >
            <X className="h-5 w-5 text-bmr-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}


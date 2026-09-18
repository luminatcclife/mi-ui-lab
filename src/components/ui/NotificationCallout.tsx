import React from 'react';

export interface NotificationCalloutProps {
  type?: 'info' | 'success' | 'warning' | 'alert';
  title: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const typeMap = {
  info: {
    container: 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 text-sky-900 dark:text-sky-200',
    title: 'text-sky-950 dark:text-sky-300',
    icon: 'ℹ',
  },
  success: {
    container: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
    title: 'text-emerald-950 dark:text-emerald-300',
    icon: '✓',
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200',
    title: 'text-amber-950 dark:text-amber-300',
    icon: '⚠',
  },
  alert: {
    container: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-200',
    title: 'text-rose-950 dark:text-rose-300',
    icon: '✕',
  },
};

export function NotificationCallout({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}: NotificationCalloutProps) {
  const config = typeMap[type] || typeMap.info;

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border p-4 backdrop-blur-sm ${config.container} ${className}`}
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-xs mt-0.5">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0 pr-4">
        <h4 className={`font-semibold text-sm leading-tight ${config.title}`}>
          {title}
        </h4>
        <p className="mt-1 text-xs leading-relaxed opacity-90">{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-current opacity-60 hover:opacity-100 cursor-pointer text-sm"
        >
          ✕
        </button>
      )}
    </div>
  );
}

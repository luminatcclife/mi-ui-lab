import React from 'react';

export interface StatusBadgeProps {
  status?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  label: string;
  withDot?: boolean;
  className?: string;
}

const statusConfig = {
  neutral: {
    bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-500 dark:bg-zinc-400',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  danger: {
    bg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    dot: 'bg-rose-500 dark:bg-rose-400',
  },
  info: {
    bg: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20',
    dot: 'bg-sky-500 dark:bg-sky-400',
  },
  purple: {
    bg: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
    dot: 'bg-violet-500 dark:bg-violet-400',
  },
};

export function StatusBadge({
  status = 'neutral',
  label,
  withDot = true,
  className = '',
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide whitespace-nowrap ${config.bg} ${className}`}
    >
      {withDot && (
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      )}
      <span>{label}</span>
    </span>
  );
}

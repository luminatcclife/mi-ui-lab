import React from 'react';
import { AccentColor } from '../../types';

export type AccentCardVariant =
  | 'default'
  | 'accent-top'
  | 'accent-left'
  | 'ambient-glow'
  | 'metric'
  | 'actionable';

export interface AccentCardProps {
  id?: string;
  variant?: AccentCardVariant;
  accentColor?: AccentColor;
  title: string;
  subtitle?: string;
  badge?: string;
  metric?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const colorMap: Record<
  AccentColor,
  {
    border: string;
    bgAccent: string;
    glow: string;
    badgeBg: string;
    buttonBg: string;
    buttonHover: string;
    metricText: string;
  }
> = {
  indigo: {
    border: 'border-indigo-500',
    bgAccent: 'bg-indigo-500',
    glow: 'from-indigo-500/25 via-indigo-500/5 to-transparent',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
    buttonBg: 'bg-indigo-600 text-white',
    buttonHover: 'hover:bg-indigo-500',
    metricText: 'text-indigo-600 dark:text-indigo-400',
  },
  emerald: {
    border: 'border-emerald-500',
    bgAccent: 'bg-emerald-500',
    glow: 'from-emerald-500/25 via-emerald-500/5 to-transparent',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
    buttonBg: 'bg-emerald-600 text-white',
    buttonHover: 'hover:bg-emerald-500',
    metricText: 'text-emerald-600 dark:text-emerald-400',
  },
  violet: {
    border: 'border-violet-500',
    bgAccent: 'bg-violet-500',
    glow: 'from-violet-500/25 via-violet-500/5 to-transparent',
    badgeBg: 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300',
    buttonBg: 'bg-violet-600 text-white',
    buttonHover: 'hover:bg-violet-500',
    metricText: 'text-violet-600 dark:text-violet-400',
  },
  amber: {
    border: 'border-amber-500',
    bgAccent: 'bg-amber-500',
    glow: 'from-amber-500/25 via-amber-500/5 to-transparent',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300',
    buttonBg: 'bg-amber-600 text-white',
    buttonHover: 'hover:bg-amber-500',
    metricText: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    border: 'border-rose-500',
    bgAccent: 'bg-rose-500',
    glow: 'from-rose-500/25 via-rose-500/5 to-transparent',
    badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
    buttonBg: 'bg-rose-600 text-white',
    buttonHover: 'hover:bg-rose-500',
    metricText: 'text-rose-600 dark:text-rose-400',
  },
  cyan: {
    border: 'border-cyan-500',
    bgAccent: 'bg-cyan-500',
    glow: 'from-cyan-500/25 via-cyan-500/5 to-transparent',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-300',
    buttonBg: 'bg-cyan-600 text-white',
    buttonHover: 'hover:bg-cyan-500',
    metricText: 'text-cyan-600 dark:text-cyan-400',
  },
  zinc: {
    border: 'border-zinc-400 dark:border-zinc-500',
    bgAccent: 'bg-zinc-500',
    glow: 'from-zinc-500/15 via-zinc-500/5 to-transparent',
    badgeBg: 'bg-zinc-500/10 border-zinc-400/30 text-zinc-700 dark:text-zinc-300',
    buttonBg: 'bg-zinc-800 dark:bg-zinc-800 text-zinc-100',
    buttonHover: 'hover:bg-zinc-700',
    metricText: 'text-zinc-800 dark:text-zinc-200',
  },
};

export function AccentCard({
  id,
  variant = 'default',
  accentColor = 'indigo',
  title,
  subtitle,
  badge,
  metric,
  trend,
  actionLabel,
  onAction,
  className = '',
  children,
}: AccentCardProps) {
  const styles = colorMap[accentColor] || colorMap.indigo;

  return (
    <div
      id={id}
      className={`group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/90 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50 ${className}`}
    >
      {/* Resplandor ambiental para variante ambient-glow */}
      {variant === 'ambient-glow' && (
        <div
          className={`pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br ${styles.glow} blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-60 dark:opacity-70`}
        />
      )}

      {/* Acento superior */}
      {variant === 'accent-top' && (
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${styles.bgAccent}`}
        />
      )}

      {/* Acento lateral */}
      {variant === 'accent-left' && (
        <div
          className={`absolute top-0 bottom-0 left-0 w-1.5 ${styles.bgAccent}`}
        />
      )}

      {/* Cabecera con Badge */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
          {title}
        </h3>
        {badge && (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${styles.badgeBg}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Subtítulo descriptivo */}
      {subtitle && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
          {subtitle}
        </p>
      )}

      {/* Métrica / KPI */}
      {variant === 'metric' && (
        <div className="my-3 flex items-baseline gap-3">
          {metric && (
            <span
              className={`text-3xl font-bold tracking-tight ${styles.metricText}`}
            >
              {metric}
            </span>
          )}
          {trend && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                trend.positive
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}

      {/* Hijos personalizados */}
      {children && <div className="mt-4">{children}</div>}

      {/* Botón de acción */}
      {actionLabel && (
        <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onAction}
            className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer shadow-sm ${styles.buttonBg} ${styles.buttonHover}`}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

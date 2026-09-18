// src/components/ui/StepProgressCard.tsx
import React from 'react';
import { AccentColor } from '../../types';

export interface StepItem {
  id?: string;
  stepNumber: number | string;
  title: string;
  description: string;
  callout?: {
    tag: string;
    text: string;
  };
  actionLabel?: string;
  actionUrl?: string;
  isCompleted?: boolean;
  highlightAction?: boolean;
}

export type StepProgressCardVariant = 'default' | 'glow' | 'compact';

export interface StepProgressCardProps {
  variant?: StepProgressCardVariant;
  accentColor?: AccentColor;
  title?: string;
  badge?: string;
  steps?: StepItem[];
  onStepAction?: (step: StepItem) => void;
  className?: string;
}

export const DEFAULT_BETA_STEPS: StepItem[] = [
  {
    stepNumber: 1,
    title: 'Join the Google Group',
    callout: {
      tag: 'Do this first',
      text: 'Join the group before anything else so Google Play unlocks the beta invite.',
    },
    description: 'Google requires beta testers to be part of our verified group before downloading.',
    actionLabel: 'Join Google Group Now',
    actionUrl: 'https://groups.google.com/g/sansara-users',
    highlightAction: true,
  },
  {
    stepNumber: 2,
    title: 'Download the App',
    description: "Once you've joined the group, you can immediately access the beta on Google Play.",
    actionLabel: 'Get on Google Play',
    actionUrl: 'https://play.google.com/apps/testing/com.sansara',
    highlightAction: false,
  },
];

export function StepProgressCard({
  variant = 'default',
  accentColor = 'fuchsia' as AccentColor,
  title = 'Android Beta',
  badge,
  steps = DEFAULT_BETA_STEPS,
  onStepAction,
  className = '',
}: StepProgressCardProps) {
  // Accent color themes
  const themeMap: Record<string, {
    border: string;
    calloutBg: string;
    calloutBorder: string;
    calloutTag: string;
    calloutText: string;
    primaryBtnBg: string;
    primaryBtnBorder: string;
    primaryBtnShadow: string;
    glowBorder: string;
    indicator: string;
  }> = {
    fuchsia: {
      border: 'border-fuchsia-500/30',
      calloutBg: 'bg-gradient-to-br from-fuchsia-500/15 via-purple-600/15 to-violet-700/10',
      calloutBorder: 'border-fuchsia-500/40',
      calloutTag: 'text-fuchsia-300 dark:text-fuchsia-200',
      calloutText: 'text-fuchsia-100',
      primaryBtnBg: 'bg-gradient-to-r from-fuchsia-500 via-purple-600 to-violet-700 text-white',
      primaryBtnBorder: 'border-fuchsia-400/40',
      primaryBtnShadow: 'hover:shadow-[0_8px_24px_rgba(217,70,239,0.3)]',
      glowBorder: 'border-fuchsia-500/40 shadow-[0_0_30px_rgba(217,70,239,0.15)]',
      indicator: 'text-fuchsia-400',
    },
    indigo: {
      border: 'border-indigo-500/30',
      calloutBg: 'bg-gradient-to-br from-indigo-500/15 via-blue-600/15 to-indigo-700/10',
      calloutBorder: 'border-indigo-500/40',
      calloutTag: 'text-indigo-300 dark:text-indigo-200',
      calloutText: 'text-indigo-100',
      primaryBtnBg: 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-700 text-white',
      primaryBtnBorder: 'border-indigo-400/40',
      primaryBtnShadow: 'hover:shadow-[0_8px_24px_rgba(99,102,241,0.3)]',
      glowBorder: 'border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.15)]',
      indicator: 'text-indigo-400',
    },
    emerald: {
      border: 'border-emerald-500/30',
      calloutBg: 'bg-gradient-to-br from-emerald-500/15 via-teal-600/15 to-emerald-700/10',
      calloutBorder: 'border-emerald-500/40',
      calloutTag: 'text-emerald-300 dark:text-emerald-200',
      calloutText: 'text-emerald-100',
      primaryBtnBg: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 text-white',
      primaryBtnBorder: 'border-emerald-400/40',
      primaryBtnShadow: 'hover:shadow-[0_8px_24px_rgba(16,185,129,0.3)]',
      glowBorder: 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      indicator: 'text-emerald-400',
    },
    violet: {
      border: 'border-violet-500/30',
      calloutBg: 'bg-gradient-to-br from-violet-500/15 via-purple-600/15 to-indigo-700/10',
      calloutBorder: 'border-violet-500/40',
      calloutTag: 'text-violet-300 dark:text-violet-200',
      calloutText: 'text-violet-100',
      primaryBtnBg: 'bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-700 text-white',
      primaryBtnBorder: 'border-violet-400/40',
      primaryBtnShadow: 'hover:shadow-[0_8px_24px_rgba(139,92,246,0.3)]',
      glowBorder: 'border-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.15)]',
      indicator: 'text-violet-400',
    },
    amber: {
      border: 'border-amber-500/30',
      calloutBg: 'bg-gradient-to-br from-amber-500/15 via-orange-600/15 to-amber-700/10',
      calloutBorder: 'border-amber-500/40',
      calloutTag: 'text-amber-300 dark:text-amber-200',
      calloutText: 'text-amber-100',
      primaryBtnBg: 'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 text-white',
      primaryBtnBorder: 'border-amber-400/40',
      primaryBtnShadow: 'hover:shadow-[0_8px_24px_rgba(245,158,11,0.3)]',
      glowBorder: 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]',
      indicator: 'text-amber-400',
    },
    cyan: {
      border: 'border-cyan-500/30',
      calloutBg: 'bg-gradient-to-br from-cyan-500/15 via-sky-600/15 to-cyan-700/10',
      calloutBorder: 'border-cyan-500/40',
      calloutTag: 'text-cyan-300 dark:text-cyan-200',
      calloutText: 'text-cyan-100',
      primaryBtnBg: 'bg-gradient-to-r from-cyan-500 via-sky-600 to-blue-700 text-white',
      primaryBtnBorder: 'border-cyan-400/40',
      primaryBtnShadow: 'hover:shadow-[0_8px_24px_rgba(6,182,212,0.3)]',
      glowBorder: 'border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)]',
      indicator: 'text-cyan-400',
    },
    zinc: {
      border: 'border-zinc-500/30',
      calloutBg: 'bg-zinc-800/40',
      calloutBorder: 'border-zinc-700',
      calloutTag: 'text-zinc-300',
      calloutText: 'text-zinc-200',
      primaryBtnBg: 'bg-zinc-100 text-zinc-900 hover:bg-white',
      primaryBtnBorder: 'border-zinc-300',
      primaryBtnShadow: 'hover:shadow-md',
      glowBorder: 'border-zinc-700 shadow-xl',
      indicator: 'text-zinc-300',
    },
  };

  const theme = themeMap[accentColor] || themeMap.fuchsia;

  return (
    <div
      className={`relative h-full flex flex-col rounded-2xl border transition-all duration-300 ${
        variant === 'glow'
          ? `bg-zinc-950/95 dark:bg-zinc-950/95 backdrop-blur-xl ${theme.glowBorder}`
          : variant === 'compact'
          ? 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800/80 shadow-md p-5'
          : 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800/90 shadow-xl p-6 sm:p-7'
      } ${variant === 'glow' ? 'p-6 sm:p-7' : ''} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-800 dark:text-zinc-100">
          {title}
        </h3>
        {badge && (
          <span className="rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>

      {/* Step List */}
      <div className="space-y-6 flex-1">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id || index} className="relative">
              <div className="flex gap-4">
                {/* Step Circle Badge */}
                <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
                    {step.stepNumber}
                  </span>
                </div>

                {/* Step Body */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1.5 text-zinc-900 dark:text-zinc-100">
                    {step.title}
                  </p>

                  {/* Optional Callout / Highlight Box */}
                  {step.callout && (
                    <div
                      className={`mb-3 rounded-xl px-3.5 py-2.5 border ${theme.calloutBg} ${theme.calloutBorder}`}
                    >
                      <p
                        className={`text-[11px] font-bold tracking-[0.18em] uppercase ${theme.calloutTag}`}
                      >
                        {step.callout.tag}
                      </p>
                      <p className={`text-xs leading-relaxed mt-1 ${theme.calloutText}`}>
                        {step.callout.text}
                      </p>
                    </div>
                  )}

                  <p className="text-xs leading-relaxed mb-3 text-zinc-500 dark:text-zinc-400">
                    {step.description}
                  </p>

                  {/* Action Button */}
                  {step.actionLabel && (
                    <div>
                      {step.actionUrl ? (
                        <a
                          href={step.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onStepAction && onStepAction(step)}
                          className={`inline-flex items-center gap-2 px-5 py-2 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full transition-all hover:scale-[1.01] cursor-pointer ${
                            step.highlightAction
                              ? `${theme.primaryBtnBg} ${theme.primaryBtnBorder} ${theme.primaryBtnShadow}`
                              : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          <span>{step.actionLabel}</span>
                          <span className="opacity-80">↗</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onStepAction && onStepAction(step)}
                          className={`inline-flex items-center gap-2 px-5 py-2 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full transition-all hover:scale-[1.01] cursor-pointer ${
                            step.highlightAction
                              ? `${theme.primaryBtnBg} ${theme.primaryBtnBorder} ${theme.primaryBtnShadow}`
                              : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          <span>{step.actionLabel}</span>
                          <span className="opacity-80">↗</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Vertical connector line between steps */}
              {!isLast && (
                <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 ml-3 -my-3" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// src/components/ui/CustomComponentRenderer.tsx
import React from 'react';
import { ACCENT_COLORS, AccentColor, UIComponent } from '../../types';
import { PropValues, readOneOf, readString } from '../../utils/propValues';
import { useTheme } from '../../context/ThemeContext';
import { SandboxedHtmlPreview } from './SandboxedHtmlPreview';

interface CustomComponentRendererProps {
  component: UIComponent;
  activeVariantProps?: PropValues;
  propOverrides?: PropValues;
  accentColor?: AccentColor;
  onToast?: (msg: string) => void;
  compact?: boolean;
}

export function CustomComponentRenderer({
  component,
  activeVariantProps = {},
  propOverrides = {},
  accentColor = 'indigo',
  onToast = () => {},
  compact = false,
}: CustomComponentRendererProps) {
  const { isDark } = useTheme();
  const mergedProps = { ...activeVariantProps, ...propOverrides };
  const variant = readOneOf(mergedProps.variant, ['default', 'glow', 'compact'] as const, 'default');
  // Validado contra la lista: se interpola en el atributo class del documento del iframe
  const effectiveAccent = readOneOf(mergedProps.accentColor, ACCENT_COLORS, accentColor);

  if (!component.rawHtml) {
    // Elegant fallback card
    return (
      <div
        className={`w-full ${
          compact ? 'max-w-xs' : 'max-w-md'
        } mx-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-xl backdrop-blur-sm`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
            {component.name}
          </h3>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
          {component.description}
        </p>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 overflow-x-auto">
          {readString(activeVariantProps?.codeSnippet) || component.usageSnippet}
        </div>
      </div>
    );
  }

  // Variant wrapper styling. Se aplica DENTRO del iframe, donde el Tailwind Play CDN genera en runtime
  // también las clases dinámicas (border-${accent}-500/40), que el build de la app no podría generar.
  const wrapperClass =
    variant === 'glow'
      ? `relative w-full rounded-3xl border border-${effectiveAccent}-500/40 bg-zinc-950/95 p-6 shadow-[0_0_35px_rgba(99,102,241,0.18)] text-zinc-100`
      : variant === 'compact'
      ? 'relative w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-md text-zinc-900 dark:text-zinc-100'
      : 'relative w-full rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-xl text-zinc-900 dark:text-zinc-100';

  return (
    <div className={`w-full ${compact ? 'max-w-sm' : 'max-w-lg'} mx-auto`}>
      <SandboxedHtmlPreview
        html={component.rawHtml}
        theme={isDark ? 'dark' : 'light'}
        wrapperClass={wrapperClass}
        title={`Vista previa aislada: ${component.name}`}
        minHeight={compact ? 96 : 140}
        onClickLabel={(label) => onToast(`Clic en: ${label}`)}
      />
    </div>
  );
}

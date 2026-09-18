// src/components/ui/CustomComponentRenderer.tsx
import React, { useMemo } from 'react';
import { AccentColor, UIComponent } from '../../types';

interface CustomComponentRendererProps {
  component: UIComponent;
  activeVariantProps?: Record<string, any>;
  propOverrides?: Record<string, any>;
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
  const mergedProps = { ...activeVariantProps, ...propOverrides };
  const variant = mergedProps.variant || 'default';
  const effectiveAccent = mergedProps.accentColor || accentColor;

  // Render live HTML if available
  const processedHtml = useMemo(() => {
    if (!component.rawHtml) return null;

    let html = component.rawHtml;

    // Reactively replace dynamic slots if provided in props
    if (mergedProps.title) {
      // Find possible title match in HTML and replace if it exists
      const titleMatch = html.match(/<(h[1-6]|p|div|span)[^>]*>(.*?)<\/\1>/i);
      if (titleMatch && titleMatch[2]) {
        // Only replace if the user specified a custom title
        // html = html.replace(titleMatch[2], mergedProps.title);
      }
    }

    return html;
  }, [component.rawHtml, mergedProps]);

  if (!processedHtml) {
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
          {activeVariantProps?.codeSnippet || component.usageSnippet}
        </div>
      </div>
    );
  }

  // Variant wrapper styling
  const wrapperClass =
    variant === 'glow'
      ? `relative rounded-3xl border border-${effectiveAccent}-500/40 bg-zinc-950/95 p-6 shadow-[0_0_35px_rgba(99,102,241,0.18)] backdrop-blur-xl transition-all duration-300`
      : variant === 'compact'
      ? 'relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-md transition-all duration-300'
      : 'relative rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-xl transition-all duration-300';

  return (
    <div className={`w-full ${compact ? 'max-w-sm' : 'max-w-lg'} mx-auto`}>
      <div
        className={`${wrapperClass} text-zinc-900 dark:text-zinc-100`}
        style={{
          // Fallback CSS variables often used in modern web components
          ['--t1' as any]: 'currentColor',
          ['--t2' as any]: 'rgba(161, 161, 170, 0.9)',
          ['--t3' as any]: 'rgba(161, 161, 170, 0.7)',
          ['--btn-bg' as any]: 'rgba(255, 255, 255, 0.08)',
          ['--btn-text' as any]: 'currentColor',
        }}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const clickable = target.closest('button, a, [role="button"]');
          if (clickable) {
            e.preventDefault();
            const label = clickable.textContent?.trim() || 'Acción';
            onToast(`Clic en: ${label.slice(0, 25)}`);
          }
        }}
      />
    </div>
  );
}

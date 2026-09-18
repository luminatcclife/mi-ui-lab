import React from 'react';
import { Sliders, RotateCcw, Check, Sparkles } from 'lucide-react';
import { UIComponent, PropDoc } from '../types';

interface InteractivePropEditorProps {
  component: UIComponent;
  activeVariantProps: Record<string, any>;
  propOverrides: Record<string, any>;
  onPropChange: (propName: string, value: any, actionLabel: string) => void;
  onResetProps: () => void;
}

export function InteractivePropEditor({
  component,
  activeVariantProps,
  propOverrides,
  onPropChange,
  onResetProps,
}: InteractivePropEditorProps) {
  // Merge active variant props with user overrides
  const effectiveProps: Record<string, any> = {
    ...activeVariantProps,
    ...propOverrides,
  };

  const overrideKeys = Object.keys(propOverrides);

  // Derive which props are editable based on the component's documented props
  // or keys present in the variant
  const documentedProps = component.props || [];

  return (
    <div
      id="interactive-prop-editor"
      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-4 shadow-xs backdrop-blur-sm"
    >
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Ajuste de Propiedades en Vivo
          </h4>
          {overrideKeys.length > 0 && (
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.2 font-mono text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
              {overrideKeys.length} personalizada(s)
            </span>
          )}
        </div>

        {overrideKeys.length > 0 && (
          <button
            type="button"
            id="btn-reset-prop-overrides"
            onClick={onResetProps}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            title="Revertir modificaciones de props a los valores base de la variante"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Restablecer Props</span>
          </button>
        )}
      </div>

      {/* Grid of editable props */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {documentedProps.map((propDoc) => {
          const propKey = propDoc.name;
          const currentVal =
            effectiveProps[propKey] !== undefined
              ? effectiveProps[propKey]
              : propDoc.defaultValue || '';
          const isOverridden = propOverrides[propKey] !== undefined;
          const isBoolean =
            propDoc.type.includes('boolean') ||
            typeof currentVal === 'boolean';

          if (isBoolean) {
            const checked = Boolean(currentVal);
            return (
              <div
                key={propKey}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                  isOverridden
                    ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-950/20'
                    : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40'
                }`}
              >
                <div>
                  <label
                    htmlFor={`prop-input-${propKey}`}
                    className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1"
                  >
                    <span>{propKey}</span>
                    {isOverridden && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    )}
                  </label>
                  <span className="text-[10px] text-zinc-400 line-clamp-1">
                    {propDoc.description}
                  </span>
                </div>

                <button
                  type="button"
                  id={`prop-toggle-${propKey}`}
                  role="switch"
                  aria-checked={checked}
                  onClick={() => {
                    const nextVal = !checked;
                    onPropChange(
                      propKey,
                      nextVal,
                      `Cambio prop '${propKey}' a ${nextVal ? 'true' : 'false'}`,
                    );
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    checked ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      checked ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          }

          // String or number inputs
          return (
            <div
              key={propKey}
              className={`p-2.5 rounded-xl border transition-colors ${
                isOverridden
                  ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-950/20'
                  : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor={`prop-input-${propKey}`}
                  className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1"
                >
                  <span>{propKey}</span>
                  {isOverridden && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  )}
                </label>
                <span className="text-[10px] font-mono text-zinc-400">
                  {propDoc.type}
                </span>
              </div>

              <input
                id={`prop-input-${propKey}`}
                type="text"
                value={currentVal ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onPropChange(
                    propKey,
                    val,
                    `Prop '${propKey}' modificada`,
                  );
                }}
                placeholder={propDoc.defaultValue || `Valor para ${propKey}`}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

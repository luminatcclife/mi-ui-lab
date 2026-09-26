import React from 'react';
import { RotateCcw } from 'lucide-react';
import { UIComponent } from '../types';
import { PropValue, PropValues } from '../utils/propValues';

interface InteractivePropEditorProps {
  component: UIComponent;
  activeVariantProps: PropValues;
  propOverrides: PropValues;
  onPropChange: (propName: string, value: PropValue, actionLabel: string) => void;
  onResetProps: () => void;
}

/** Campos para editar en vivo las props documentadas de una pieza. Se muestra en una sola columna. */
export function InteractivePropEditor({
  component,
  activeVariantProps,
  propOverrides,
  onPropChange,
  onResetProps,
}: InteractivePropEditorProps) {
  // Props de la variante activa con los cambios del usuario encima
  const effectiveProps: PropValues = {
    ...activeVariantProps,
    ...propOverrides,
  };

  const overrideKeys = Object.keys(propOverrides);
  const documentedProps = component.props || [];

  if (documentedProps.length === 0) {
    return (
      <p id="interactive-prop-editor" className="text-sm text-zinc-600 dark:text-zinc-300">
        Esta pieza no tiene props documentadas.
      </p>
    );
  }

  return (
    <div id="interactive-prop-editor" className="flex flex-col gap-5">
      {documentedProps.map((propDoc) => {
        const propKey = propDoc.name;
        const currentVal =
          effectiveProps[propKey] !== undefined ? effectiveProps[propKey] : propDoc.defaultValue || '';
        const isOverridden = propOverrides[propKey] !== undefined;
        const isBoolean = propDoc.type.includes('boolean') || typeof currentVal === 'boolean';

        const label = (
          <span className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">{propKey}</span>
            {isOverridden && (
              <span className="mono-label rounded-full bg-violet-100 dark:bg-violet-900 px-2 text-[11px] text-zinc-900 dark:text-zinc-50">
                Cambiada
              </span>
            )}
          </span>
        );

        if (isBoolean) {
          const checked = Boolean(currentVal);
          return (
            <div key={propKey} className="flex min-h-11 items-center justify-between gap-4">
              <label htmlFor={`prop-toggle-${propKey}`} className="flex min-w-0 flex-col">
                {label}
                {propDoc.description && (
                  <span className="line-clamp-1 text-sm text-zinc-600 dark:text-zinc-300">{propDoc.description}</span>
                )}
              </label>
              <button
                type="button"
                id={`prop-toggle-${propKey}`}
                role="switch"
                aria-checked={checked}
                onClick={() => {
                  const nextVal = !checked;
                  onPropChange(propKey, nextVal, `Cambio prop '${propKey}' a ${nextVal ? 'true' : 'false'}`);
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
                  checked
                    ? 'border-violet-600 bg-violet-600 dark:border-violet-400 dark:bg-violet-400'
                    : 'border-zinc-500 bg-zinc-200 dark:border-zinc-400 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-[var(--app-shadow-card)] transition-transform ${
                    checked ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          );
        }

        return (
          <div key={propKey} className="flex flex-col gap-2">
            <label htmlFor={`prop-input-${propKey}`} className="flex items-center justify-between gap-2">
              {label}
              <span className="truncate font-mono text-xs text-zinc-600 dark:text-zinc-300">{propDoc.type}</span>
            </label>
            <input
              id={`prop-input-${propKey}`}
              type="text"
              value={
                typeof currentVal === 'string' || typeof currentVal === 'number'
                  ? currentVal
                  : currentVal == null
                    ? ''
                    : JSON.stringify(currentVal)
              }
              onChange={(e) => onPropChange(propKey, e.target.value, `Prop '${propKey}' modificada`)}
              placeholder={propDoc.defaultValue || `Valor para ${propKey}`}
              className={`h-11 w-full rounded-xl border bg-white dark:bg-zinc-900 px-3.5 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 ${
                isOverridden ? 'border-violet-600 dark:border-violet-400' : 'border-zinc-500 dark:border-zinc-400'
              }`}
            />
          </div>
        );
      })}

      {overrideKeys.length > 0 && (
        <button
          type="button"
          id="btn-reset-prop-overrides"
          onClick={onResetProps}
          title="Volver a los valores de la variante"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-zinc-500 dark:border-zinc-400 px-4 text-base text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          Restablecer {overrideKeys.length} {overrideKeys.length === 1 ? 'prop' : 'props'}
        </button>
      )}
    </div>
  );
}

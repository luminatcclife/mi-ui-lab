import React from 'react';
import { PropDoc } from '../types';

interface PropsTableProps {
  props: PropDoc[];
}

export function PropsTable({ props }: PropsTableProps) {
  if (!props || props.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-400 dark:border-zinc-600 p-8 text-center text-base text-zinc-600 dark:text-zinc-300">
        Esta pieza no tiene props documentadas.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
              <th scope="col" className="mono-label px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">Prop</th>
              <th scope="col" className="mono-label px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">Tipo</th>
              <th scope="col" className="mono-label px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">Por defecto</th>
              <th scope="col" className="mono-label px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">Descripción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {props.map((p) => (
              <tr key={p.name}>
                <td className="px-4 py-3.5 align-top">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</code>
                    {p.required && (
                      <span className="mono-label rounded-full bg-indigo-100 dark:bg-indigo-900 px-2 text-[11px] text-zinc-900 dark:text-zinc-50">
                        Requerida
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <code className="font-mono text-[13px] text-violet-700 dark:text-violet-300">{p.type}</code>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <code className="font-mono text-[13px] text-zinc-700 dark:text-zinc-300">{p.defaultValue || '—'}</code>
                </td>
                <td className="max-w-sm px-4 py-3.5 align-top leading-[21px] text-zinc-700 dark:text-zinc-300">
                  {p.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

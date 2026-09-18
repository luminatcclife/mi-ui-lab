import React from 'react';
import { PropDoc } from '../types';

interface PropsTableProps {
  props: PropDoc[];
}

export function PropsTable({ props }: PropsTableProps) {
  if (!props || props.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
        No hay documentación de props disponible para esta pieza.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 font-mono text-[11px]">
              <th className="px-4 py-3 font-semibold">Propiedad</th>
              <th className="px-4 py-3 font-semibold">Tipo TypeScript</th>
              <th className="px-4 py-3 font-semibold">Valor por defecto</th>
              <th className="px-4 py-3 font-semibold">Descripción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {props.map((p) => (
              <tr key={p.name} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3.5 align-top font-mono font-semibold text-indigo-400">
                  <div className="flex items-center gap-1.5">
                    <span>{p.name}</span>
                    {p.required && (
                      <span className="rounded bg-rose-500/10 px-1 py-0.2 text-[9px] text-rose-400 font-sans">
                        requerido
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top font-mono text-zinc-300">
                  <span className="rounded bg-zinc-900 px-1.5 py-0.5 border border-zinc-800 text-[11px] text-violet-300">
                    {p.type}
                  </span>
                </td>
                <td className="px-4 py-3.5 align-top font-mono text-zinc-400">
                  <code className="text-zinc-400 text-[11px]">{p.defaultValue}</code>
                </td>
                <td className="px-4 py-3.5 align-top text-zinc-300 leading-relaxed max-w-sm">
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

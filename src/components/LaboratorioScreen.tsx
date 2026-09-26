import React, { useState } from 'react';
import { PenLine, Code2 } from 'lucide-react';
import { UIComponent } from '../types';
import { NewComponentModal } from './NewComponentModal';
import { ElementInspectorModal } from './ElementInspectorModal';

type LabTab = 'manual' | 'capture';

interface LaboratorioScreenProps {
  components: UIComponent[];
  activeComponent?: UIComponent;
  onSave: (component: UIComponent) => void;
  onToast: (msg: string) => void;
}

const CHOICES: { id: LabTab; title: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'capture',
    title: 'Capturar HTML',
    description: 'Pega el HTML de otro sitio y lo convertimos en una pieza tuya.',
    icon: <Code2 className="h-5 w-5" />,
  },
  {
    id: 'manual',
    title: 'A mano',
    description: 'Escribe nombre, descripción y el código TSX de referencia.',
    icon: <PenLine className="h-5 w-5" />,
  },
];

/**
 * Incorporar piezas nuevas a la biblioteca: a mano (formulario TSX) o
 * capturando HTML de otro lado. Antes eran dos modales flotando sobre
 * cualquier pantalla; ahora es su propia pantalla dedicada.
 */
export function LaboratorioScreen({ activeComponent, onSave, onToast }: LaboratorioScreenProps) {
  const [tab, setTab] = useState<LabTab>('capture');

  return (
    <main className="flex flex-1 flex-col overflow-y-auto bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-2">
          <span className="mono-label text-xs text-indigo-700 dark:text-indigo-400">Laboratorio</span>
          <h1 className="font-display text-[40px] leading-[46px]">Trae una pieza nueva</h1>
          <p className="text-[19px] leading-[30px] text-zinc-600 dark:text-zinc-300">Elige cómo empezar. Podrás editarla después.</p>
        </div>

        <div role="group" aria-label="Cómo empezar" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {CHOICES.map((choice) => {
            const active = tab === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                id={`lab-tab-${choice.id}`}
                aria-pressed={active}
                onClick={() => setTab(choice.id)}
                className={`flex items-start gap-5 rounded-[20px] p-6 text-left transition-colors cursor-pointer ${
                  active
                    ? 'border-2 border-indigo-600 bg-indigo-100 dark:border-indigo-400 dark:bg-indigo-900'
                    : 'border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    active ? 'bg-indigo-600 text-white dark:bg-indigo-400 dark:text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  {choice.icon}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="flex items-center gap-3">
                    <span className="font-display text-[22px] leading-7">{choice.title}</span>
                    {active && (
                      <span className="mono-label rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] text-white dark:bg-indigo-400 dark:text-zinc-950">
                        Elegido
                      </span>
                    )}
                  </span>
                  <span className="text-base leading-[26px] text-zinc-700 dark:text-zinc-300">{choice.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        {tab === 'capture' ? (
          <ElementInspectorModal activeComponent={activeComponent} onToast={onToast} onSaveComponent={onSave} />
        ) : (
          <NewComponentModal onSave={onSave} onToast={onToast} />
        )}
      </div>
    </main>
  );
}

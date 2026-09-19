import React, { useState } from 'react';
import { PenLine, ScanSearch } from 'lucide-react';
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

/**
 * Incorporar piezas nuevas a la biblioteca: a mano (formulario TSX) o
 * capturando HTML de otro lado. Antes eran dos modales flotando sobre
 * cualquier pantalla; ahora es su propia pantalla dedicada.
 */
export function LaboratorioScreen({
  components,
  activeComponent,
  onSave,
  onToast,
}: LaboratorioScreenProps) {
  const [tab, setTab] = useState<LabTab>('capture');

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 px-4 py-2.5 shrink-0">
        <button
          type="button"
          id="lab-tab-capture"
          onClick={() => setTab('capture')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            tab === 'capture'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <ScanSearch className="h-3.5 w-3.5" />
          <span>Capturar HTML</span>
        </button>
        <button
          type="button"
          id="lab-tab-manual"
          onClick={() => setTab('manual')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            tab === 'manual'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <PenLine className="h-3.5 w-3.5" />
          <span>Documentar a mano</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-y-auto">
        {tab === 'capture' ? (
          <ElementInspectorModal
            activeComponent={activeComponent}
            onToast={onToast}
            onSaveComponent={onSave}
          />
        ) : (
          <NewComponentModal onSave={onSave} onToast={onToast} />
        )}
      </div>
    </div>
  );
}

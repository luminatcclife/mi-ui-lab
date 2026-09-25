import React from 'react';
import { Layers, Library, FlaskConical, Wand2, Star, Sparkles, ArrowRight } from 'lucide-react';
import { BackupReminder } from './BackupReminder';

export type AppScreen = 'home' | 'biblioteca' | 'laboratorio' | 'playground';

interface HomeScreenProps {
  totalComponents: number;
  customCount: number;
  favoritesCount: number;
  onNavigate: (screen: AppScreen) => void;
  onExport: () => void;
  /** Cambia tras cada exportación, para que el aviso de copia se vuelva a evaluar. */
  backupKey: number;
}

interface DestinationCard {
  screen: AppScreen;
  title: string;
  description: string;
  stat: string;
  icon: React.ReactNode;
  accent: string;
}

export function HomeScreen({
  totalComponents,
  customCount,
  favoritesCount,
  onNavigate,
  onExport,
  backupKey,
}: HomeScreenProps) {
  const cards: DestinationCard[] = [
    {
      screen: 'biblioteca',
      title: 'Biblioteca',
      description: 'Explorá, documentá, compará y gestioná todo lo que ya tenés guardado.',
      stat: `${totalComponents} piezas · ${favoritesCount} favoritas`,
      icon: <Library className="h-6 w-6" />,
      accent:
        'from-indigo-500/15 to-indigo-500/5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
    },
    {
      screen: 'laboratorio',
      title: 'Laboratorio',
      description: 'Incorporá piezas nuevas: documentalas a mano o capturá HTML de otro lado.',
      stat: `${customCount} piezas propias`,
      icon: <FlaskConical className="h-6 w-6" />,
      accent:
        'from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    },
    {
      screen: 'playground',
      title: 'Playground',
      description: 'Probá en vivo una pieza ya guardada: variantes, tonos, props en tiempo real.',
      stat: 'Interactuá con lo que ya existe',
      icon: <Wand2 className="h-6 w-6" />,
      accent:
        'from-violet-500/15 to-violet-500/5 border-violet-500/30 text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-zinc-50 dark:bg-zinc-950 px-6 py-12 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <div className="w-full max-w-4xl">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="border-gradient-pill mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 dark:bg-black text-indigo-600 dark:text-emerald-400">
            <Layers className="h-7 w-7" />
          </div>
          <h1 className="text-brand-gradient mono-label text-2xl font-extrabold tracking-[0.08em]">
            mi-ui-lab
          </h1>
          <p className="mt-3 max-w-md text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Tu taller personal de interfaces. Elegí a dónde ir.
          </p>
        </div>

        <BackupReminder key={backupKey} customCount={customCount} onExport={onExport} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.screen}
              type="button"
              id={`home-card-${card.screen}`}
              onClick={() => onNavigate(card.screen)}
              className={`group flex flex-col items-start gap-3 rounded-3xl border bg-gradient-to-br p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl cursor-pointer bg-white dark:bg-zinc-900/70 ${card.accent}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 dark:bg-black/40 border border-current/20">
                {card.icon}
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {card.title}
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
              <div className="mt-auto flex w-full items-center justify-between pt-2 text-[11px] font-medium">
                <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                  <Sparkles className="h-3 w-3" />
                  {card.stat}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </div>
            </button>
          ))}
        </div>

        {favoritesCount > 0 && (
          <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
            Tenés {favoritesCount} {favoritesCount === 1 ? 'pieza favorita' : 'piezas favoritas'}{' '}
            esperando en tu Biblioteca.
          </p>
        )}
      </div>
    </main>
  );
}

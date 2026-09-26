import React from 'react';
import { ArrowRight } from 'lucide-react';
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
  number: number;
  label: string;
  title: string;
  description: string;
  stat: string;
  /** Color fijo de la zona: su número, su etiqueta y su enlace. */
  tone: { badge: string; text: string };
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Buenas noches.';
  if (h < 14) return 'Buenos días.';
  if (h < 21) return 'Buenas tardes.';
  return 'Buenas noches.';
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
      number: 1,
      label: 'Explorar',
      title: 'Biblioteca',
      description: 'Busca, compara y documenta todo lo que ya tienes guardado.',
      stat: `${totalComponents} piezas · ${favoritesCount} favoritas`,
      tone: {
        badge: 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-zinc-950',
        text: 'text-emerald-600 dark:text-emerald-400',
      },
    },
    {
      screen: 'laboratorio',
      number: 2,
      label: 'Crear',
      title: 'Laboratorio',
      description: 'Añade piezas nuevas a mano o captura el HTML de otro sitio.',
      stat: `${customCount} piezas propias`,
      tone: {
        badge: 'bg-indigo-600 text-white dark:bg-indigo-400 dark:text-zinc-950',
        text: 'text-indigo-700 dark:text-indigo-400',
      },
    },
    {
      screen: 'playground',
      number: 3,
      label: 'Probar',
      title: 'Playground',
      description: 'Juega con una pieza en vivo: variantes, tonos y props.',
      stat: 'Interactúa con lo que ya existe',
      tone: {
        badge: 'bg-violet-600 text-white dark:bg-violet-400 dark:text-zinc-950',
        text: 'text-violet-600 dark:text-violet-400',
      },
    },
  ];

  const counters = [
    { value: totalComponents, label: 'piezas' },
    { value: customCount, label: customCount === 1 ? 'propia' : 'propias' },
    { value: favoritesCount, label: favoritesCount === 1 ? 'favorita' : 'favoritas' },
  ];

  return (
    <main className="flex flex-1 flex-col overflow-y-auto bg-zinc-50 dark:bg-zinc-950 px-4 py-12 sm:px-8 lg:py-16 text-zinc-900 dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <span className="mono-label text-xs text-indigo-700 dark:text-indigo-400">Tu taller</span>
            <h1 className="font-display text-5xl sm:text-[56px] sm:leading-[60px]">{greeting()}</h1>
            <p className="max-w-xl text-[19px] leading-[30px] text-zinc-600 dark:text-zinc-300">
              Tienes {totalComponents} piezas guardadas. ¿Por dónde quieres seguir hoy?
            </p>
          </div>
          <dl className="flex gap-8 pb-1.5">
            {counters.map((c, i) => (
              <div key={c.label} className={`flex flex-col ${i > 0 ? 'border-l border-zinc-200 dark:border-zinc-800 pl-8' : ''}`}>
                <dt className="sr-only">{c.label}</dt>
                <dd className="font-display text-[28px] leading-[34px] font-semibold">{c.value}</dd>
                <span aria-hidden="true" className="text-sm text-zinc-600 dark:text-zinc-300">{c.label}</span>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.screen}
              type="button"
              id={`home-card-${card.screen}`}
              onClick={() => onNavigate(card.screen)}
              className="group flex min-h-[280px] flex-col gap-4 rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-left shadow-[var(--app-shadow-card)] transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer"
            >
              <div className="flex w-full items-center justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl font-display text-xl font-semibold ${card.tone.badge}`}>
                  {card.number}
                </span>
                <span className={`mono-label text-xs ${card.tone.text}`}>{card.label}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-[28px] leading-[34px]">{card.title}</h2>
                <p className="text-base leading-[26px] text-zinc-600 dark:text-zinc-300">{card.description}</p>
              </div>
              <div className="mt-auto flex w-full items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <span className="text-sm text-zinc-600 dark:text-zinc-300">{card.stat}</span>
                <span className={`flex items-center gap-1.5 text-base font-semibold ${card.tone.text}`}>
                  Abrir
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>

        <BackupReminder key={backupKey} customCount={customCount} onExport={onExport} />
      </div>
    </main>
  );
}

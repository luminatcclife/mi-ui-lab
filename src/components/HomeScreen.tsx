import React, { useState } from 'react';
import { ArrowRight, Download, LayoutGrid, Plus, SlidersHorizontal } from 'lucide-react';
import { UIComponent } from '../types';
import { CATEGORY_LABELS } from './libraryCategories';
import { BackupReminder } from './BackupReminder';

export type AppScreen = 'home' | 'biblioteca' | 'laboratorio' | 'playground';

type PieceCategory = UIComponent['category'];

interface HomeScreenProps {
  components: UIComponent[];
  customCount: number;
  favoritesCount: number;
  /** Pieza activa en la app: es la que aparece enfocada en el núcleo al entrar. */
  selectedId: string;
  onNavigate: (screen: AppScreen) => void;
  /** Abre la pieza en el Playground. */
  onOpenPiece: (componentId: string) => void;
  onExport: () => void;
  /** Cambia tras cada exportación, para que el aviso de copia se vuelva a evaluar. */
  backupKey: number;
}

/** Un anillo por categoría, de dentro a fuera. «custom» solo se dibuja si alguna pieza la usa. */
const RING_ORDER: PieceCategory[] = ['cards', 'buttons', 'inputs', 'feedback', 'navigation', 'data', 'custom'];

const INNER_RADIUS = 18; // % del lado del mapa
const OUTER_RADIUS = 48;

/** Satélites que caben en un anillo de radio `r` (%) sin solaparse, medido sobre un mapa de 700 px. */
function ringCapacity(r: number): number {
  return Math.max(3, Math.floor((2 * Math.PI * r * 7) / 92));
}

/**
 * Ángulos (rad) de `slots` satélites repartidos por igual en el anillo `ringIndex`. Cada anillo arranca
 * girado para que los satélites de anillos vecinos no se alineen, y el conjunto se aparta de la vertical
 * superior, donde va la etiqueta del anillo: unos 100 px de arco, que en los anillos interiores son más grados.
 * El giro entre anillos (1,8 rad) deja sin choques el catálogo base; de 1,7 a 1,9 da el mismo resultado.
 */
function satelliteAngles(slots: number, ringIndex: number, r: number): number[] {
  const TOP = -Math.PI / 2;
  const CLEARANCE = Math.min(1, 100 / (r * 7));
  const angles = Array.from({ length: slots }, (_, j) => TOP + ringIndex * 1.8 + (j * 2 * Math.PI) / slots);
  const offsets = angles.map((a) => Math.atan2(Math.sin(a - TOP), Math.cos(a - TOP)));
  const closest = offsets.reduce((best, d) => (Math.abs(d) < Math.abs(best) ? d : best), Math.PI);
  if (Math.abs(closest) >= CLEARANCE) return angles;
  const shift = (closest < 0 ? -1 : 1) * (CLEARANCE - Math.abs(closest));
  return angles.map((a) => a + shift);
}

/** Nombre corto para el satélite: la primera palabra («NotificationCallout» → «Notification»). */
function shortName(name: string): string {
  const first = name.trim().split(/\s+/)[0] || name;
  const word = first.match(/^[A-ZÁÉÍÓÚÑ]?[a-záéíóúñ0-9]+/)?.[0] ?? first;
  return word.length > 12 ? `${word.slice(0, 11)}…` : word;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

const catVar = (category: PieceCategory) => ({ '--cat': `var(--orb-${category})` }) as React.CSSProperties;

export function HomeScreen({
  components,
  customCount,
  favoritesCount,
  selectedId,
  onNavigate,
  onOpenPiece,
  onExport,
  backupKey,
}: HomeScreenProps) {
  const [folded, setFolded] = useState<PieceCategory[]>([]);
  const [focusId, setFocusId] = useState(selectedId);

  const rings = RING_ORDER.map((category) => ({
    category,
    pieces: components.filter((c) => c.category === category),
  })).filter((ring) => ring.category !== 'custom' || ring.pieces.length > 0);

  const step = rings.length > 1 ? (OUTER_RADIUS - INNER_RADIUS) / (rings.length - 1) : 0;
  const focused = components.find((c) => c.id === focusId) ?? components[0];
  const visibleCount = rings
    .filter((ring) => !folded.includes(ring.category))
    .reduce((sum, ring) => sum + ring.pieces.length, 0);

  const toggleRing = (category: PieceCategory) =>
    setFolded((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));

  return (
    <main className="orbita flex flex-1 flex-col overflow-y-auto px-4 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-8">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <aside className="flex max-w-[280px] flex-[1_1_240px] flex-col gap-4">
            <span className="orb-label">// Telemetría</span>
            <div className="orb-panel flex flex-col gap-1 p-4">
              <span className="orb-label text-[11px]">Piezas en órbita</span>
              <span className="orb-hud text-[52px] font-bold leading-[56px]">
                <span className="orb-grad-text">{pad2(visibleCount)}</span>
                <span className="text-xl text-[var(--orb-muted)]"> / {pad2(components.length)}</span>
              </span>
              <span className="text-sm text-[var(--orb-muted)]">
                {components.length} piezas · {favoritesCount} favoritas
              </span>
              <span className="text-sm text-[var(--orb-muted)]">{customCount} piezas propias</span>
            </div>

            <span className="orb-label mt-2">// Anillos</span>
            <div role="group" aria-label="Mostrar u ocultar anillos" className="flex flex-col gap-1">
              {rings.map((ring) => {
                const visible = !folded.includes(ring.category);
                const empty = ring.pieces.length === 0;
                return (
                  <button
                    key={ring.category}
                    type="button"
                    aria-pressed={visible}
                    onClick={() => toggleRing(ring.category)}
                    className="orb-ring-toggle"
                    style={catVar(ring.category)}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full border border-[var(--cat)]"
                        style={visible && !empty ? { background: 'var(--cat)', boxShadow: '0 0 8px var(--cat)' } : undefined}
                      />
                      {CATEGORY_LABELS[ring.category]}
                    </span>
                    <span className="text-[var(--orb-muted)]">{ring.pieces.length}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mientras las tres columnas no caben en una fila, el mapa va primero */}
          <section aria-label="Mapa de la colección" className="order-first min-w-0 flex-[0_1_700px] xl:order-none">
            <div className="relative mx-auto aspect-square w-full max-w-[700px]">
              {rings.map((ring, i) => {
                const r = INNER_RADIUS + step * i;
                const off = folded.includes(ring.category);
                const empty = ring.pieces.length === 0;
                const holdsFocus = !off && ring.pieces.some((p) => p.id === focused?.id);
                return (
                  <React.Fragment key={ring.category}>
                    <div
                      aria-hidden="true"
                      className={`orb-ring ${i % 2 ? 'orb-spin-reverse' : 'orb-spin'}`}
                      style={
                        {
                          ...catVar(ring.category),
                          '--ring-mix': off || empty ? '18%' : holdsFocus ? '85%' : '45%',
                          width: `${r * 2}%`,
                          borderStyle: off || empty ? 'dotted' : 'dashed',
                          borderWidth: holdsFocus ? 2 : 1,
                          animationDuration: `${50 + i * 14}s`,
                        } as React.CSSProperties
                      }
                    />
                    <span
                      aria-hidden="true"
                      className="orb-ring-label"
                      style={{ ...catVar(ring.category), top: `${50 - r}%`, color: off || empty ? 'var(--orb-muted)' : undefined }}
                    >
                      {CATEGORY_LABELS[ring.category]}
                      {off ? ' · plegado' : ''}
                    </span>
                  </React.Fragment>
                );
              })}

              <div className="orb-core absolute left-1/2 top-1/2 flex aspect-square w-[24%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full text-center">
                {focused ? (
                  <>
                    <span className="orb-label text-[10px]" style={{ color: `var(--orb-${focused.category})` }}>
                      {CATEGORY_LABELS[focused.category]}
                    </span>
                    <span className="orb-hud orb-core-name break-words px-2 text-[17px] font-bold leading-5">
                      {focused.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenPiece(focused.id)}
                      className="orb-hud mt-1 inline-flex min-h-8 items-center gap-1 px-2 text-[11px] uppercase tracking-[0.14em] underline underline-offset-4 cursor-pointer"
                    >
                      Probar <ArrowRight aria-hidden="true" className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <span className="orb-label">Sin piezas</span>
                )}
              </div>

              {rings.map((ring, i) => {
                if (folded.includes(ring.category) || ring.pieces.length === 0) return null;
                const r = INNER_RADIUS + step * i;
                const capacity = ringCapacity(r);
                const overflow = ring.pieces.length > capacity;
                const shown = overflow ? ring.pieces.slice(0, capacity - 1) : ring.pieces;
                const angles = satelliteAngles(shown.length + (overflow ? 1 : 0), i, r);
                const position = (j: number): React.CSSProperties => {
                  const angle = angles[j];
                  return {
                    ...catVar(ring.category),
                    left: `${(50 + r * Math.cos(angle)).toFixed(2)}%`,
                    top: `${(50 + r * Math.sin(angle)).toFixed(2)}%`,
                  };
                };
                return (
                  <React.Fragment key={ring.category}>
                    {shown.map((piece, j) => (
                      <button
                        key={piece.id}
                        type="button"
                        aria-pressed={piece.id === focused?.id}
                        aria-label={piece.name}
                        title={piece.name}
                        onClick={() => setFocusId(piece.id)}
                        onDoubleClick={() => onOpenPiece(piece.id)}
                        className="orb-node"
                        style={position(j)}
                      >
                        {shortName(piece.name)}
                      </button>
                    ))}
                    {overflow && (
                      <button
                        type="button"
                        aria-label={`Ver ${ring.pieces.length - shown.length} piezas más de ${CATEGORY_LABELS[ring.category]} en la Biblioteca`}
                        onClick={() => onNavigate('biblioteca')}
                        className="orb-node"
                        style={position(shown.length)}
                      >
                        +{ring.pieces.length - shown.length}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </section>

          <aside className="flex max-w-[280px] flex-[1_1_240px] flex-col gap-3">
            <span className="orb-label">// Comandos</span>
            <button type="button" onClick={() => onNavigate('laboratorio')} className="orb-btn orb-btn-primary">
              Lanzar pieza nueva <Plus aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('biblioteca')}
              className="orb-btn"
              style={{ '--cat': 'var(--orb-a1)' } as React.CSSProperties}
            >
              Abrir la biblioteca <LayoutGrid aria-hidden="true" className="h-4 w-4 text-[var(--orb-a1)]" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('playground')}
              className="orb-btn"
              style={{ '--cat': 'var(--orb-a3)' } as React.CSSProperties}
            >
              Ir al playground <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-[var(--orb-a3)]" />
            </button>
            <button
              type="button"
              onClick={onExport}
              className="orb-btn text-[var(--orb-warn)]"
              style={{ '--cat': 'var(--orb-warn)' } as React.CSSProperties}
            >
              Exportar copia <Download aria-hidden="true" className="h-4 w-4" />
            </button>
            <p className="mt-2 text-[13px] leading-5 text-[var(--orb-muted)]">
              Cada categoría es un anillo con su color. Pliega los que no necesites y pulsa un satélite para enfocarlo
              en el núcleo; con doble clic se abre en el Playground.
            </p>
          </aside>
        </div>

        <BackupReminder key={backupKey} customCount={customCount} onExport={onExport} />
      </div>
    </main>
  );
}

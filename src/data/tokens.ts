export interface TokenItem {
  name: string;
  value: string;
  tailwindClass: string;
  description: string;
  previewType: 'color' | 'text' | 'radius' | 'shadow';
}

export const DESIGN_TOKENS: {
  category: string;
  description: string;
  items: TokenItem[];
}[] = [
  {
    category: 'Paleta de Acentos Cromáticos',
    description: 'Tonos semánticos y de acento para estados, botones y resplandores.',
    items: [
      {
        name: 'Indigo Principal',
        value: '#6366f1',
        tailwindClass: 'bg-indigo-600 text-indigo-400 border-indigo-500',
        description: 'Color primario de acción y resaltado institucional.',
        previewType: 'color',
      },
      {
        name: 'Emerald Éxito',
        value: '#10b981',
        tailwindClass: 'bg-emerald-600 text-emerald-400 border-emerald-500',
        description: 'Estados aprobados, éxito y métricas positivas.',
        previewType: 'color',
      },
      {
        name: 'Violet Místico',
        value: '#8b5cf6',
        tailwindClass: 'bg-violet-600 text-violet-400 border-violet-500',
        description: 'Acento editorial, badges y ambient glow.',
        previewType: 'color',
      },
      {
        name: 'Amber Alerta',
        value: '#f59e0b',
        tailwindClass: 'bg-amber-600 text-amber-400 border-amber-500',
        description: 'Advertencias, estados pendientes y revisión.',
        previewType: 'color',
      },
      {
        name: 'Rose Peligro',
        value: '#f43f5e',
        tailwindClass: 'bg-rose-600 text-rose-400 border-rose-500',
        description: 'Acciones destructivas, fallos y cancelaciones.',
        previewType: 'color',
      },
      {
        name: 'Cyan Énfasis',
        value: '#06b6d4',
        tailwindClass: 'bg-cyan-600 text-cyan-400 border-cyan-500',
        description: 'Métricas tecnológicas y gráficos.',
        previewType: 'color',
      },
    ],
  },
  {
    category: 'Superficies & Fondos (Neutros Sofisticados)',
    description: 'Capas de elevación con contraste óptico calibrado.',
    items: [
      {
        name: 'Canvas Base',
        value: '#09090b (zinc-950)',
        tailwindClass: 'bg-zinc-950',
        description: 'Fondo de pantalla principal.',
        previewType: 'color',
      },
      {
        name: 'Superficie Elevada',
        value: '#18181b (zinc-900)',
        tailwindClass: 'bg-zinc-900 border-zinc-800',
        description: 'Tarjetas, paneles laterales y modales.',
        previewType: 'color',
      },
      {
        name: 'Superficie Secundaria',
        value: '#27272a (zinc-800)',
        tailwindClass: 'bg-zinc-800',
        description: 'Botones secundarios, inputs y separadores.',
        previewType: 'color',
      },
      {
        name: 'Borde Sutil',
        value: 'rgba(63, 63, 70, 0.7)',
        tailwindClass: 'border-zinc-800/80',
        description: 'Micro-bordes de contención para evitar sombras pesadas.',
        previewType: 'color',
      },
    ],
  },
  {
    category: 'Tipografías & Escala Modular',
    description: 'Pairing entre Plus Jakarta Sans (interfaz) y JetBrains Mono (código).',
    items: [
      {
        name: 'Display / H1',
        value: '24px / 1.3 · Font Bold',
        tailwindClass: 'text-2xl font-bold tracking-tight',
        description: 'Títulos de cabecera y nombres de piezas.',
        previewType: 'text',
      },
      {
        name: 'H2 / Card Title',
        value: '18px / 1.4 · Font Semibold',
        tailwindClass: 'text-lg font-semibold tracking-tight',
        description: 'Encabezados de tarjetas y modales.',
        previewType: 'text',
      },
      {
        name: 'Body / Párrafo',
        value: '14px / 1.6 · Font Normal',
        tailwindClass: 'text-sm text-zinc-300 leading-relaxed',
        description: 'Texto de lectura y descripciones.',
        previewType: 'text',
      },
      {
        name: 'Caption / Badge',
        value: '12px / 1.4 · Font Medium',
        tailwindClass: 'text-xs font-medium tracking-wide',
        description: 'Etiquetas, píldoras y meta-información.',
        previewType: 'text',
      },
      {
        name: 'Code / Mono',
        value: '13px / 1.5 · JetBrains Mono',
        tailwindClass: 'font-mono text-xs text-zinc-300',
        description: 'Snippets JSX, clases Tailwind y tokens.',
        previewType: 'text',
      },
    ],
  },
  {
    category: 'Radios de Esquinas (Border Radius)',
    description: 'Curvatura armónica con regla matemática de esquinas anidadas.',
    items: [
      {
        name: 'Controles Pequeños',
        value: '8px (0.5rem)',
        tailwindClass: 'rounded-lg',
        description: 'Botones, inputs y pastillas selectoras.',
        previewType: 'radius',
      },
      {
        name: 'Tarjetas & Paneles',
        value: '16px (1rem)',
        tailwindClass: 'rounded-2xl',
        description: 'AccentCard, paneles flotantes y modales.',
        previewType: 'radius',
      },
      {
        name: 'Píldoras & Insignias',
        value: '9999px (Full)',
        tailwindClass: 'rounded-full',
        description: 'StatusBadge, avatares y conmutadores.',
        previewType: 'radius',
      },
    ],
  },
];

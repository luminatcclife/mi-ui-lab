export interface TokenItem {
  name: string;
  value: string;
  tailwindClass: string;
  description: string;
  previewType: 'color' | 'text' | 'radius' | 'shadow';
}

/**
 * Tokens del aspecto «papel y tinta» de la app. Las clases de color son las escalas de Tailwind
 * remapeadas en src/index.css (zinc = neutros cálidos, indigo = rojo teja, emerald = verde bosque,
 * violet = azul mar, amber = ocre). Las piezas se siguen pintando con la paleta original.
 */
export const DESIGN_TOKENS: {
  category: string;
  description: string;
  items: TokenItem[];
}[] = [
  {
    category: 'Colores de la app',
    description: 'Papel crema, tinta cálida y cuatro colores con un papel fijo cada uno.',
    items: [
      {
        name: 'Papel',
        value: '#fbf6ec',
        tailwindClass: 'bg-zinc-50',
        description: 'Fondo de todas las pantallas.',
        previewType: 'color',
      },
      {
        name: 'Papel elevado',
        value: '#fffdf8',
        tailwindClass: 'bg-white',
        description: 'Tarjetas, fichas y paneles.',
        previewType: 'color',
      },
      {
        name: 'Papel hundido',
        value: '#f1e8d6',
        tailwindClass: 'bg-zinc-100',
        description: 'Barra lateral, lienzos y zonas de apoyo.',
        previewType: 'color',
      },
      {
        name: 'Tinta',
        value: '#2a1f1a',
        tailwindClass: 'text-zinc-900',
        description: 'Texto principal y botones de tinta.',
        previewType: 'color',
      },
      {
        name: 'Tinta suave',
        value: '#5e4e43',
        tailwindClass: 'text-zinc-600',
        description: 'Descripciones, pies y texto secundario.',
        previewType: 'color',
      },
      {
        name: 'Rojo teja',
        value: '#b5371e',
        tailwindClass: 'bg-indigo-600',
        description: 'Marca: acción principal, pestaña activa, Laboratorio.',
        previewType: 'color',
      },
      {
        name: 'Verde bosque',
        value: '#2f5d3a',
        tailwindClass: 'bg-emerald-600',
        description: 'Biblioteca, filtro activo y piezas propias.',
        previewType: 'color',
      },
      {
        name: 'Azul mar',
        value: '#1d5f80',
        tailwindClass: 'bg-violet-600',
        description: 'Playground, información, foco y «Correcto».',
        previewType: 'color',
      },
      {
        name: 'Ocre',
        value: '#e0a32e',
        tailwindClass: 'bg-amber-400',
        description: 'Solo relleno: favoritas y notas «Ojo». Nunca como texto.',
        previewType: 'color',
      },
    ],
  },
  {
    category: 'Acentos de las piezas',
    description: 'Los tonos que puedes dar a una pieza en Playground. Son los de Tailwind, sin remapear.',
    items: [
      { name: 'Índigo', value: '#6366f1', tailwindClass: 'accentColor="indigo"', description: 'Tono por defecto de las piezas base.', previewType: 'color' },
      { name: 'Esmeralda', value: '#10b981', tailwindClass: 'accentColor="emerald"', description: 'Éxito y métricas positivas.', previewType: 'color' },
      { name: 'Violeta', value: '#8b5cf6', tailwindClass: 'accentColor="violet"', description: 'Acento editorial y badges.', previewType: 'color' },
      { name: 'Ámbar', value: '#f59e0b', tailwindClass: 'accentColor="amber"', description: 'Avisos y estados pendientes.', previewType: 'color' },
      { name: 'Rosa', value: '#f43f5e', tailwindClass: 'accentColor="rose"', description: 'Acciones destructivas y errores.', previewType: 'color' },
      { name: 'Cian', value: '#06b6d4', tailwindClass: 'accentColor="cyan"', description: 'Métricas y gráficos.', previewType: 'color' },
    ],
  },
  {
    category: 'Tipografía',
    description: 'Fraunces para titulares y nombres de piezas; Source Sans 3 para leer; JetBrains Mono para código.',
    items: [
      {
        name: 'Display',
        value: 'Fraunces · 56/60 · 600',
        tailwindClass: 'font-display text-[56px] leading-[60px]',
        description: 'Saludo de Inicio. Uno por pantalla.',
        previewType: 'text',
      },
      {
        name: 'Título 1',
        value: 'Fraunces · 40/46 · 600',
        tailwindClass: 'font-display text-[40px] leading-[46px]',
        description: 'Título de pantalla y de ficha.',
        previewType: 'text',
      },
      {
        name: 'Título 3',
        value: 'Fraunces · 22/28 · 600',
        tailwindClass: 'font-display text-[22px] leading-7',
        description: 'Nombre de pieza en tarjetas y secciones.',
        previewType: 'text',
      },
      {
        name: 'Texto',
        value: 'Source Sans 3 · 16/26',
        tailwindClass: 'text-base leading-[26px]',
        description: 'Texto de lectura y controles.',
        previewType: 'text',
      },
      {
        name: 'Etiqueta',
        value: 'Source Sans 3 · 12 · 600 · mayúsculas',
        tailwindClass: 'mono-label text-xs',
        description: 'Sobre los títulos. Máximo tres palabras.',
        previewType: 'text',
      },
      {
        name: 'Código',
        value: 'JetBrains Mono · 13–14',
        tailwindClass: 'font-mono text-sm',
        description: 'Snippets, clases y valores.',
        previewType: 'text',
      },
    ],
  },
  {
    category: 'Radios',
    description: 'Esquinas amables, más grandes cuanto mayor es la superficie.',
    items: [
      { name: 'Pequeño', value: '8px', tailwindClass: 'rounded-lg', description: 'Segmentos de un control.', previewType: 'radius' },
      { name: 'Medio', value: '12px', tailwindClass: 'rounded-xl', description: 'Campos, notas y bloques de código.', previewType: 'radius' },
      { name: 'Grande', value: '20px', tailwindClass: 'rounded-[20px]', description: 'Tarjetas, lienzos y modales.', previewType: 'radius' },
      { name: 'Píldora', value: '999px', tailwindClass: 'rounded-full', description: 'Botones, etiquetas y chips.', previewType: 'radius' },
    ],
  },
];

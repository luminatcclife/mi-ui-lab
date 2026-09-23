import { UIComponent } from '../types';
import accentCardSource from '../components/ui/AccentCard.tsx?raw';
import buttonSource from '../components/ui/Button.tsx?raw';
import statusBadgeSource from '../components/ui/StatusBadge.tsx?raw';
import inputFieldSource from '../components/ui/InputField.tsx?raw';
import segmentedControlSource from '../components/ui/SegmentedControl.tsx?raw';
import notificationCalloutSource from '../components/ui/NotificationCallout.tsx?raw';
import toggleSwitchSource from '../components/ui/ToggleSwitch.tsx?raw';
import stepProgressCardSource from '../components/ui/StepProgressCard.tsx?raw';

export const INITIAL_COMPONENTS: UIComponent[] = [
  {
    id: 'accent-card',
    name: 'AccentCard',
    version: '1.2.0',
    versionHistory: [
      {
        version: '1.2.0',
        date: '2026-09-15',
        notes: 'Soporte dinámico para temas Claro y Oscuro con contraste WCAG AA en acentos.',
      },
      {
        version: '1.1.0',
        date: '2026-09-14',
        notes: 'Añadidas variantes metric y actionable con micro-transiciones elevadas.',
      },
      {
        version: '1.0.0',
        date: '2026-09-10',
        notes: 'Versión inicial de AccentCard con variantes de borde y brillo ambiental.',
      },
    ],
    tagline: 'Tarjeta con acentos visuales configurables, brillo ambiental y variantes interactivas.',
    description:
      'Pieza central para destacar contenidos, métricas o bloques de acción. Diseñada con cero dependencias externas, soporte para bordes superiores, indicadores laterales, resplandor ambiental y elevación táctil en hover.',
    category: 'cards',
    tags: [
      'card',
      'tarjeta',
      'glow',
      'resplandor',
      'metric',
      'kpi',
      'métrica',
      'ambient',
      'borde',
      'container',
      'panel',
      'accent',
    ],
    tokensUsed: [
      'rounded-2xl',
      'border-zinc-800/80',
      'bg-zinc-900/90',
      'p-6',
      'transition-all',
      'duration-300',
      'hover:shadow-xl',
      'hover:-translate-y-1',
    ],
    props: [
      {
        name: 'variant',
        type: "'default' | 'accent-top' | 'accent-left' | 'ambient-glow' | 'metric' | 'actionable'",
        defaultValue: "'default'",
        description: 'Estilo visual y estructura de la tarjeta.',
        required: false,
      },
      {
        name: 'accentColor',
        type: "'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'zinc'",
        defaultValue: "'indigo'",
        description: 'Tono cromático del acento, indicador o resplandor ambiental.',
        required: false,
      },
      {
        name: 'title',
        type: 'string',
        defaultValue: "'Título de la Tarjeta'",
        description: 'Encabezado principal de la tarjeta.',
        required: true,
      },
      {
        name: 'subtitle',
        type: 'string',
        defaultValue: "''",
        description: 'Texto descriptivo o de apoyo.',
        required: false,
      },
      {
        name: 'badge',
        type: 'string',
        defaultValue: "''",
        description: 'Etiqueta o píldora de categoría en la esquina superior.',
        required: false,
      },
      {
        name: 'metric',
        type: 'string',
        defaultValue: "''",
        description: 'Valor numérico de impacto si la variante es métrica.',
        required: false,
      },
      {
        name: 'trend',
        type: "{ value: string; positive: boolean }",
        defaultValue: 'undefined',
        description: 'Indicador de tendencia porcentual o cambio temporal.',
        required: false,
      },
      {
        name: 'actionLabel',
        type: 'string',
        defaultValue: "''",
        description: 'Texto para el botón de acción inferior.',
        required: false,
      },
      {
        name: 'onAction',
        type: '() => void',
        defaultValue: 'undefined',
        description: 'Callback ejecutado al hacer clic en el botón de acción.',
        required: false,
      },
    ],
    variants: [
      {
        id: 'accent-top',
        name: 'Borde Superior de Acento',
        description: 'Línea superior brillante que demarca el tipo de contenido y jerarquía visual.',
        props: {
          variant: 'accent-top',
          accentColor: 'indigo',
          title: 'Arquitectura Modular',
          subtitle: 'Módulo desacoplado listo para integrarse en cualquier proyecto con Tailwind.',
          badge: 'Core UI',
          actionLabel: 'Explorar Módulo',
        },
        codeSnippet: `<AccentCard
  variant="accent-top"
  accentColor="indigo"
  badge="Core UI"
  title="Arquitectura Modular"
  subtitle="Módulo desacoplado listo para integrarse en cualquier proyecto con Tailwind."
  actionLabel="Explorar Módulo"
  onAction={() => console.log('Módulo seleccionado')}
/>`,
      },
      {
        id: 'ambient-glow',
        name: 'Resplandor Ambiental (Ambient Glow)',
        description: 'Efecto de resplandor sutil difuso detrás de la superficie, ideal para tarjetas destacadas.',
        props: {
          variant: 'ambient-glow',
          accentColor: 'violet',
          title: 'Diseño Sensible al Contexto',
          subtitle: 'Tokens calibrados con contraste óptico en modo oscuro y claro.',
          badge: 'Destacado',
          actionLabel: 'Ver Tokens',
        },
        codeSnippet: `<AccentCard
  variant="ambient-glow"
  accentColor="violet"
  badge="Destacado"
  title="Diseño Sensible al Contexto"
  subtitle="Tokens calibrados con contraste óptico en modo oscuro y claro."
  actionLabel="Ver Tokens"
/>`,
      },
      {
        id: 'accent-left',
        name: 'Indicador Lateral',
        description: 'Borde indicador vertical a la izquierda para estados de atención, alertas o categorías.',
        props: {
          variant: 'accent-left',
          accentColor: 'emerald',
          title: 'Sincronización Completada',
          subtitle: 'Todos los componentes locales están sincronizados con la última especificación.',
          badge: 'Estado Activo',
        },
        codeSnippet: `<AccentCard
  variant="accent-left"
  accentColor="emerald"
  badge="Estado Activo"
  title="Sincronización Completada"
  subtitle="Todos los componentes locales están sincronizados con la última especificación."
/>`,
      },
      {
        id: 'metric',
        name: 'Tarjeta de Métrica & KPI',
        description: 'Optimizado para cuadros de mando, visualización de métricas y tasas de conversión.',
        props: {
          variant: 'metric',
          accentColor: 'cyan',
          title: 'Tasa de Conversión',
          subtitle: 'Últimos 30 días comparado con el período anterior',
          metric: '48.6%',
          trend: { value: '+14.2%', positive: true },
          badge: 'Semanal',
        },
        codeSnippet: `<AccentCard
  variant="metric"
  accentColor="cyan"
  badge="Semanal"
  title="Tasa de Conversión"
  subtitle="Últimos 30 días comparado con el período anterior"
  metric="48.6%"
  trend={{ value: '+14.2%', positive: true }}
/>`,
      },
      {
        id: 'actionable',
        name: 'Tarjeta de Acción Completa',
        description: 'Incluye encabezado de categoría, icono, cuerpo enriquecido y botón de acción.',
        props: {
          variant: 'actionable',
          accentColor: 'rose',
          title: 'Exportar Colección',
          subtitle: 'Genera un archivo JSON descargable con todos tus tokens y componentes documentados.',
          badge: 'Herramienta',
          actionLabel: 'Descargar Colección',
        },
        codeSnippet: `<AccentCard
  variant="actionable"
  accentColor="rose"
  badge="Herramienta"
  title="Exportar Colección"
  subtitle="Genera un archivo JSON descargable con todos tus tokens y componentes documentados."
  actionLabel="Descargar Colección"
  onAction={() => alert('Exportando colección...')}
/>`,
      },
      {
        id: 'default',
        name: 'Minimalista Sutil',
        description: 'Superficie limpia con micro-bordes neutros para composiciones densas y elegantes.',
        props: {
          variant: 'default',
          accentColor: 'zinc',
          title: 'Configuración Limpia',
          subtitle: 'Sin distracciones visuales, balance exacto de blancos y contraste equilibrado.',
          badge: 'Neutro',
        },
        codeSnippet: `<AccentCard
  variant="default"
  accentColor="zinc"
  badge="Neutro"
  title="Configuración Limpia"
  subtitle="Sin distracciones visuales, balance exacto de blancos y contraste equilibrado."
/>`,
      },
    ],
    usageSnippet: `import { AccentCard } from './components/AccentCard';

export function MiSeccion() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AccentCard
        variant="accent-top"
        accentColor="indigo"
        badge="UI Lab"
        title="AccentCard"
        subtitle="Totalmente personalizable con Tailwind puro."
        actionLabel="Copiar Código"
        onAction={() => console.log('Acción ejecutada')}
      />
    </div>
  );
}`,
    // Código real del componente (Vite ?raw): nunca se desincroniza del archivo
    sourceCode: accentCardSource,
  },
  {
    id: 'primary-button',
    name: 'Button',
    version: '1.1.0',
    versionHistory: [
      {
        version: '1.1.0',
        date: '2026-09-15',
        notes: 'Adaptación a temas Claro y Oscuro con spinner de carga SVG integrado.',
      },
      {
        version: '1.0.0',
        date: '2026-09-12',
        notes: 'Versión base con variantes primary, secondary, outline y destructive.',
      },
    ],
    tagline: 'Botón con estados interactivos, variantes semánticas y soporte de iconos.',
    description:
      'Componente fundamental para acciones primarias y secundarias. Diseñado con padding matemático 2x horizontal vs vertical, micro-transiciones, estados hover/active perceptuales y modo de carga (loading spinner).',
    category: 'buttons',
    tags: [
      'button',
      'botón',
      'cta',
      'interactive',
      'loading',
      'spinner',
      'accion',
      'click',
      'submit',
      'outline',
      'destructive',
    ],
    tokensUsed: [
      'px-4',
      'py-2',
      'rounded-lg',
      'font-medium',
      'text-sm',
      'transition-colors',
      'active:scale-98',
    ],
    props: [
      {
        name: 'variant',
        type: "'primary' | 'secondary' | 'subtle' | 'outline' | 'destructive' | 'ghost'",
        defaultValue: "'primary'",
        description: 'Jerarquía visual de la acción.',
      },
      {
        name: 'size',
        type: "'sm' | 'md' | 'lg'",
        defaultValue: "'md'",
        description: 'Dimensiones del control táctil.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Inhabilita la interacción del botón.',
      },
      {
        name: 'loading',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Muestra un spinner sutil y bloquea interacción.',
      },
    ],
    variants: [
      {
        id: 'primary',
        name: 'Primario',
        description: 'Acción principal de la vista o diálogo.',
        props: { variant: 'primary', label: 'Guardar Cambios' },
        codeSnippet: `<Button variant="primary">Guardar Cambios</Button>`,
      },
      {
        id: 'secondary',
        name: 'Secundario',
        description: 'Superficie neutra de alto contraste para acciones complementarias.',
        props: { variant: 'secondary', label: 'Exportar Datos' },
        codeSnippet: `<Button variant="secondary">Exportar Datos</Button>`,
      },
      {
        id: 'outline',
        name: 'Contorno (Outline)',
        description: 'Borde sutil con fondo transparente para menor peso visual.',
        props: { variant: 'outline', label: 'Ver Documentación' },
        codeSnippet: `<Button variant="outline">Ver Documentación</Button>`,
      },
      {
        id: 'destructive',
        name: 'Destructivo',
        description: 'Alerta para acciones irreversibles como borrar o reiniciar.',
        props: { variant: 'destructive', label: 'Eliminar Registro' },
        codeSnippet: `<Button variant="destructive">Eliminar Registro</Button>`,
      },
      {
        id: 'loading',
        name: 'Estado de Carga (Loading)',
        description: 'Spinner integrado con opacidad reducida.',
        props: { variant: 'primary', loading: true, label: 'Procesando...' },
        codeSnippet: `<Button variant="primary" loading>Procesando...</Button>`,
      },
    ],
    usageSnippet: `import { Button } from './components/Button';

<div className="flex gap-3">
  <Button variant="primary">Guardar</Button>
  <Button variant="secondary">Cancelar</Button>
</div>`,
    // Código real del componente (Vite ?raw): nunca se desincroniza del archivo
    sourceCode: buttonSource,
  },
  {
    id: 'status-badge',
    name: 'StatusBadge',
    version: '1.1.0',
    versionHistory: [
      {
        version: '1.1.0',
        date: '2026-09-15',
        notes: 'Paleta semántica adaptada a modo claro (fondos 50/100) y modo oscuro.',
      },
      {
        version: '1.0.0',
        date: '2026-09-12',
        notes: 'Diseño inicial de píldora con indicador dot y 6 estados semánticos.',
      },
    ],
    tagline: 'Píldoras y etiquetas de estado con punto indicador opcional.',
    description:
      'Diseñadas para indicar estado de sincronización, categorías o prioridades con legibilidad máxima y texto estrictamente en una sola línea.',
    category: 'feedback',
    tags: [
      'badge',
      'insignia',
      'status',
      'estado',
      'tag',
      'pill',
      'píldora',
      'indicador',
      'dot',
      'alerta',
      'etiqueta',
    ],
    tokensUsed: ['rounded-full', 'px-2.5', 'py-0.5', 'text-xs', 'font-medium', 'whitespace-nowrap'],
    props: [
      {
        name: 'status',
        type: "'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple'",
        defaultValue: "'neutral'",
        description: 'Color semántico de la píldora.',
      },
      {
        name: 'withDot',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Muestra un punto de pulso o indicador visual.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: "'Activo'",
        description: 'Texto que se muestra dentro de la insignia.',
      },
    ],
    variants: [
      {
        id: 'success',
        name: 'Éxito / Operativo',
        description: 'Indica estado en línea o tarea completada.',
        props: { status: 'success', label: 'Operativo', withDot: true },
        codeSnippet: `<StatusBadge status="success" label="Operativo" withDot />`,
      },
      {
        id: 'warning',
        name: 'Alerta / Pendiente',
        description: 'Indica revisión requerida o advertencia.',
        props: { status: 'warning', label: 'Pendiente', withDot: true },
        codeSnippet: `<StatusBadge status="warning" label="Pendiente" withDot />`,
      },
      {
        id: 'danger',
        name: 'Peligro / Error',
        description: 'Indica desconexión o fallo.',
        props: { status: 'danger', label: 'Desconectado', withDot: true },
        codeSnippet: `<StatusBadge status="danger" label="Desconectado" withDot />`,
      },
      {
        id: 'info',
        name: 'Informativo',
        description: 'Resalta datos clave o versiones.',
        props: { status: 'info', label: 'v2.4 Ready', withDot: false },
        codeSnippet: `<StatusBadge status="info" label="v2.4 Ready" withDot={false} />`,
      },
    ],
    usageSnippet: `import { StatusBadge } from './components/StatusBadge';

<div className="flex gap-2">
  <StatusBadge status="success" label="Producción" withDot />
  <StatusBadge status="warning" label="En pruebas" withDot />
</div>`,
    // Código real del componente (Vite ?raw): nunca se desincroniza del archivo
    sourceCode: statusBadgeSource,
  },
  {
    id: 'input-field',
    name: 'InputField',
    version: '1.1.0',
    versionHistory: [
      {
        version: '1.1.0',
        date: '2026-09-15',
        notes: 'Bordes y anillos de foco adaptados a Outfit y Plus Jakarta Sans.',
      },
      {
        version: '1.0.0',
        date: '2026-09-13',
        notes: 'Campo de texto con validación visual y textos de ayuda accesibles.',
      },
    ],
    tagline: 'Campo de texto controlado con estados de foco, icono y mensaje de error.',
    description:
      'Formulario limpio con etiquetas semánticas, descripción auxiliar opcional, soporte para iconos y validación visual.',
    category: 'inputs',
    tags: [
      'input',
      'campo',
      'text',
      'texto',
      'form',
      'formulario',
      'validation',
      'error',
      'label',
      'placeholder',
    ],
    tokensUsed: ['rounded-lg', 'border-zinc-700', 'bg-zinc-900', 'px-3.5', 'py-2', 'focus:ring-2', 'focus:ring-indigo-500/20'],
    props: [
      {
        name: 'label',
        type: 'string',
        defaultValue: "''",
        description: 'Etiqueta superior para accesibilidad.',
      },
      {
        name: 'placeholder',
        type: 'string',
        defaultValue: "'Escribe aquí...'",
        description: 'Texto de sugerencia.',
      },
      {
        name: 'error',
        type: 'string',
        defaultValue: "''",
        description: 'Mensaje de error visible.',
      },
      {
        name: 'helperText',
        type: 'string',
        defaultValue: "''",
        description: 'Instrucción o ayuda adicional.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Inhabilita la edición.',
      },
    ],
    variants: [
      {
        id: 'default',
        name: 'Estándar',
        description: 'Campo clásico con label y placeholder.',
        props: { label: 'Nombre del Componente', placeholder: 'Ej. ModernTabs', helperText: 'Usa formato PascalCase' },
        codeSnippet: `<InputField label="Nombre del Componente" placeholder="Ej. ModernTabs" helperText="Usa formato PascalCase" />`,
      },
      {
        id: 'error',
        name: 'Con Validación de Error',
        description: 'Borde carmesí y texto de alerta descriptivo.',
        props: { label: 'Correo Electrónico', placeholder: 'usuario@dominio.com', error: 'Formato de correo no válido' },
        codeSnippet: `<InputField label="Correo Electrónico" error="Formato de correo no válido" defaultValue="usuario@" />`,
      },
      {
        id: 'disabled',
        name: 'Deshabilitado',
        description: 'Campo de solo lectura con cursor bloqueado.',
        props: { label: 'Token de Autenticación', placeholder: 'tk_live_9921', disabled: true },
        codeSnippet: `<InputField label="Token de Autenticación" disabled defaultValue="tk_live_9921" />`,
      },
    ],
    usageSnippet: `import { InputField } from './components/InputField';

<InputField
  label="Repositorio Destino"
  placeholder="mi-organizacion/mi-web"
  helperText="Ruta donde se clonará la pieza"
/>`,
    // Código real del componente (Vite ?raw): nunca se desincroniza del archivo
    sourceCode: inputFieldSource,
  },
  {
    id: 'segmented-control',
    name: 'SegmentedControl',
    version: '1.0.0',
    versionHistory: [
      {
        version: '1.0.0',
        date: '2026-09-14',
        notes: 'Control de opciones mutuamente excluyentes con pastilla flotante animada.',
      },
    ],
    tagline: 'Selector de pestañas o vistas con deslizamiento táctil elegante.',
    description:
      'Control de opciones mutuamente excluyentes con pastilla flotante y transiciones sutiles.',
    category: 'navigation',
    tags: [
      'segmented',
      'segmentado',
      'tabs',
      'pestañas',
      'picker',
      'selector',
      'navigation',
      'nav',
      'switch',
      'opciones',
    ],
    tokensUsed: ['rounded-xl', 'bg-zinc-900', 'p-1', 'border', 'border-zinc-800', 'text-xs', 'font-medium'],
    props: [
      {
        name: 'options',
        type: "Array<{ id: string; label: string }>",
        defaultValue: '[]',
        description: 'Lista de opciones a mostrar.',
        required: true,
      },
      {
        name: 'value',
        type: 'string',
        defaultValue: "''",
        description: 'ID de la opción activa actualmente.',
      },
      {
        name: 'onChange',
        type: '(id: string) => void',
        defaultValue: 'undefined',
        description: 'Callback al alternar la selección.',
      },
    ],
    variants: [
      {
        id: 'view-mode',
        name: 'Selector de Vista',
        description: 'Para alternar vistas como Tabla / Cuadrícula / Código.',
        props: {
          options: [
            { id: 'preview', label: 'Vista Previa' },
            { id: 'code', label: 'Código TSX' },
            { id: 'props', label: 'Documentación' },
          ],
          value: 'preview',
        },
        codeSnippet: `<SegmentedControl
  options={[
    { id: 'preview', label: 'Vista Previa' },
    { id: 'code', label: 'Código TSX' },
    { id: 'props', label: 'Documentación' },
  ]}
  value={activeTab}
  onChange={setActiveTab}
/>`,
      },
    ],
    usageSnippet: `import { SegmentedControl } from './components/SegmentedControl';

const [tab, setTab] = useState('design');

<SegmentedControl
  options={[
    { id: 'design', label: 'Diseño' },
    { id: 'tokens', label: 'Tokens' },
  ]}
  value={tab}
  onChange={setTab}
/>`,
    // Código real del componente (Vite ?raw): nunca se desincroniza del archivo
    sourceCode: segmentedControlSource,
  },
  {
    id: 'notification-callout',
    name: 'NotificationCallout',
    version: '1.0.0',
    versionHistory: [
      {
        version: '1.0.0',
        date: '2026-09-14',
        notes: 'Avisos semánticos con soporte para cierre interactivo y temas duales.',
      },
    ],
    tagline: 'Bloque de aviso semántico con borde de contraste y botón de cierre.',
    description:
      'Componente para notificaciones en página, consejos de diseño o alertas de sincronización.',
    category: 'feedback',
    tags: [
      'notification',
      'notificación',
      'callout',
      'aviso',
      'alert',
      'alerta',
      'banner',
      'feedback',
      'mensaje',
      'toast',
    ],
    tokensUsed: ['rounded-xl', 'p-4', 'border', 'text-sm', 'leading-relaxed'],
    props: [
      {
        name: 'type',
        type: "'info' | 'success' | 'warning' | 'alert'",
        defaultValue: "'info'",
        description: 'Tono semántico de la notificación.',
      },
      {
        name: 'title',
        type: 'string',
        defaultValue: "'Atención'",
        description: 'Título del aviso.',
      },
      {
        name: 'message',
        type: 'string',
        defaultValue: "''",
        description: 'Cuerpo del mensaje descriptivo.',
      },
      {
        name: 'onClose',
        type: '() => void',
        defaultValue: 'undefined',
        description: 'Función opcional para cerrar el aviso.',
      },
    ],
    variants: [
      {
        id: 'info',
        name: 'Informativo',
        description: 'Consejo o nota de flujo de trabajo.',
        props: {
          type: 'info',
          title: 'Flujo de Trabajo mi-ui-lab',
          message: 'Copia cualquier componente con un solo clic y pégalo directamente en tu proyecto con Tailwind.',
        },
        codeSnippet: `<NotificationCallout
  type="info"
  title="Flujo de Trabajo mi-ui-lab"
  message="Copia cualquier componente con un solo clic y pégalo directamente en tu proyecto con Tailwind."
/>`,
      },
      {
        id: 'success',
        name: 'Éxito',
        description: 'Confirmación de guardado o exportación.',
        props: {
          type: 'success',
          title: 'Componente Guardado',
          message: 'La nueva pieza se ha almacenado en tu catálogo local y persistirá en futuras sesiones.',
        },
        codeSnippet: `<NotificationCallout
  type="success"
  title="Componente Guardado"
  message="La nueva pieza se ha almacenado en tu catálogo local y persistirá en futuras sesiones."
/>`,
      },
    ],
    usageSnippet: `import { NotificationCallout } from './components/NotificationCallout';

<NotificationCallout
  type="info"
  title="Actualización de Tokens"
  message="La paleta cromática se ha ajustado para mayor contraste WCAG AA."
/>`,
    // Código real del componente (Vite ?raw): nunca se desincroniza del archivo
    sourceCode: notificationCalloutSource,
  },
  {
    id: 'toggle-switch',
    name: 'ToggleSwitch',
    version: '1.0.0',
    versionHistory: [
      {
        version: '1.0.0',
        date: '2026-09-14',
        notes: 'Interruptor booleano accesible con etiqueta, descripción y rol switch ARIA.',
      },
    ],
    tagline: 'Interruptor booleano accesible con micro-transición suave.',
    description:
      'Control para activar/desactivar opciones, modos oscuros o visibilidad de capas.',
    category: 'inputs',
    tags: [
      'toggle',
      'switch',
      'interruptor',
      'boolean',
      'booleano',
      'control',
      'checkbox',
      'activar',
      'on-off',
    ],
    tokensUsed: ['rounded-full', 'w-10', 'h-6', 'transition-colors', 'duration-200'],
    props: [
      {
        name: 'checked',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Estado activo o inactivo.',
      },
      {
        name: 'onChange',
        type: '(checked: boolean) => void',
        defaultValue: 'undefined',
        description: 'Callback al alternar el estado.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: "''",
        description: 'Texto principal que describe la opción.',
      },
      {
        name: 'description',
        type: 'string',
        defaultValue: "''",
        description: 'Subtexto descriptivo opcional.',
      },
    ],
    variants: [
      {
        id: 'active',
        name: 'Activado',
        description: 'Interruptor en estado ON con label explicativo.',
        props: { checked: true, label: 'Modo Alta Densidad', description: 'Reduce el espaciado en tablas y listas' },
        codeSnippet: `<ToggleSwitch
  checked={true}
  label="Modo Alta Densidad"
  description="Reduce el espaciado en tablas y listas"
  onChange={(val) => console.log(val)}
/>`,
      },
    ],
    usageSnippet: `import { ToggleSwitch } from './components/ToggleSwitch';

const [enabled, setEnabled] = useState(false);

<ToggleSwitch
  checked={enabled}
  onChange={setEnabled}
  label="Sincronización en segundo plano"
/>`,
    // Código real del componente (Vite ?raw): nunca se desincroniza del archivo
    sourceCode: toggleSwitchSource,
  },
  {
    id: 'step-progress-card',
    name: 'StepProgressCard',
    version: '1.0.0',
    versionHistory: [
      {
        version: '1.0.0',
        date: '2026-09-17',
        notes: 'Versión inicial de StepProgressCard con flujo guiado, cajas de llamada a la acción y soporte de temas.',
      },
    ],
    tagline: 'Tarjeta de progreso paso a paso para onboarding, betas guiadas y activación de usuarios.',
    description:
      'Componente modular diseñado para guiar a los usuarios en flujos secuenciales (como incorporación a betas o configuración inicial). Incluye números de paso en badge circular, cajas destacadas con gradiente ambiental, conectores verticales y botones con redirección.',
    category: 'cards',
    tags: [
      'onboarding',
      'steps',
      'paso a paso',
      'stepper',
      'beta',
      'card',
      'tarjeta',
      'progress',
      'guia',
      'callout',
      'android',
      'flow',
    ],
    tokensUsed: [
      'rounded-2xl',
      'rounded-full',
      'rounded-xl',
      'border-zinc-800/80',
      'bg-white/5',
      'space-y-6',
      'tracking-[0.2em]',
      'uppercase',
      'transition-all',
      'hover:scale-[1.01]',
    ],
    props: [
      {
        name: 'variant',
        type: "'default' | 'glow' | 'compact'",
        defaultValue: "'default'",
        description: 'Estilo visual de la tarjeta: estándar, con resplandor ambiental o compacta.',
        required: false,
      },
      {
        name: 'accentColor',
        type: "'fuchsia' | 'indigo' | 'emerald' | 'violet' | 'amber' | 'cyan' | 'zinc'",
        defaultValue: "'fuchsia'",
        description: 'Paleta cromática aplicada a las llamadas de atención y botones primarios.',
        required: false,
      },
      {
        name: 'title',
        type: 'string',
        defaultValue: "'Android Beta'",
        description: 'Título superior del bloque de pasos.',
        required: true,
      },
      {
        name: 'badge',
        type: 'string',
        defaultValue: "undefined",
        description: 'Insignia opcional en la esquina superior derecha.',
        required: false,
      },
      {
        name: 'steps',
        type: 'StepItem[]',
        defaultValue: 'DEFAULT_BETA_STEPS',
        description: 'Lista de pasos estructurados con número, descripción, aviso y enlace.',
        required: false,
      },
    ],
    variants: [
      {
        id: 'beta-onboarding',
        name: 'Beta Onboarding',
        description: 'Flujo original de incorporación a Android Beta con Google Group y Google Play.',
        props: {
          variant: 'default',
          title: 'Android Beta',
          badge: 'v1.4 Beta',
          accentColor: 'fuchsia',
        },
        codeSnippet: `<StepProgressCard
  variant="default"
  title="Android Beta"
  badge="v1.4 Beta"
  accentColor="fuchsia"
/>`,
      },
      {
        id: 'ambient-glow',
        name: 'Resplandor Glow',
        description: 'Fondo de cristal oscuro con resplandor ambiental violeta/fucsia.',
        props: {
          variant: 'glow',
          title: 'Acceso Exclusivo',
          badge: 'Privado',
          accentColor: 'violet',
        },
        codeSnippet: `<StepProgressCard
  variant="glow"
  title="Acceso Exclusivo"
  badge="Privado"
  accentColor="violet"
/>`,
      },
      {
        id: 'setup-compact',
        name: 'Compacto / Setup',
        description: 'Versión ajustada para barras laterales o diálogos modales de configuración.',
        props: {
          variant: 'compact',
          title: 'Configuración Rápida',
          accentColor: 'indigo',
        },
        codeSnippet: `<StepProgressCard
  variant="compact"
  title="Configuración Rápida"
  accentColor="indigo"
/>`,
      },
    ],
    usageSnippet: `import { StepProgressCard } from './components/ui/StepProgressCard';

export default function MiPantalla() {
  return (
    <StepProgressCard
      title="Android Beta"
      badge="v1.4 Beta"
      variant="default"
      accentColor="fuchsia"
    />
  );
}`,
    // Código real del componente (Vite ?raw): nunca se desincroniza del archivo
    sourceCode: stepProgressCardSource,
  },
];

// src/components/builtInRenderers.tsx
// Registro id -> render de las piezas base. Añadir una pieza base = añadir su entrada aquí
// (un test comprueba que cada pieza de INITIAL_COMPONENTS tiene la suya).
// Los props llegan como datos (PropValues): se leen con accesores tipados, y un valor con el tipo
// equivocado cae al valor por defecto de la pieza en lugar de llegar tal cual al componente.
import React from 'react';
import { AccentColor } from '../types';
import { AccentCard, AccentCardProps, AccentCardVariant } from './ui/AccentCard';
import { Button, ButtonProps } from './ui/Button';
import { StatusBadge, StatusBadgeProps } from './ui/StatusBadge';
import { InputField } from './ui/InputField';
import { SegmentedControl, Option } from './ui/SegmentedControl';
import { NotificationCallout, NotificationCalloutProps } from './ui/NotificationCallout';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { StepProgressCard, StepItem, StepProgressCardVariant } from './ui/StepProgressCard';
import {
  isPropObject,
  PropValue,
  PropValues,
  readArray,
  readBool,
  readOneOf,
  readString,
} from '../utils/propValues';

export interface BuiltInRenderContext {
  /** Props de la variante activa + overrides del editor. */
  props: PropValues;
  effectiveAccent: AccentColor;
  compact: boolean;
  onToast: (msg: string) => void;
  onPropChange: (propName: string, val: PropValue) => void;
}

const ACCENT_CARD_VARIANTS: readonly AccentCardVariant[] = [
  'default', 'accent-top', 'accent-left', 'ambient-glow', 'metric', 'actionable',
];
const BUTTON_VARIANTS: readonly NonNullable<ButtonProps['variant']>[] = [
  'primary', 'secondary', 'subtle', 'outline', 'destructive', 'ghost',
];
const BADGE_STATUSES: readonly NonNullable<StatusBadgeProps['status']>[] = [
  'neutral', 'success', 'warning', 'danger', 'info', 'purple',
];
const CALLOUT_TYPES: readonly NonNullable<NotificationCalloutProps['type']>[] = ['info', 'success', 'warning', 'alert'];
const STEP_CARD_VARIANTS: readonly StepProgressCardVariant[] = ['default', 'glow', 'compact'];

function readTrend(v: unknown): AccentCardProps['trend'] {
  if (!isPropObject(v)) return undefined;
  const value = readString(v.value);
  return value === undefined ? undefined : { value, positive: readBool(v.positive, true) };
}

const readOptions = (v: unknown): Option[] | undefined =>
  readArray(v, (item) => {
    if (!isPropObject(item)) return undefined;
    const id = readString(item.id);
    const label = readString(item.label);
    return id !== undefined && label !== undefined ? { id, label } : undefined;
  });

const readSteps = (v: unknown): StepItem[] | undefined =>
  readArray(v, (item) => {
    if (!isPropObject(item)) return undefined;
    const title = readString(item.title);
    const stepNumber = typeof item.stepNumber === 'number' ? item.stepNumber : readString(item.stepNumber);
    if (title === undefined || stepNumber === undefined) return undefined;
    const callout = isPropObject(item.callout) ? item.callout : undefined;
    const calloutTag = readString(callout?.tag);
    const calloutText = readString(callout?.text);
    return {
      id: readString(item.id),
      stepNumber,
      title,
      description: readString(item.description) ?? '',
      callout: calloutTag !== undefined && calloutText !== undefined ? { tag: calloutTag, text: calloutText } : undefined,
      actionLabel: readString(item.actionLabel),
      actionUrl: readString(item.actionUrl),
      isCompleted: typeof item.isCompleted === 'boolean' ? item.isCompleted : undefined,
      highlightAction: typeof item.highlightAction === 'boolean' ? item.highlightAction : undefined,
    };
  });

export const BUILT_IN_RENDERERS: Record<string, (ctx: BuiltInRenderContext) => React.ReactNode> = {
  'accent-card': ({ props, effectiveAccent, compact, onToast, onPropChange }) => (
    <div className={`w-full ${compact ? 'max-w-xs' : 'max-w-md'} mx-auto`}>
      <AccentCard
        variant={readOneOf(props.variant, ACCENT_CARD_VARIANTS, 'default')}
        accentColor={effectiveAccent}
        title={readString(props.title) || 'Título de Ejemplo'}
        subtitle={readString(props.subtitle)}
        badge={readString(props.badge)}
        metric={readString(props.metric)}
        trend={readTrend(props.trend)}
        actionLabel={readString(props.actionLabel)}
        onAction={() => onToast(`Acción en AccentCard (${effectiveAccent})`)}
      />
    </div>
  ),
  'primary-button': ({ props, effectiveAccent, compact, onToast, onPropChange }) => (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 ${
        compact ? 'py-4' : 'py-8'
      }`}
    >
      <Button
        variant={readOneOf(props.variant, BUTTON_VARIANTS, 'primary')}
        loading={readBool(props.loading, false)}
        disabled={readBool(props.disabled, false)}
        onClick={() => onToast('Clic en botón!')}
      >
        {readString(props.label) || 'Botón de Acción'}
      </Button>
      <Button variant="secondary" onClick={() => onToast('Clic secundario')}>
        Secundario
      </Button>
      {!compact && <Button variant="outline">Contorno</Button>}
    </div>
  ),
  'status-badge': ({ props, effectiveAccent, compact, onToast, onPropChange }) => (
    <div
      className={`flex flex-wrap items-center justify-center gap-2.5 ${
        compact ? 'py-4' : 'py-8'
      }`}
    >
      <StatusBadge
        status={readOneOf(props.status, BADGE_STATUSES, 'success')}
        label={readString(props.label) || 'Operativo'}
        withDot={readBool(props.withDot, true)}
      />
      <StatusBadge status="warning" label="En revisión" withDot />
      <StatusBadge status="danger" label="Error 503" withDot />
      {!compact && (
        <>
          <StatusBadge status="purple" label="Experimental" withDot />
          <StatusBadge status="info" label="v1.4.2" withDot={false} />
        </>
      )}
    </div>
  ),
  'input-field': ({ props, effectiveAccent, compact, onToast, onPropChange }) => (
    <div
      className={`w-full ${
        compact ? 'max-w-xs' : 'max-w-sm'
      } mx-auto space-y-3 ${compact ? 'py-2' : 'py-6'}`}
    >
      <InputField
        label={readString(props.label) || 'Nombre de la Pieza'}
        placeholder={readString(props.placeholder) || 'Ej. CustomModal'}
        helperText={readString(props.helperText)}
        error={readString(props.error)}
        disabled={readBool(props.disabled, false)}
      />
      {!compact && (
        <InputField
          label="Campo con valor"
          defaultValue="AccentCard con Glow"
          helperText="Tokens guardados localmente"
        />
      )}
    </div>
  ),
  'segmented-control': ({ props, effectiveAccent, compact, onToast, onPropChange }) => (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        compact ? 'py-4' : 'py-8'
      }`}
    >
      <SegmentedControl
        options={
          readOptions(props.options) || [
            { id: 'view1', label: 'General' },
            { id: 'view2', label: 'Variantes' },
            { id: 'view3', label: 'Tokens' },
          ]
        }
        value={readString(props.value) || 'view1'}
        onChange={(val) => {
          onPropChange('value', val);
          onToast(`Opción seleccionada: ${val}`);
        }}
      />
      <span className="text-xs text-zinc-400">
        Opción activa:{' '}
        <strong className="text-zinc-200">{readString(props.value) || 'view1'}</strong>
      </span>
    </div>
  ),
  'notification-callout': ({ props, effectiveAccent, compact, onToast, onPropChange }) => (
    <div
      className={`w-full ${
        compact ? 'max-w-sm' : 'max-w-lg'
      } mx-auto space-y-2.5 ${compact ? 'py-2' : 'py-4'}`}
    >
      <NotificationCallout
        type={readOneOf(props.type, CALLOUT_TYPES, 'info')}
        title={readString(props.title) || 'Información de Tokens'}
        message={
          readString(props.message) ||
          'Componente adaptado a tus tipografías y reglas de espaciado.'
        }
        onClose={() => onToast('Aviso cerrado')}
      />
      {!compact && (
        <NotificationCallout
          type="success"
          title="Sincronización Exitosa"
          message="Todos los archivos fueron compilados sin dependencias externas."
        />
      )}
    </div>
  ),
  'toggle-switch': ({ props, effectiveAccent, compact, onToast, onPropChange }) => (
    <div
      className={`w-full ${
        compact ? 'max-w-xs' : 'max-w-sm'
      } mx-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 ${
        compact ? 'p-3.5 space-y-2' : 'p-5 space-y-4'
      }`}
    >
      <ToggleSwitch
        checked={readBool(props.checked, true)}
        onChange={(val) => {
          onPropChange('checked', val);
          onToast(`Toggle: ${val ? 'Activado' : 'Desactivado'}`);
        }}
        label={readString(props.label) || 'Acentuar bordes activos'}
        description={readString(props.description) || 'Aplica resplandor en foco y hover'}
      />
      {!compact && (
        <>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
          <ToggleSwitch
            checked={false}
            onChange={(val) => onToast(`Toggle 2 cambiado: ${val}`)}
            label="Copia automática"
            description="Copia el JSX al portapapeles"
          />
        </>
      )}
    </div>
  ),
  'step-progress-card': ({ props, effectiveAccent, compact, onToast, onPropChange }) => (
    <div className={`w-full ${compact ? 'max-w-sm' : 'max-w-md'} mx-auto`}>
      <StepProgressCard
        variant={readOneOf(props.variant, STEP_CARD_VARIANTS, 'default')}
        accentColor={effectiveAccent}
        title={readString(props.title) || 'Android Beta'}
        badge={readString(props.badge)}
        steps={readSteps(props.steps)}
        onStepAction={(step) => onToast(`Paso seleccionado: ${step.title}`)}
      />
    </div>
  ),
};

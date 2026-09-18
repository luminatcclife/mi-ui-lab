import React from 'react';
import { AccentColor, UIComponent } from '../types';
import { AccentCard } from './ui/AccentCard';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';
import { InputField } from './ui/InputField';
import { SegmentedControl } from './ui/SegmentedControl';
import { NotificationCallout } from './ui/NotificationCallout';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { LiveComponentPreview } from './LiveComponentPreview';

interface InteractiveComponentRendererProps {
  component: UIComponent;
  activeVariantProps?: Record<string, any>;
  propOverrides?: Record<string, any>;
  accentColor?: AccentColor;
  onToast?: (msg: string) => void;
  onPropChange?: (propName: string, val: any) => void;
  compact?: boolean;
}

export function InteractiveComponentRenderer({
  component,
  activeVariantProps = {},
  propOverrides = {},
  accentColor = 'indigo',
  onToast = () => {},
  onPropChange = () => {},
  compact = false,
}: InteractiveComponentRendererProps) {
  const props = { ...activeVariantProps, ...propOverrides };
  const effectiveAccent = (props.accentColor as AccentColor) || accentColor;

  if (component.id === 'accent-card') {
    return (
      <div className={`w-full ${compact ? 'max-w-xs' : 'max-w-md'} mx-auto`}>
        <AccentCard
          variant={props.variant || 'default'}
          accentColor={effectiveAccent}
          title={props.title || 'Título de Ejemplo'}
          subtitle={props.subtitle}
          badge={props.badge}
          metric={props.metric}
          trend={props.trend}
          actionLabel={props.actionLabel}
          onAction={() => onToast(`Acción en AccentCard (${effectiveAccent})`)}
        />
      </div>
    );
  }

  if (component.id === 'primary-button') {
    return (
      <div
        className={`flex flex-wrap items-center justify-center gap-3 ${
          compact ? 'py-4' : 'py-8'
        }`}
      >
        <Button
          variant={props.variant || 'primary'}
          loading={Boolean(props.loading)}
          disabled={Boolean(props.disabled)}
          onClick={() => onToast('Clic en botón!')}
        >
          {props.label || 'Botón de Acción'}
        </Button>
        <Button variant="secondary" onClick={() => onToast('Clic secundario')}>
          Secundario
        </Button>
        {!compact && <Button variant="outline">Contorno</Button>}
      </div>
    );
  }

  if (component.id === 'status-badge') {
    return (
      <div
        className={`flex flex-wrap items-center justify-center gap-2.5 ${
          compact ? 'py-4' : 'py-8'
        }`}
      >
        <StatusBadge
          status={props.status || 'success'}
          label={props.label || 'Operativo'}
          withDot={props.withDot ?? true}
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
    );
  }

  if (component.id === 'input-field') {
    return (
      <div
        className={`w-full ${
          compact ? 'max-w-xs' : 'max-w-sm'
        } mx-auto space-y-3 ${compact ? 'py-2' : 'py-6'}`}
      >
        <InputField
          label={props.label || 'Nombre de la Pieza'}
          placeholder={props.placeholder || 'Ej. CustomModal'}
          helperText={props.helperText}
          error={props.error}
          disabled={Boolean(props.disabled)}
        />
        {!compact && (
          <InputField
            label="Campo con valor"
            defaultValue="AccentCard con Glow"
            helperText="Tokens guardados localmente"
          />
        )}
      </div>
    );
  }

  if (component.id === 'segmented-control') {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-4 ${
          compact ? 'py-4' : 'py-8'
        }`}
      >
        <SegmentedControl
          options={
            props.options || [
              { id: 'view1', label: 'General' },
              { id: 'view2', label: 'Variantes' },
              { id: 'view3', label: 'Tokens' },
            ]
          }
          value={props.value || 'view1'}
          onChange={(val) => {
            onPropChange('value', val);
            onToast(`Opción seleccionada: ${val}`);
          }}
        />
        <span className="text-xs text-zinc-400">
          Opción activa:{' '}
          <strong className="text-zinc-200">{props.value || 'view1'}</strong>
        </span>
      </div>
    );
  }

  if (component.id === 'notification-callout') {
    return (
      <div
        className={`w-full ${
          compact ? 'max-w-sm' : 'max-w-lg'
        } mx-auto space-y-2.5 ${compact ? 'py-2' : 'py-4'}`}
      >
        <NotificationCallout
          type={props.type || 'info'}
          title={props.title || 'Información de Tokens'}
          message={
            props.message ||
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
    );
  }

  if (component.id === 'toggle-switch') {
    return (
      <div
        className={`w-full ${
          compact ? 'max-w-xs' : 'max-w-sm'
        } mx-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 ${
          compact ? 'p-3.5 space-y-2' : 'p-5 space-y-4'
        }`}
      >
        <ToggleSwitch
          checked={props.checked !== undefined ? Boolean(props.checked) : true}
          onChange={(val) => {
            onPropChange('checked', val);
            onToast(`Toggle: ${val ? 'Activado' : 'Desactivado'}`);
          }}
          label={props.label || 'Acentuar bordes activos'}
          description={props.description || 'Aplica resplandor en foco y hover'}
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
    );
  }

  // Piezas personalizadas o capturadas: se compilan y renderizan en vivo
  // desde su sourceCode real, en vez de una tarjeta estática.
  return (
    <div className={`w-full ${compact ? 'max-w-xs' : 'max-w-md'} mx-auto`}>
      <LiveComponentPreview componentName={component.name} sourceCode={component.sourceCode} />
    </div>
  );
}

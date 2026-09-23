import React from 'react';
import { ACCENT_COLORS, AccentColor, UIComponent } from '../types';
import { PropValue, PropValues, readOneOf } from '../utils/propValues';
import { BUILT_IN_RENDERERS } from './builtInRenderers';
import { CustomComponentRenderer } from './ui/CustomComponentRenderer';
import { ErrorBoundary, PieceErrorFallback } from './ErrorBoundary';

interface InteractiveComponentRendererProps {
  component: UIComponent;
  activeVariantProps?: PropValues;
  propOverrides?: PropValues;
  accentColor?: AccentColor;
  onToast?: (msg: string) => void;
  onPropChange?: (propName: string, val: PropValue) => void;
  compact?: boolean;
}

function PieceRenderer({
  component,
  activeVariantProps = {},
  propOverrides = {},
  accentColor = 'indigo',
  onToast = () => {},
  onPropChange = () => {},
  compact = false,
}: InteractiveComponentRendererProps) {
  const props = { ...activeVariantProps, ...propOverrides };
  const effectiveAccent = readOneOf(props.accentColor, ACCENT_COLORS, accentColor);

  const renderBuiltIn = BUILT_IN_RENDERERS[component.id];
  if (renderBuiltIn) {
    return <>{renderBuiltIn({ props, effectiveAccent, compact, onToast, onPropChange })}</>;
  }

  // Fallback for custom or user-created pieces
  return (
    <CustomComponentRenderer
      component={component}
      activeVariantProps={activeVariantProps}
      propOverrides={propOverrides}
      accentColor={effectiveAccent}
      onToast={onToast}
      compact={compact}
    />
  );
}

/** Cada pieza se renderiza aislada: si falla, muestra su propio aviso y el resto de la pantalla sigue viva. */
export function InteractiveComponentRenderer(props: InteractiveComponentRendererProps) {
  return (
    <ErrorBoundary
      label={props.component.id}
      // Por contenido: los props suelen llegar como objetos literales nuevos en cada render
      resetKeys={[props.component, JSON.stringify(props.activeVariantProps ?? {}), JSON.stringify(props.propOverrides ?? {})]}
      fallback={(error, reset) => <PieceErrorFallback name={props.component.name} error={error} onRetry={reset} />}
    >
      <PieceRenderer {...props} />
    </ErrorBoundary>
  );
}

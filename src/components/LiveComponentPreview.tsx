import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { compileComponentSource } from '../utils/liveComponentCompiler';
import { LiveErrorBoundary } from './LiveErrorBoundary';

interface LiveComponentPreviewProps {
  componentName: string;
  sourceCode: string;
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-amber-300/60 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 p-5 text-sm">
      <div className="mb-2 flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {title}
      </div>
      <p className="leading-relaxed text-amber-800/90 dark:text-amber-300/90">{message}</p>
    </div>
  );
}

/**
 * Renderiza en vivo el `sourceCode` de una pieza personalizada/capturada,
 * en vez de una tarjeta estática. Compila con Sucrase (cacheado por texto
 * fuente) y aísla los fallos de ejecución con LiveErrorBoundary.
 */
export function LiveComponentPreview({ componentName, sourceCode }: LiveComponentPreviewProps) {
  const { Component, error } = useMemo(
    () => compileComponentSource(sourceCode),
    [sourceCode],
  );

  if (error || !Component) {
    return (
      <ErrorCard
        title={`No se pudo previsualizar "${componentName}"`}
        message={error || 'Componente no encontrado.'}
      />
    );
  }

  return (
    <LiveErrorBoundary
      resetKey={sourceCode}
      fallback={(err) => (
        <ErrorCard title={`"${componentName}" falló al renderizar`} message={err.message} />
      )}
    >
      <Component />
    </LiveErrorBoundary>
  );
}

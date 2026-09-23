// src/components/ui/SandboxedHtmlPreview.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildSandboxDocument, SandboxMessage, SandboxTheme } from '../../utils/sandboxDocument';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

interface SandboxedHtmlPreviewProps {
  /** HTML de terceros; se sanea aquí de nuevo (defensa en profundidad para datos importados o antiguos). */
  html: string;
  theme: SandboxTheme;
  /** Clases Tailwind del contenedor dentro del iframe. */
  wrapperClass?: string;
  title: string;
  minHeight?: number;
  onClickLabel?: (label: string) => void;
}

/**
 * Renderiza HTML capturado dentro de un iframe aislado (origen opaco + Tailwind compilado en el navegador), igual que
 * la vista previa del Inspector: así se ve con los mismos estilos en Biblioteca y Playground, y el
 * HTML nunca se ejecuta en el documento de la app. El alto se ajusta al contenido vía postMessage.
 */
export function SandboxedHtmlPreview({
  html,
  theme,
  wrapperClass,
  title,
  minHeight = 120,
  onClickLabel,
}: SandboxedHtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);
  const onClickRef = useRef(onClickLabel);
  onClickRef.current = onClickLabel;

  const srcDoc = useMemo(
    () =>
      buildSandboxDocument({
        html: sanitizeHtml(html),
        theme,
        background: 'transparent',
        wrapperClass,
        fillViewport: false,
        bridge: true,
      }),
    [html, theme, wrapperClass],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Solo se aceptan mensajes de ESTE iframe (origen opaco: se identifica por la ventana, no por origin)
      if (event.source !== iframeRef.current?.contentWindow) return;
      const msg = event.data as SandboxMessage;
      if (!msg || msg.source !== 'mi-ui-lab-sandbox') return;
      if (msg.type === 'resize' && typeof msg.height === 'number') {
        setHeight(Math.max(minHeight, Math.min(msg.height, 4000)));
      } else if (msg.type === 'click' && typeof msg.label === 'string') {
        onClickRef.current?.(msg.label.slice(0, 25));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [minHeight]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      loading="lazy"
      className="block w-full border-0 bg-transparent"
      style={{ height, colorScheme: 'normal' }}
    />
  );
}

import React from 'react';
import { transform } from 'sucrase';

/**
 * mi-ui-lab — Compilador en vivo de piezas propias
 *
 * Transforma el `sourceCode` (TSX) guardado de una pieza personalizada o
 * capturada, y lo ejecuta en un sandbox mínimo para poder previsualizarla
 * de verdad en el Playground, en vez de mostrar solo una tarjeta estática.
 *
 * Alcance deliberado: el único módulo resoluble dentro del código pegado
 * es 'react' (incluye JSX, hooks y tipos). Cualquier otro import (íconos,
 * animación, utilidades) falla con un mensaje claro en vez de intentar
 * adivinar — mantiene el sandbox liviano y predecible. La pestaña
 * "Código Fuente" siempre muestra el código completo, se pueda
 * previsualizar en vivo o no.
 */

export interface CompiledComponentResult {
  Component: React.ComponentType<any> | null;
  error: string | null;
}

const compileCache = new Map<string, CompiledComponentResult>();

function sandboxRequire(moduleName: string): any {
  if (moduleName === 'react') return React;
  throw new Error(
    `Esta pieza importa "${moduleName}", que la vista previa en vivo todavía no soporta (por ahora solo 'react'). Podés ver el código completo en la pestaña "Código Fuente".`,
  );
}

function pickComponent(moduleExports: Record<string, any>): React.ComponentType<any> | null {
  if (typeof moduleExports?.default === 'function') {
    return moduleExports.default;
  }
  const namedComponent = Object.entries(moduleExports).find(
    ([name, value]) => typeof value === 'function' && /^[A-Z]/.test(name),
  );
  return namedComponent ? (namedComponent[1] as React.ComponentType<any>) : null;
}

/**
 * Compila y cachea (por texto fuente exacto) una pieza personalizada.
 * Nunca lanza: los errores de sintaxis, de import o de ejecución vuelven
 * como `{ error }` para que el llamador los muestre como tarjeta amable.
 */
export function compileComponentSource(sourceCode: string): CompiledComponentResult {
  const cached = compileCache.get(sourceCode);
  if (cached) return cached;

  let result: CompiledComponentResult;
  try {
    const { code } = transform(sourceCode, {
      transforms: ['jsx', 'typescript', 'imports'],
      jsxPragma: 'React.createElement',
      jsxFragmentPragma: 'React.Fragment',
      production: true,
    });

    const moduleObj: { exports: Record<string, any> } = { exports: {} };
    const factory = new Function('React', 'require', 'module', 'exports', code);
    factory(React, sandboxRequire, moduleObj, moduleObj.exports);

    const Component = pickComponent(moduleObj.exports);
    result = Component
      ? { Component, error: null }
      : {
          Component: null,
          error:
            'No se encontró ningún componente exportado (una función que empiece con mayúscula) en este código.',
        };
  } catch (err: any) {
    result = {
      Component: null,
      error: err?.message || 'Error desconocido al compilar el código de la pieza.',
    };
  }

  compileCache.set(sourceCode, result);
  return result;
}

/** Limpia la caché de compilación (útil tras editar/borrar piezas en bloque). */
export function clearComponentCompileCache(): void {
  compileCache.clear();
}

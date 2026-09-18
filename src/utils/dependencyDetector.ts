import { DetectedDependency } from '../types';

/**
 * mi-ui-lab — Detector de dependencias
 *
 * Analiza un fragmento de HTML/JSX pegado por el usuario y busca huellas
 * (clases, atributos, nombres de etiqueta) de librerías conocidas del
 * ecosistema. Es un cotejo de patrones, no un analizador semántico: sirve
 * para avisar antes de guardar, nunca para bloquear el guardado.
 *
 * Importante: pegar HTML solo captura marcado y clases, nunca lógica ni
 * estado. Una detección positiva (p. ej. Radix) es una señal de que lo
 * capturado probablemente depende de JavaScript que este HTML no incluye —
 * no una garantía de que el componente resultante será funcional.
 */

interface DependencySignature {
  library: string;
  packageName: string;
  installCommand: string;
  patterns: RegExp[];
}

// Lista mantenida a mano: qué paquetes están instalados HOY en mi-ui-lab.
// Actualízala si cambias package.json.
const INSTALLED_PACKAGES = new Set([
  'lucide-react',
  'motion',
  'react',
  'react-dom',
  'dexie',
]);

const SIGNATURES: DependencySignature[] = [
  {
    library: 'Lucide Icons',
    packageName: 'lucide-react',
    installCommand: 'npm install lucide-react',
    patterns: [/\blucide\b/i, /\blucide-[\w-]+\b/i, /data-lucide=/i],
  },
  {
    library: 'Framer Motion / Motion for React',
    packageName: 'motion',
    installCommand: 'npm install motion',
    patterns: [
      /<motion\.\w+/i,
      /\b(animate|initial|whileHover|whileTap|layoutId)=/,
      /\bframer-[\w-]+\b/i,
      /data-framer-/i,
    ],
  },
  {
    library: 'Radix UI / Primitivas Shadcn',
    packageName: '@radix-ui/react-primitive',
    installCommand: 'npm install @radix-ui/react-dialog',
    patterns: [
      /data-state=["'](open|closed|checked)["']/i,
      /data-radix-[\w-]+/i,
      /data-side=/i,
      /\bradix-[\w-]+\b/i,
    ],
  },
  {
    library: 'Flowbite (JS interactivo: dropdowns, modales, tooltips...)',
    packageName: 'flowbite',
    installCommand: 'npm install flowbite',
    patterns: [
      /data-dropdown-toggle=/i,
      /data-modal-target=/i,
      /data-modal-toggle=/i,
      /data-collapse-toggle=/i,
      /data-tooltip-target=/i,
      /data-popover-target=/i,
      /data-accordion-target=/i,
      /data-tabs-target=/i,
      /data-drawer-target=/i,
      /data-carousel=/i,
    ],
  },
  {
    library: 'Headless UI',
    packageName: '@headlessui/react',
    installCommand: 'npm install @headlessui/react',
    patterns: [/data-headlessui-[\w-]+/i, /\bheadlessui-[\w-]+\b/i],
  },
  {
    library: 'Heroicons',
    packageName: '@heroicons/react',
    installCommand: 'npm install @heroicons/react',
    patterns: [/\bheroicon-[\w-]+\b/i],
  },
  {
    library: 'Tabler Icons',
    packageName: '@tabler/icons-react',
    installCommand: 'npm install @tabler/icons-react',
    patterns: [/\btabler-[\w-]+\b/i],
  },
  {
    library: 'Feather Icons',
    packageName: 'react-feather',
    installCommand: 'npm install react-feather',
    patterns: [/\bfeather-[\w-]+\b/i],
  },
  {
    library: 'Font Awesome',
    packageName: '@fortawesome/react-fontawesome',
    installCommand:
      'npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons',
    patterns: [/\bfa-solid\b/i, /\bfa-regular\b/i],
  },
  {
    library: '@tailwindcss/typography',
    packageName: '@tailwindcss/typography',
    installCommand: 'npm install -D @tailwindcss/typography',
    patterns: [/\bprose\b/, /\bprose-invert\b/],
  },
  {
    library: '@tailwindcss/forms',
    packageName: '@tailwindcss/forms',
    installCommand: 'npm install -D @tailwindcss/forms',
    patterns: [/\bform-input\b/, /\bform-select\b/, /\bform-checkbox\b/, /\bform-radio\b/],
  },
  {
    library: 'class-variance-authority (cva)',
    packageName: 'class-variance-authority',
    installCommand: 'npm install class-variance-authority',
    patterns: [/\bcva\(/],
  },
  {
    library: 'clsx',
    packageName: 'clsx',
    installCommand: 'npm install clsx',
    patterns: [/\bclsx\(/],
  },
  {
    library: 'tailwind-merge',
    packageName: 'tailwind-merge',
    installCommand: 'npm install tailwind-merge',
    patterns: [/\btwMerge\(/],
  },
];

/**
 * Analiza un fragmento de HTML/JSX y devuelve las dependencias detectadas,
 * marcando cuáles ya están instaladas en el lab.
 */
export function detectDependencies(code: string): DetectedDependency[] {
  const results: DetectedDependency[] = [];

  for (const sig of SIGNATURES) {
    const matchedTokens = new Set<string>();
    for (const pattern of sig.patterns) {
      const match = code.match(pattern);
      if (match) matchedTokens.add(match[0]);
    }

    if (matchedTokens.size > 0) {
      results.push({
        library: sig.library,
        packageName: sig.packageName,
        installed: INSTALLED_PACKAGES.has(sig.packageName),
        installCommand: sig.installCommand,
        matchedTokens: Array.from(matchedTokens),
      });
    }
  }

  return results;
}

/** True si hay alguna dependencia detectada que no está instalada. */
export function hasPendingDependencies(deps: DetectedDependency[]): boolean {
  return deps.some((d) => !d.installed);
}
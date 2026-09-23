// src/utils/dependencyDetector.ts

export interface DetectedDependency {
  id: string;
  name: string;
  packageName: string;
  installCommand: string;
  reason: string;
  isInstalledInCurrentApp: boolean;
  severity: 'warning' | 'info';
  matchedTokens: string[];
  docsUrl?: string;
}

// Map of packages present in this project's package.json.
// Keep in sync with package.json.
const CURRENT_PROJECT_PACKAGES = new Set([
  'react',
  'react-dom',
  'lucide-react',
  'motion',
  'tailwindcss',
  '@tailwindcss/vite',
  'dexie',
]);

/**
 * Analyzes an HTML or JSX fragment and its class names to detect required or related external libraries.
 */
export function analyzeSnippetDependencies(
  rawCode: string,
  classNames: string[] = []
): DetectedDependency[] {
  const code = rawCode || '';
  const classes = classNames || [];
  const allClassesStr = classes.join(' ');
  const combined = `${code} ${allClassesStr}`;

  const results: DetectedDependency[] = [];

  // 1. Lucide React Icons
  // Detects: class="... lucide lucide-check ...", class="lucide-sparkles", <svg ... data-lucide=...>
  const lucideMatches: string[] = [];
  const lucideClassRegex = /\blucide(-[a-z0-9-]+)?\b/gi;
  let match;
  while ((match = lucideClassRegex.exec(combined)) !== null) {
    if (!lucideMatches.includes(match[0])) {
      lucideMatches.push(match[0]);
    }
  }
  if (/data-lucide\b/i.test(code) || /<Lucide/i.test(code)) {
    lucideMatches.push('data-lucide / <Lucide* />');
  }

  if (lucideMatches.length > 0) {
    results.push({
      id: 'lucide-react',
      name: 'Lucide Icons',
      packageName: 'lucide-react',
      installCommand: 'npm install lucide-react',
      reason: `Se detectaron clases o marcadores de iconos Lucide (${lucideMatches.slice(0, 3).join(', ')}).`,
      isInstalledInCurrentApp: CURRENT_PROJECT_PACKAGES.has('lucide-react'),
      severity: 'info',
      matchedTokens: lucideMatches,
      docsUrl: 'https://lucide.dev',
    });
  }

  // 2. Framer Motion / Motion React
  // Detects: <motion.div, framer-motion, animate=, initial=, whileHover=, data-framer, framer-*
  const motionMatches: string[] = [];
  if (/<motion\.[a-z0-9]+/i.test(code)) {
    motionMatches.push('<motion.*>');
  }
  if (/\b(initial|animate|exit|whileHover|whileTap|layoutId)\s*=/i.test(code)) {
    motionMatches.push('props de animación (animate/whileHover)');
  }
  if (/\bframer(-[a-z0-9-]+)?\b/i.test(combined)) {
    motionMatches.push('clases framer');
  }
  if (/data-framer/i.test(code)) {
    motionMatches.push('data-framer-*');
  }

  if (motionMatches.length > 0) {
    const isInstalled = CURRENT_PROJECT_PACKAGES.has('motion');
    results.push({
      id: 'motion',
      name: 'Motion (Framer Motion)',
      packageName: 'motion',
      installCommand: 'npm install motion',
      reason: `Utiliza componentes o props de animación declarativa (${motionMatches.join(', ')}).`,
      isInstalledInCurrentApp: isInstalled,
      severity: isInstalled ? 'info' : 'warning',
      matchedTokens: motionMatches,
      docsUrl: 'https://motion.dev',
    });
  }

  // 3. Radix UI / Headless Primitives (Shadcn UI base)
  // Detects: data-state=, data-radix-, data-side=, data-orientation=, radix-*
  const radixMatches: string[] = [];
  if (/data-radix-[a-z0-9-]+/i.test(code)) {
    radixMatches.push('data-radix-*');
  }
  if (/data-state=["'](open|closed|checked|unchecked|active|inactive)["']/i.test(code)) {
    radixMatches.push('data-state="..."');
  }
  if (/\bradix-[a-z0-9-]+\b/i.test(combined)) {
    radixMatches.push('clases radix-*');
  }
  if (/data-(side|align|orientation)=/i.test(code)) {
    radixMatches.push('atributos de posicionamiento Radix');
  }

  if (radixMatches.length > 0) {
    results.push({
      id: 'radix-ui',
      name: 'Radix UI Primitives',
      packageName: '@radix-ui/react-primitive',
      installCommand: 'npm install @radix-ui/react-dialog @radix-ui/react-slot',
      reason: `El componente utiliza atributos de accesibilidad y estado de Radix UI / Shadcn (${radixMatches.join(', ')}).`,
      isInstalledInCurrentApp: false,
      severity: 'warning',
      matchedTokens: radixMatches,
      docsUrl: 'https://www.radix-ui.com',
    });
  }

  // 4. Headless UI
  const headlessMatches: string[] = [];
  if (/data-headlessui-[a-z0-9-]+/i.test(code) || /\bheadlessui-[a-z0-9-]+\b/i.test(combined)) {
    headlessMatches.push('headlessui-*');
  }
  if (headlessMatches.length > 0) {
    results.push({
      id: 'headlessui',
      name: 'Headless UI',
      packageName: '@headlessui/react',
      installCommand: 'npm install @headlessui/react',
      reason: `Requiere primitivas accesibles de Headless UI para su interacción.`,
      isInstalledInCurrentApp: false,
      severity: 'warning',
      matchedTokens: headlessMatches,
      docsUrl: 'https://headlessui.com',
    });
  }

  // 5. Heroicons / FontAwesome / Tabler / React Icons
  const iconLibMatches: string[] = [];
  if (/\bheroicon(-[a-z0-9-]+)?\b/i.test(combined)) {
    iconLibMatches.push('heroicon');
  }
  if (/\btabler(-[a-z0-9-]+)?\b/i.test(combined)) {
    iconLibMatches.push('tabler-icons');
  }
  if (/\b(fa-solid|fa-regular|fa-brands|fa-[a-z0-9-]+)\b/i.test(combined)) {
    iconLibMatches.push('font-awesome');
  }
  if (/\bfeather(-[a-z0-9-]+)?\b/i.test(combined)) {
    iconLibMatches.push('feather-icons');
  }

  if (iconLibMatches.length > 0) {
    results.push({
      id: 'external-icons',
      name: 'Librería de Iconos Externa',
      packageName: '@heroicons/react o @tabler/icons-react',
      installCommand: 'npm install @heroicons/react',
      reason: `Se detectaron clases de paquetes de iconos (${iconLibMatches.join(', ')}).`,
      isInstalledInCurrentApp: false,
      severity: 'warning',
      matchedTokens: iconLibMatches,
    });
  }

  // 6. Tailwind Plugins: Typography (prose)
  const proseMatches = classes.filter((c) => /\bprose\b|\bprose-[a-z0-9-]+\b/i.test(c));
  if (proseMatches.length > 0) {
    results.push({
      id: 'tailwindcss-typography',
      name: 'Tailwind Typography',
      packageName: '@tailwindcss/typography',
      installCommand: 'npm install -D @tailwindcss/typography',
      reason: `Usa clases de tipografía enriquecida (${proseMatches.slice(0, 3).join(', ')}).`,
      isInstalledInCurrentApp: false,
      severity: 'warning',
      matchedTokens: proseMatches,
      docsUrl: 'https://tailwindcss.com/docs/typography-plugin',
    });
  }

  // 7. Tailwind Forms
  const formsMatches = classes.filter((c) => /^form-(input|textarea|select|checkbox|radio)$/i.test(c));
  if (formsMatches.length > 0) {
    results.push({
      id: 'tailwindcss-forms',
      name: 'Tailwind Forms',
      packageName: '@tailwindcss/forms',
      installCommand: 'npm install -D @tailwindcss/forms',
      reason: `Usa clases específicas del plugin oficial de formularios Tailwind.`,
      isInstalledInCurrentApp: false,
      severity: 'warning',
      matchedTokens: formsMatches,
      docsUrl: 'https://github.com/tailwindlabs/tailwindcss-forms',
    });
  }

  // 8. Flowbite (JS interactivo: dropdowns, modales, tooltips, acordeones...)
  // Estos componentes solo alternan una clase `hidden` mediante el JS propio
  // de Flowbite (data-dropdown-toggle, data-modal-target, etc.) — el HTML
  // capturado se ve idéntico pero el botón no hace nada sin esta dependencia.
  const flowbiteMatches: string[] = [];
  const flowbiteAttrRegex = /data-(dropdown|modal|collapse|tooltip|popover|accordion|tabs|drawer)-(toggle|target|hide|item)\b|data-carousel\b/gi;
  while ((match = flowbiteAttrRegex.exec(code)) !== null) {
    if (!flowbiteMatches.includes(match[0])) {
      flowbiteMatches.push(match[0]);
    }
  }

  if (flowbiteMatches.length > 0) {
    results.push({
      id: 'flowbite',
      name: 'Flowbite (JS interactivo)',
      packageName: 'flowbite',
      installCommand: 'npm install flowbite',
      reason: `El marcado depende del JS de Flowbite para funcionar (${flowbiteMatches.slice(0, 3).join(', ')}) — sin él, el botón no abre/cierra nada.`,
      isInstalledInCurrentApp: CURRENT_PROJECT_PACKAGES.has('flowbite'),
      severity: 'warning',
      matchedTokens: flowbiteMatches,
      docsUrl: 'https://flowbite.com/docs/getting-started/introduction/',
    });
  }

  // 9. Class Variance Authority (CVA) / clsx / tailwind-merge
  if (/\b(cva\(|clsx\(|twMerge\(|cn\()\b/.test(code)) {
    results.push({
      id: 'cva-clsx',
      name: 'Class Variance Authority & Tailwind Merge',
      packageName: 'class-variance-authority clsx tailwind-merge',
      installCommand: 'npm install class-variance-authority clsx tailwind-merge',
      reason: `El código incluye funciones auxiliares de composición condicional de variantes (cn/cva/clsx).`,
      isInstalledInCurrentApp: false,
      severity: 'warning',
      matchedTokens: ['cva / clsx / twMerge'],
    });
  }

  return results;
}

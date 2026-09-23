import { describe, expect, it } from 'vitest';
import { analyzeSnippetDependencies } from './dependencyDetector';

const ids = (code: string, classes: string[] = []) =>
  analyzeSnippetDependencies(code, classes).map((d) => d.id);

describe('analyzeSnippetDependencies', () => {
  it('returns nothing for plain Tailwind markup', () => {
    expect(ids('<div class="p-4 bg-white rounded-xl">Hola</div>', ['p-4', 'bg-white', 'rounded-xl'])).toEqual([]);
  });

  it('detects Lucide icons and marks them as installed here', () => {
    const [dep] = analyzeSnippetDependencies('<svg class="lucide lucide-check"></svg>');
    expect(dep.id).toBe('lucide-react');
    expect(dep.isInstalledInCurrentApp).toBe(true);
  });

  it('detects Flowbite JS attributes as a missing dependency', () => {
    const deps = analyzeSnippetDependencies('<button data-dropdown-toggle="menu">Abrir</button>');
    const flowbite = deps.find((d) => d.id === 'flowbite');
    expect(flowbite).toBeDefined();
    expect(flowbite?.isInstalledInCurrentApp).toBe(false);
  });

  it('detects Radix state attributes', () => {
    expect(ids('<div data-state="open" data-radix-popper-content-wrapper></div>')).toContain('radix-ui');
  });
});

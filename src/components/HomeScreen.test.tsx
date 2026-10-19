import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeScreen } from './HomeScreen';
import { INITIAL_COMPONENTS } from '../data/initialComponents';
import { UIComponent } from '../types';

// Habilita act() fuera de un runner de React Testing Library
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (components: UIComponent[], handlers: Partial<React.ComponentProps<typeof HomeScreen>> = {}) =>
  act(() =>
    root.render(
      <HomeScreen
        components={components}
        customCount={0}
        favoritesCount={2}
        selectedId="accent-card"
        onNavigate={() => {}}
        onOpenPiece={() => {}}
        onExport={() => {}}
        backupKey={0}
        {...handlers}
      />,
    ),
  );

const satellite = (name: string) => container.querySelector<HTMLButtonElement>(`button.orb-node[aria-label="${name}"]`);
const ringToggle = (label: string) =>
  [...container.querySelectorAll<HTMLButtonElement>('.orb-ring-toggle')].find((b) => b.textContent?.includes(label))!;
const click = (el: Element) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

describe('HomeScreen (órbita)', () => {
  it('shows the collection counters and one satellite per piece', () => {
    render(INITIAL_COMPONENTS);
    expect(container.textContent).toContain('8 piezas · 2 favoritas');
    expect(container.textContent).toContain('0 piezas propias');
    for (const piece of INITIAL_COMPONENTS) expect(satellite(piece.name)).not.toBeNull();
  });

  it('folding a ring hides its satellites', () => {
    render(INITIAL_COMPONENTS);
    const cards = ringToggle('Tarjetas');
    expect(cards.getAttribute('aria-pressed')).toBe('true');

    click(cards);
    expect(cards.getAttribute('aria-pressed')).toBe('false');
    expect(satellite('AccentCard')).toBeNull();
    expect(satellite('Button')).not.toBeNull();
    expect(container.textContent).toContain('06 / 08');
  });

  it('focuses a satellite in the core and opens it in the Playground', () => {
    const onOpenPiece = vi.fn();
    render(INITIAL_COMPONENTS, { onOpenPiece });

    click(satellite('ToggleSwitch')!);
    expect(satellite('ToggleSwitch')!.getAttribute('aria-pressed')).toBe('true');
    expect(satellite('AccentCard')!.getAttribute('aria-pressed')).toBe('false');

    const probar = [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Probar')!;
    click(probar);
    expect(onOpenPiece).toHaveBeenCalledWith('toggle-switch');
  });

  it('a crowded ring shows a "+N" satellite that leads to the Biblioteca', () => {
    const base = INITIAL_COMPONENTS.find((c) => c.id === 'primary-button')!;
    const many = Array.from({ length: 30 }, (_, i) => ({ ...base, id: `btn-${i}`, name: `Boton${i}` }));
    const onNavigate = vi.fn();
    render(many, { onNavigate, selectedId: 'btn-0' });

    const more = container.querySelector<HTMLButtonElement>('button.orb-node[aria-label^="Ver "]');
    expect(more).not.toBeNull();
    const hidden = Number(more!.textContent!.replace('+', ''));
    expect(container.querySelectorAll('button.orb-node').length - 1 + hidden).toBe(30);

    click(more!);
    expect(onNavigate).toHaveBeenCalledWith('biblioteca');
  });
});

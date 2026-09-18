export type ComponentCategory =
  | 'all'
  | 'favorites'
  | 'cards'
  | 'buttons'
  | 'inputs'
  | 'feedback'
  | 'navigation'
  | 'data'
  | 'custom';

export interface PropDoc {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
  required?: boolean;
}

export interface ComponentVariant {
  id: string;
  name: string;
  description: string;
  props: Record<string, any>;
  codeSnippet: string;
}

export interface ComponentIteration {
  version: string;
  date: string;
  notes: string;
  changes?: string[];
}

export interface UIComponent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: Exclude<ComponentCategory, 'all' | 'favorites'>;
  sourceCode: string;
  usageSnippet: string;
  variants: ComponentVariant[];
  props: PropDoc[];
  tokensUsed: string[];
  tags: string[];
  isCustom?: boolean;
  isFavorite?: boolean;
  createdAt?: string;
  version?: string;
  versionHistory?: ComponentIteration[];
}

export type ViewportMode = 'responsive' | 'desktop' | 'tablet' | 'mobile';

export type CanvasBackground = 'dots' | 'grid' | 'dark' | 'light';

export type AccentColor =
  | 'indigo'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'zinc';

export interface ComponentConfigSnapshot {
  id: string;
  timestamp: number;
  actionLabel: string;
  selectedVariantId: string;
  accentColor: AccentColor;
  propOverrides: Record<string, any>;
}
export interface DetectedDependency {
  library: string;
  packageName: string;
  installed: boolean;
  installCommand: string;
  matchedTokens: string[];
}

export interface ComponentDraft {
  id: string;
  name: string;
  category: Exclude<ComponentCategory, 'all' | 'favorites'>;
  rawHtml: string;
  detectedDependencies: DetectedDependency[];
  tags: string[];
  createdAt: string;
}

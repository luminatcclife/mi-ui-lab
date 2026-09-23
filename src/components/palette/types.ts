export type ExportFormat = 'tailwind-v4' | 'tailwind-v3' | 'css-vars' | 'ts-theme' | 'classes';

export type CopyHandler = (text: string, key: string, message: string) => void;

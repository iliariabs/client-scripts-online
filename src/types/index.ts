export type Theme = 'light' | 'dark';

export interface EditorRef {
  focus: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
}

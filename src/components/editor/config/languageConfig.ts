export interface LanguageDefinition {
  id: string;
  wasmUrl: string;
}

export const LANGUAGE_CONFIG: Record<string, LanguageDefinition> = {
  javascript: {
    id: 'javascript',
    wasmUrl: import.meta.env.BASE_URL + 'wasm/tree-sitter-javascript.wasm',
  },
  python: {
    id: 'python',
    wasmUrl: import.meta.env.BASE_URL + 'wasm/tree-sitter-python.wasm',
  },
  lua: {
    id: 'lua',
    wasmUrl: import.meta.env.BASE_URL + 'wasm/tree-sitter-lua.wasm',
  },
};
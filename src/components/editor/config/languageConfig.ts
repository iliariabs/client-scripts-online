export interface LanguageDefinition {
  id: string;
  wasmUrl: string;
}

export const LANGUAGE_CONFIG: Record<string, LanguageDefinition> = {
  javascript: {
    id: 'javascript',
    wasmUrl: '/wasm/tree-sitter-javascript.wasm',
  },
  python: {
    id: 'python',
    wasmUrl: '/wasm/tree-sitter-python.wasm',
  },
  lua: {
    id: 'lua',
    wasmUrl: '/wasm/tree-sitter-lua.wasm',
  },
};
declare module 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.mjs' {
  export interface LoadPyodideOptions {
    indexURL: string;
    stdout?: (text: string) => void;
    stderr?: (text: string) => void;
    [key: string]: any;
  }

  export interface PyodideInterface {
    runPythonAsync(code: string): Promise<any>;
    setStdout(options: { batched: (text: string) => void }): void;
    setStderr(options: { batched: (text: string) => void }): void;
    setStdin(options: { stdin: () => string | null }): void;
    [key: string]: any;
  }

  export function loadPyodide(options?: LoadPyodideOptions): Promise<PyodideInterface>;
}
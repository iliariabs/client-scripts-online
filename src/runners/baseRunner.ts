export type InputHandler = (prompt?: string) => Promise<string>;
export type LogHandler = (text: string) => void;

export interface CodeRunner {
  execute(code: string, onInput: InputHandler, onLog: LogHandler): Promise<void>;
  cancel?(): void;
  cleanup?(): void;
}
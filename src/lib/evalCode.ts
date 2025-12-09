import type { CodeRunner, InputHandler, LogHandler } from '../runners/baseRunner';
import { JavaScriptRunner } from '../runners/javascriptRunner';
import { LuaRunner } from '../runners/luaRunner';
import { PythonRunner } from '../runners/pythonRunner';

const runners: Record<string, CodeRunner> = {
  javascript: new JavaScriptRunner(),
  lua: new LuaRunner(),
  python: new PythonRunner(),
};

let currentRunner: CodeRunner | null = null;

export const safeEval = async (
  languageId: string,
  code: string,
  onInput: InputHandler,
  onLog: LogHandler
): Promise<void> => {
  const runner = runners[languageId];

  if (!runner) {
    onLog(`Unsupported language: ${languageId}\n`);
    return;
  }

  if (currentRunner?.cancel) {
    currentRunner.cancel();
  }

  currentRunner = runner;

  try {
    await runner.execute(code, onInput, onLog);
  } catch (err: any) {
    if (!currentRunner || !(err instanceof DOMException && err.name === 'AbortError')) {
      onLog(`Runner error: ${err.message || err}\n`);
    }
  } finally {
    currentRunner = null;
  }
};

export const cancelExecution = (): void => {
  currentRunner?.cancel?.();
  currentRunner = null;
};

export const cleanupAllRunners = (): void => {
  cancelExecution();
  Object.values(runners).forEach(r => r.cleanup?.());
};
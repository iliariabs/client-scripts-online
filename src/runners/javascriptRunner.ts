import type { CodeRunner, InputHandler, LogHandler } from './baseRunner';

export class JavaScriptRunner implements CodeRunner {
  private worker: Worker | null = null;
  private pendingDone: Promise<void> | null = null;
  private doneResolver: (() => void) | null = null;
  private echoInput: boolean = false;

  constructor(options: { echoInput?: boolean } = {}) {
    this.echoInput = options.echoInput ?? false;
  }

  async execute(code: string, onInput: InputHandler, onLog: LogHandler): Promise<void> {
    this.cleanup();

    this.worker = new Worker(new URL('./workers/js-worker.ts', import.meta.url), {
      type: 'module'
    });

    this.pendingDone = new Promise<void>((resolve) => {
      this.doneResolver = resolve;
    });

    this.worker.onmessage = async (ev: MessageEvent) => {
      const msg = ev.data;
      if (!msg || !msg.type) return;

      try {
        switch (msg.type) {
          case 'log':
            onLog(String(msg.payload ?? ''));
            break;

          case 'inputRequest':
            const prompt = msg.payload == null ? undefined : String(msg.payload);
            if (prompt != null) onLog(prompt);

            try {
              const userInput = await onInput(prompt);
              const response = userInput == null ? '' : String(userInput);
              if (this.echoInput) onLog(response + '\n');

              this.worker?.postMessage({
                type: 'inputResponse',
                payload: response,
                id: msg.id
              });
            } catch (err) {
              this.worker?.postMessage({
                type: 'inputResponse',
                payload: '',
                id: msg.id
              });
            }
            break;

          case 'done':
            this.cleanup();
            this.doneResolver?.();
            break;

          case 'error':
            onLog('Error: ' + String(msg.payload ?? 'unknown') + '\n');
            this.cleanup();
            this.doneResolver?.();
            break;
        }
      } catch (e) {
        onLog(`Message handling error: ${String(e)}\n`);
      }
    };

    this.worker.onerror = (err) => {
      err.preventDefault?.();
      onLog(`Worker error: ${err.message || 'unknown'}\n`);
      this.cleanup();
      this.doneResolver?.();
    };

    this.worker.postMessage({ type: 'run', payload: code });

    return this.pendingDone;
  }

  cancel(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'cancel' });
      this.worker.terminate();
      this.worker = null;
    }
    this.doneResolver?.();
    this.doneResolver = null;
    this.pendingDone = null;
  }

  cleanup(): void {
    if (this.worker) {
      try { this.worker.terminate(); } catch {}
      this.worker = null;
    }
    if (this.doneResolver) {
      this.doneResolver();
      this.doneResolver = null;
    }
    this.pendingDone = null;
  }
}
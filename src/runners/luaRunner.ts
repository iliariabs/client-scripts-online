import type { InputHandler, LogHandler, CodeRunner } from "./baseRunner";

export class LuaRunner implements CodeRunner {
  private worker: Worker | null = null;
  private pendingDone: Promise<void> | null = null;
  private doneResolver: (() => void) | null = null;

  async execute(code: string, onInput: InputHandler, onLog: LogHandler): Promise<void> {
    this.cleanup();

    this.worker = new Worker(new URL("./workers/lua-worker.ts", import.meta.url), {
      type: "module"
    });

    this.pendingDone = new Promise<void>((resolve) => { this.doneResolver = resolve; });

    this.worker.onmessage = async (ev: MessageEvent) => {
      const msg = ev.data;
      if (!msg || !msg.type) return;
      try {
        switch (msg.type) {
          case "log":
            onLog(String(msg.payload ?? ""));
            break;
          case "request_input":
            try {
              const userInput = await onInput("");
              this.worker?.postMessage({ type: "resume", payload: { args: [userInput] } });
            } catch (e) {
              onLog(`Input Error: ${String(e)}\n`);
              this.worker?.postMessage({ type: "resume", payload: { args: [] } });
            }
            break;
          case "error":
            onLog(`Worker Error: ${String(msg.payload)}\n`);
            break;
          case "done":
            onLog("");
            this.cleanup();
            this.doneResolver && this.doneResolver();
            break;
          default:
            break;
        }
      } catch (e) {
        onLog(`Internal message handling error: ${String(e)}\n`);
      }
    };

    this.worker.onerror = (ev) => {
      onLog(`Worker uncaught error: ${ev.message}\n`);
      this.cleanup();
      this.doneResolver && this.doneResolver();
    };

    this.worker.postMessage({ type: "run", payload: { code } });

    return this.pendingDone!;
  }

  cancel(): void {
    if (!this.worker) return;
    try {
      this.worker.postMessage({ type: "cancel" });
      this.worker.terminate();
    } catch {}
    this.worker = null;
    if (this.doneResolver) {
      this.doneResolver();
      this.doneResolver = null;
    }
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

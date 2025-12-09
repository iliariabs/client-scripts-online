import type { InputHandler, LogHandler, CodeRunner } from './baseRunner';

export class PythonRunner implements CodeRunner {
  private worker: Worker | null = null;
  private sharedBuffer: SharedArrayBuffer | null = null;
  private sharedArray: Int32Array | null = null;
  private bufferData: Uint8Array | null = null;

  constructor() {
    this.sharedBuffer = new SharedArrayBuffer(1024 * 10);
    this.sharedArray = new Int32Array(this.sharedBuffer);
    this.bufferData = new Uint8Array(this.sharedBuffer, 8);
  }

  async execute(
    code: string,
    onInput: InputHandler,
    onLog: LogHandler
  ): Promise<void> {
    this.cleanup();
    
    this.worker = new Worker(new URL('./workers/python-worker.ts', import.meta.url), {
      type: 'module',
    });

    return new Promise((resolve) => {
      this.worker!.onmessage = async (e) => {
        const { type, content } = e.data;

        if (type === 'ready') {
          this.worker!.postMessage({ type: 'run', code });
        } else if (type === 'stdout') { 
          onLog(content);
        } else if (type === 'stderr') {
          onLog(content);
        } else if (type === 'error') {
          onLog(`Runtime Error: ${content}\n`);
          resolve(); 
        } else if (type === 'finished') {
          resolve();
        } else if (type === 'stdin') {
          try {
            const userInput = await onInput();
            const encoder = new TextEncoder();
            const bytes = encoder.encode(userInput + '\n');
            
            this.bufferData!.set(bytes);
            this.sharedArray![1] = bytes.length;
            
            Atomics.store(this.sharedArray!, 0, 1);
            Atomics.notify(this.sharedArray!, 0);
          } catch {
            this.sharedArray![1] = 0;
            Atomics.store(this.sharedArray!, 0, 1);
            Atomics.notify(this.sharedArray!, 0);
          }
        }
      };

      this.worker!.postMessage({ type: 'init', buffer: this.sharedBuffer });
    });
  }

  cancel(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  cleanup(): void {
    this.cancel();
    if (this.sharedArray) {
      Atomics.store(this.sharedArray, 0, 0);
    }
  }
}
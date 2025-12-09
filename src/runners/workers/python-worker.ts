import { loadPyodide } from 'pyodide';

let pyodide: any = null;
let sharedBuffer: SharedArrayBuffer | null = null;
let sharedArray: Int32Array | null = null;
let bufferData: Uint8Array | null = null;

async function initPyodide() {
  pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/',
  });
  
  const stdoutDecoder = new TextDecoder();
  let stdoutBuf: number[] = [];

  const stderrDecoder = new TextDecoder();
  let stderrBuf: number[] = [];

  function flushStdoutBuf() {
    if (stdoutBuf.length === 0) return;
    const chunk = new Uint8Array(stdoutBuf);
    const text = stdoutDecoder.decode(chunk);
    self.postMessage({ type: 'stdout', content: text });
    stdoutBuf = [];
  }

  function flushStderrBuf() {
    if (stderrBuf.length === 0) return;
    const chunk = new Uint8Array(stderrBuf);
    const text = stderrDecoder.decode(chunk);
    self.postMessage({ type: 'stderr', content: text });
    stderrBuf = [];
  }

  pyodide.setStdout({
    raw: (byte: number) => {
      stdoutBuf.push(byte);
      if (byte === 10) { 
        const chunk = new Uint8Array(stdoutBuf);
        const text = stdoutDecoder.decode(chunk);
        self.postMessage({ type: 'stdout', content: text });
        stdoutBuf = [];
      }
    },
  });

  pyodide.setStderr({
    raw: (byte: number) => {
      stderrBuf.push(byte);
      if (byte === 10) {
        const chunk = new Uint8Array(stderrBuf);
        const text = stderrDecoder.decode(chunk);
        self.postMessage({ type: 'stderr', content: text });
        stderrBuf = [];
      }
    },
  });

  pyodide.setStdin({
    stdin: () => {
      if (!sharedArray || !bufferData) return '';

      flushStdoutBuf();
      flushStderrBuf();

      self.postMessage({ type: 'stdin' });

      Atomics.wait(sharedArray, 0, 0);
      Atomics.store(sharedArray, 0, 0);

      const size = sharedArray[1];
      if (size === 0) return '';

      const bytes = bufferData.slice(0, size);
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    },
  });
}

self.onmessage = async (event) => {
  const { type, code, buffer } = event.data;

  if (type === 'init') {
    sharedBuffer = buffer;
    sharedArray = new Int32Array(sharedBuffer!);
    bufferData = new Uint8Array(sharedBuffer!, 8);
    await initPyodide();
    self.postMessage({ type: 'ready' });
  } else if (type === 'run') {
    if (!pyodide) await initPyodide();
    try {
      await pyodide.runPythonAsync(code);
      self.postMessage({ type: 'finished' });
    } catch (error: any) {
      self.postMessage({ type: 'error', content: error.message });
    } 
  }
};
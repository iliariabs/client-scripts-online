interface MessageData {
  type: string;
  payload?: any;
  id?: string;
}

let abortFlag = false;

const send = (type: string, payload?: any, id?: string) => {
  (self as any).postMessage({ type, payload, id } satisfies MessageData);
};

const sendLog = (s: string) => send('log', s);
const sendError = (e: any) => send('error', String(e?.stack ?? e?.message ?? e));
const sendDone = () => send('done');

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data as MessageData;
  if (msg.type === 'cancel') {
    abortFlag = true;
    return;
  }
  if (msg.type !== 'run') return;

  const userCode = String(msg.payload ?? '');
  abortFlag = false;

  const console = {
    log: (...args: any[]) => {
      const line = args
        .map(a => {
          if (a === null || a === undefined) return 'null/undefined';
          if (typeof a === 'string') return a;
          try { return JSON.stringify(a); } catch { return String(a); }
        })
        .join(' ') + '\n';
      sendLog(line);
    }
  };

  const input = (prompt?: string): Promise<string> => {
    return new Promise((resolve) => {
      if (abortFlag) return resolve('');

      const id = Math.random().toString(36).slice(2);
      const handler = (ev: MessageEvent) => {
        const res = ev.data as MessageData;
        if (res?.type === 'inputResponse' && res.id === id) {
          self.removeEventListener('message', handler);
          resolve(res.payload ?? '');
        }
      };
      self.addEventListener('message', handler);
      send('inputRequest', prompt ?? null, id);
    });
  };

  const runUserCode = () => {
    const wrapper = `
      "use strict";
      return (async (input, console) => {
        ${userCode}
      })(input, console);
    `;

    const executor = new Function('input', 'console', wrapper);

    return executor(input, console);
  };

  try {
    await runUserCode();
    if (!abortFlag) sendDone();
  } catch (err: any) {
    const safeWrapper = `
      "use strict";
      return (async (input, console) => {
        try {
          ${userCode}
        } catch (e) {
          console.log("Runtime error: " + (e?.message || String(e)));
        }
      })(input, console);
    `;

    try {
      const safeExecutor = new Function('input', 'console', safeWrapper);
      await safeExecutor(input, console);
      if (!abortFlag) sendDone();
    } catch (err2) {
      sendError(err2);
    }
  }
};
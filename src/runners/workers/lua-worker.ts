import * as fengari from "fengari-web";
const { lua, lauxlib, lualib } = fengari;
const { tojs, push } = fengari.interop;
const to_luastring = fengari.to_luastring;

function send(type: string, payload: any = undefined) {
  (self as any).postMessage({ type, payload });
}

function stackValueToString(L: any, idx: number) {
  try {
    const v = tojs(L, idx);
    if (v === null || v === undefined) return "nil";
    if (typeof v === "object") {
      try { return JSON.stringify(v); } catch { return String(v); }
    }
    return String(v);
  } catch {
    try {
      if (typeof (lua as any).lua_tojsstring === "function") {
        return (lua as any).lua_tojsstring(L, idx) ?? "<unprintable>";
      }
    } catch {}
    return "<unprintable>";
  }
}

let L: any = null;
let thread: any = null;
let abortFlag = false;
let resumeResolver: ((value: any[]) => void) | null = null;

(self as any).onmessage = async (ev: MessageEvent) => {
  const msg = ev.data;
  if (!msg || !msg.type) return;

  switch (msg.type) {
    case "run":
      runCode(String(msg.payload?.code ?? "")).catch((e) => {
        send("error", String(e?.stack ?? e?.message ?? e));
        send("done");
      });
      break;
    case "resume":
      if (resumeResolver) {
        resumeResolver(msg.payload?.args ?? []);
        resumeResolver = null;
      }
      break;
    case "cancel":
      abortFlag = true;
      break;
    case "terminate":
      try { self.close(); } catch {}
      break;
    default:
      break;
  }
};

async function runCode(code: string) {
  L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);

  const hook = (Lhook: any) => {
    if (abortFlag) {
      lua.luaL_error(Lhook, to_luastring("execution cancelled"));
    }
  };
  lua.lua_sethook(L, hook as any, lua.LUA_MASKCOUNT, 10000);

  const printOverride = (Lprint: any) => {
    const n = lua.lua_gettop(Lprint);
    const parts: string[] = [];
    for (let i = 1; i <= n; i++) {
      parts.push(stackValueToString(Lprint, i));
    }
    send("log", parts.join("\t") + "\n");
    return 0;
  };

  const writeOverride = (Lwrite: any) => {
    const n = lua.lua_gettop(Lwrite);
    const parts: string[] = [];
    for (let i = 1; i <= n; i++) {
      parts.push(stackValueToString(Lwrite, i));
    }
    send("log", parts.join(""));
    return 0;
  };

  const inputYield = (Lread: any) => {
    return lua.lua_yield(Lread, 0);
  };

  lua.lua_pushcfunction(L, printOverride as any);
  lua.lua_setglobal(L, to_luastring("print"));

  lua.lua_newtable(L);
  lua.lua_pushcfunction(L, writeOverride as any);
  lua.lua_setfield(L, -2, to_luastring("write"));
  lua.lua_pushcfunction(L, inputYield as any);
  lua.lua_setfield(L, -2, to_luastring("read"));
  lua.lua_pushcfunction(L, (() => 0) as any);
  lua.lua_setfield(L, -2, to_luastring("flush"));
  lua.lua_setglobal(L, to_luastring("io"));

  const loadStatus = lauxlib.luaL_loadstring(L, to_luastring(code));
  if (loadStatus !== lua.LUA_OK) {
    const msg = stackValueToString(L, -1);
    send("log", `Syntax Error: ${msg}\n`);
    lua.lua_pop(L, 1);
    send("done");
    return;
  }

  thread = lua.lua_newthread(L);
  lua.lua_pushvalue(L, -2);
  lua.lua_xmove(L, thread, 1);
  lua.lua_pop(L, 1);

  try {
    let status = lua.lua_resume(thread, null, 0);
    while (status === lua.LUA_YIELD) {
      const args = await new Promise<any[]>((resolve) => {
        resumeResolver = resolve;
        send("request_input");
      });
      if (args && args.length) {
        for (let i = 0; i < args.length; i++) {
          push(thread, args[i]);
        }
      }
      const narg = (args && args.length) ? args.length : 0;
      status = lua.lua_resume(thread, null, narg);
    }

    if (status !== lua.LUA_OK) {
      const err = stackValueToString(thread, -1);
      send("log", `Runtime Error: ${err}\n`);
      try { lua.lua_pop(thread, 1); } catch {}
      send("done");
      return;
    }
  } catch (e: any) {
    send("log", `Runtime Error: ${String(e?.message ?? e)}\n`);
    send("done");
    return;
  }

  send("done");
}

declare module "fengari-web" {
  export const lua: FengariLua & {
    LUA_OK: number;
    LUA_YIELD: number;
    LUA_MASKCOUNT: number;
  };
  export const lauxlib: FengariLauxlib;
  export const lualib: FengariLualib;

  export const interop: {
    tojs(L: lua_State, idx: number): any;
    push(L: lua_State, value: any): void;
    to_luastring(str: string): lua_LString;
  };

  export function to_luastring(str: string): lua_LString;

  export type lua_State = unknown;

  export type lua_CFunction = (L: lua_State) => number;

  export type lua_LString = Uint8Array;

  export const LUA_OK: 0;
  export const LUA_YIELD: 1;
  export const LUA_ERRRUN: 2;
  export const LUA_ERRSYNTAX: 3;
  export const LUA_ERRMEM: 4;
  export const LUA_ERRERR: 5;

  export const LUA_MASKCOUNT: number;

  export interface FengariLua {
    lua_State: lua_State;

    lua_newthread(L: lua_State): lua_State;
    lua_pushvalue(L: lua_State, idx: number): void;
    lua_xmove(from: lua_State, to: lua_State, n: number): void;
    lua_pop(L: lua_State, n: number): void;
    lua_gettop(L: lua_State): number;
    lua_sethook(L: lua_State, func: lua_Hook, mask: number, count: number): void;
    lua_pushcfunction(L: lua_State, fn: lua_CFunction): void;
    lua_setglobal(L: lua_State, name: lua_LString): void;
    lua_setfield(L: lua_State, idx: number, k: lua_LString): void;
    lua_newtable(L: lua_State): void;
    lua_resume(L: lua_State, from: lua_State | null, narg: number): number;
    lua_yield(L: lua_State, nresults: number): number;
    luaL_error(L: lua_State, fmt: lua_LString, ...args: any[]): never;
  }

  export interface FengariLauxlib {
    luaL_newstate(): lua_State;
    luaL_loadstring(L: lua_State, s: lua_LString): number;
  }

  export interface FengariLualib {
    luaL_openlibs(L: lua_State): void;
  }

  export type lua_Hook = (L: lua_State, ar: any) => void;
}
export type LanguageId = 'javascript' | 'python' | 'lua' | string;

export interface Language {
  id: LanguageId;
  name: string;
  short: string;
  icon?: string;
  monaco?: string;
  extension: string;
  defaultCode?: string;
}

export const LANGUAGES: Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    short: 'JS',
    extension: 'js',
    defaultCode: `console.log('Hello, world!');

// Try entering your name:
const name = await input('Your name: ');
console.log('Hello, ' + name + '!');
console.log('Done!');`,
  },
  {
    id: 'python',
    name: 'Python',
    short: 'PY',
    extension: 'py',
    defaultCode: `print("Hello from Python!")

name = input("What's your name? ")
print(f"Nice to meet you, {name}!")`,
  },
  {
    id: 'lua',
    name: 'Lua',
    short: 'LU',
    extension: 'lua',
    defaultCode: `print("Hello from Lua!")
io.write("Your name: ")
local name = io.read()
print("Hello, " .. name .. "!")`,
  },
];

export const getLanguageById = (id: LanguageId): Language | undefined => {
  return LANGUAGES.find(lang => lang.id === id);
};
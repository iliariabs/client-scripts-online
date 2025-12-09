import { Parser, Language, Tree } from 'web-tree-sitter';

type WorkerMessage = 
  | { type: 'INIT'; wasmBaseUrl: string }
  | { type: 'LOAD_LANG'; langId: string; wasmUrl: string }
  | { type: 'PARSE'; code: string; langId: string };

let parser: Parser | null = null;
let currentLangId: string | null = null;

const languagesCache: Record<string, Language> = {};

const getNodeType = (nodeType: string): string => {
  if (['string', 'string_literal'].includes(nodeType)) return 'string';
  if (['comment', 'line_comment', 'block_comment'].includes(nodeType)) return 'comment';
  if (['function', 'function_declaration', 'method_definition', 'identifier'].includes(nodeType)) return 'function';
  if (['number', 'integer'].includes(nodeType)) return 'number';
  if (['keyword', 'return_statement', 'if_statement', 'for_statement'].some(k => nodeType.includes(k))) return 'keyword';
  return 'default';
};

function getTokens(tree: Tree) {
  const tokens: { start: number; end: number; type: string }[] = [];
  
  const cursor = tree.walk();
  let reachedRoot = false;

  while (!reachedRoot) {
    if (cursor.nodeIsNamed) {
        const type = getNodeType(cursor.nodeType);
        if (type !== 'default') {
             tokens.push({
                start: cursor.startIndex,
                end: cursor.endIndex,
                type: type
             });
        }
    }

    if (cursor.gotoFirstChild()) continue;
    if (cursor.gotoNextSibling()) continue;

    let retracing = true;
    while (retracing) {
      if (!cursor.gotoParent()) {
        retracing = false;
        reachedRoot = true;
      } else if (cursor.gotoNextSibling()) {
        retracing = false;
      }
    }
  }

  return tokens;
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type } = e.data;

  try {
    if (type === 'INIT') {
      const { wasmBaseUrl } = e.data as any;
      await Parser.init({
        locateFile: () => `${wasmBaseUrl}tree-sitter.wasm`,
      });
      parser = new Parser();
      self.postMessage({ type: 'READY' });
    }

    if (type === 'LOAD_LANG') {
      const { langId, wasmUrl } = e.data as any;
      if (!languagesCache[langId]) {
        const lang = await Language.load(wasmUrl);
        languagesCache[langId] = lang;
      }
      if (parser) {
        parser.setLanguage(languagesCache[langId]);
        currentLangId = langId;
      }
      self.postMessage({ type: 'LANG_LOADED', langId });
    }

    if (type === 'PARSE') {
      const { code, langId } = e.data as any;
      if (!parser || currentLangId !== langId) return;

      const tree = parser.parse(code)!;
      const tokens = getTokens(tree);
      
      tree.delete(); 
      
      self.postMessage({ type: 'TOKENS', tokens });
    }
  } catch (err) {
    console.error('Tree-sitter worker error:', err);
  }
};
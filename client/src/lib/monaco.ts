import * as monaco from 'monaco-editor';

// Define Python language configuration
export const pythonConfig = {
  defaultToken: '',
  tokenPostfix: '.py',
  keywords: [
    'and', 'as', 'assert', 'break', 'class', 'continue', 'def',
    'del', 'elif', 'else', 'except', 'exec', 'finally',
    'for', 'from', 'global', 'if', 'import', 'in',
    'is', 'lambda', 'not', 'or', 'pass', 'print',
    'raise', 'return', 'try', 'while', 'with', 'yield',
    'async', 'await', 'nonlocal'
  ],
  builtins: [
    'True', 'False', 'None', 'self', 'cls'
  ],
  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
    '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
    '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
    '%=', '<<=', '>>=', '>>>='
  ],
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  tokenizer: {
    root: [
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@builtins': 'type.identifier',
          '@default': 'identifier'
        }
      }],
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/\d+/, 'number'],
      [/[;,.]/, 'delimiter'],
      [/[{}()\[\]]/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],
      [/#.*$/, 'comment'],
    ],
    string_double: [
      [/[^\\"]+/, 'string'],
      [/"/, 'string', '@pop']
    ],
    string_single: [
      [/[^\\']+/, 'string'],
      [/'/, 'string', '@pop']
    ]
  }
};

// Define dark theme for Monaco
export const darkTheme = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' },
    { token: 'keyword', foreground: '569CD6' },
    { token: 'operator', foreground: 'D4D4D4' },
    { token: 'namespace', foreground: '4EC9B0' },
    { token: 'type', foreground: '4EC9B0' },
    { token: 'struct', foreground: '4EC9B0' },
    { token: 'class', foreground: '4EC9B0' },
    { token: 'interface', foreground: '4EC9B0' },
    { token: 'parameter', foreground: '9CDCFE' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'property', foreground: '9CDCFE' },
    { token: 'enumMember', foreground: '9CDCFE' },
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'member', foreground: 'DCDCAA' },
    { token: 'macro', foreground: 'DCDCAA' },
    { token: 'label', foreground: 'C8C8C8' },
    { token: 'type.identifier', foreground: '4FC1FF' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'string.escape', foreground: 'D7BA7D' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'delimiter', foreground: 'D4D4D4' },
  ],
  colors: {
    'editor.background': '#0f172a',
    'editor.foreground': '#D4D4D4',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#C6C6C6',
    'editor.selectionBackground': '#264F78',
    'editor.inactiveSelectionBackground': '#3A3D41',
    'editor.lineHighlightBackground': '#2F3349',
    'editorCursor.foreground': '#AEAFAD',
    'editorWhitespace.foreground': '#404040',
    'editorIndentGuide.background': '#404040',
    'editorIndentGuide.activeBackground': '#707070',
    'editor.selectionHighlightBackground': '#ADD6FF26',
    'editorBracketMatch.background': '#0064001a',
    'editorBracketMatch.border': '#888888',
  }
};

export function initializeMonaco() {
  // Register Python language
  monaco.languages.register({ id: 'python' });
  monaco.languages.setMonarchTokensProvider('python', pythonConfig as any);

  // Define dark theme
  monaco.editor.defineTheme('telebot-dark', darkTheme);

  // Set default theme
  monaco.editor.setTheme('telebot-dark');
}

export { monaco };

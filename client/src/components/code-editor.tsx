import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Code, CheckCircle } from "lucide-react";
import { monaco, initializeMonaco } from "@/lib/monaco";

interface CodeEditorProps {
  files: Record<string, string>;
  currentFile: string | null;
  onFileChange: (filename: string, content: string) => void;
  onFileClose: (filename: string) => void;
  openFiles: string[];
}

export function CodeEditor({ 
  files, 
  currentFile, 
  onFileChange, 
  onFileClose, 
  openFiles 
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorPosition, setEditorPosition] = useState({ line: 1, column: 1 });

  useEffect(() => {
    const initEditor = async () => {
      try {
        // Initialize Monaco
        await import('monaco-editor/esm/vs/editor/editor.api');
        initializeMonaco();
        
        if (editorRef.current && !editorInstance.current) {
          editorInstance.current = monaco.editor.create(editorRef.current, {
            value: currentFile ? files[currentFile] || '' : '',
            language: getLanguageFromFilename(currentFile || ''),
            theme: 'telebot-dark',
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            lineHeight: 20,
            padding: { top: 16 },
          });

          // Listen for content changes
          editorInstance.current.onDidChangeModelContent(() => {
            if (currentFile && editorInstance.current) {
              const value = editorInstance.current.getValue();
              onFileChange(currentFile, value);
            }
          });

          // Listen for cursor position changes
          editorInstance.current.onDidChangeCursorPosition((e) => {
            setEditorPosition({
              line: e.position.lineNumber,
              column: e.position.column
            });
          });

          setIsEditorReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize Monaco editor:', error);
      }
    };

    initEditor();

    return () => {
      if (editorInstance.current) {
        editorInstance.current.dispose();
        editorInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorInstance.current && currentFile) {
      const content = files[currentFile] || '';
      const currentValue = editorInstance.current.getValue();
      
      if (currentValue !== content) {
        editorInstance.current.setValue(content);
      }

      const language = getLanguageFromFilename(currentFile);
      const model = editorInstance.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [currentFile, files]);

  const getLanguageFromFilename = (filename: string): string => {
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.md')) return 'markdown';
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return 'yaml';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    return 'plaintext';
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.py')) return <i className="fab fa-python text-yellow-400 text-sm" />;
    if (filename.endsWith('.txt')) return <i className="fas fa-file-alt text-orange-400 text-sm" />;
    if (filename.endsWith('.md')) return <i className="fab fa-markdown text-purple-400 text-sm" />;
    if (filename.endsWith('.json')) return <i className="fas fa-file-code text-green-400 text-sm" />;
    return <i className="fas fa-file text-slate-400 text-sm" />;
  };

  const formatCode = () => {
    if (editorInstance.current) {
      editorInstance.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const validateBot = () => {
    if (!currentFile || !files[currentFile]) return;
    
    const content = files[currentFile];
    const hasImports = content.includes('from telegram') || content.includes('import telegram');
    const hasApplication = content.includes('Application') && content.includes('builder');
    const hasHandlers = content.includes('add_handler');
    const hasRunPolling = content.includes('run_polling');
    
    if (hasImports && hasApplication && hasHandlers && hasRunPolling) {
      alert('✅ Код бота выглядит корректно!');
    } else {
      const issues = [];
      if (!hasImports) issues.push('- Отсутствуют импорты telegram библиотеки');
      if (!hasApplication) issues.push('- Не создано Application');
      if (!hasHandlers) issues.push('- Не добавлены обработчики команд');
      if (!hasRunPolling) issues.push('- Не запущен polling');
      
      alert(`❌ Найдены проблемы в коде:\n${issues.join('\n')}`);
    }
  };

  if (!currentFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-editor-bg text-slate-400">
        <div className="text-center">
          <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Выберите файл для редактирования</p>
          <p className="text-sm mt-2">Или создайте новый файл в проводнике</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Editor Tabs */}
      <div className="bg-panel-bg border-b border-panel-border">
        <div className="flex items-center">
          <Tabs value={currentFile} className="flex-1">
            <TabsList className="bg-transparent border-0 p-0 h-auto">
              {openFiles.map((filename) => (
                <TabsTrigger
                  key={filename}
                  value={filename}
                  className={`flex items-center space-x-2 px-4 py-2 border-r border-panel-border data-[state=active]:bg-editor-bg data-[state=active]:text-blue-200 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 ${
                    currentFile === filename ? 'bg-editor-bg text-blue-200 border-b-2 border-blue-500' : ''
                  }`}
                >
                  {getFileIcon(filename)}
                  <span className="text-sm font-medium">{filename}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-4 w-4 ml-2 text-slate-400 hover:text-slate-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileClose(filename);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          {/* Editor Actions */}
          <div className="flex items-center space-x-2 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={formatCode}
              className="text-slate-400 hover:text-slate-200 p-1"
              title="Форматировать код"
            >
              <i className="fas fa-magic text-sm" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={validateBot}
              className="text-slate-400 hover:text-slate-200 p-1"
              title="Проверить бота"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 relative">
        <div 
          ref={editorRef} 
          className="h-full w-full"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-panel-bg border-t border-panel-border px-4 py-2 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span>Python</span>
            <span>UTF-8</span>
            <span>LF</span>
            <span>Строка {editorPosition.line}, Столбец {editorPosition.column}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-green-400">✓ Код валиден</span>
            <span>Сохранено</span>
          </div>
        </div>
      </div>
    </div>
  );
}

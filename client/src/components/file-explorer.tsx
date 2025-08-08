import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePlus, FolderPlus, ChevronRight, FileText, Settings, Package, Book, Folder } from "lucide-react";

interface FileExplorerProps {
  files: Record<string, string>;
  currentFile: string | null;
  onFileSelect: (filename: string) => void;
  onFileCreate: (filename: string, content: string) => void;
}

export function FileExplorer({ files, currentFile, onFileSelect, onFileCreate }: FileExplorerProps) {
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("python");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.py')) return <i className="fab fa-python text-yellow-400 text-sm" />;
    if (filename.endsWith('.txt')) return <i className="fas fa-file-alt text-orange-400 text-sm" />;
    if (filename.endsWith('.md')) return <i className="fab fa-markdown text-purple-400 text-sm" />;
    if (filename.endsWith('.json')) return <i className="fas fa-file-code text-green-400 text-sm" />;
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return <i className="fas fa-file-code text-blue-400 text-sm" />;
    if (filename === 'requirements.txt') return <Package className="text-orange-400 w-4 h-4" />;
    if (filename === 'config.py') return <Settings className="text-slate-400 w-4 h-4" />;
    if (filename === 'README.md') return <Book className="text-purple-400 w-4 h-4" />;
    return <FileText className="text-slate-400 w-4 h-4" />;
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    let filename = newFileName.trim();
    const extensions: Record<string, string> = {
      python: '.py',
      text: '.txt',
      markdown: '.md',
      json: '.json',
      yaml: '.yml'
    };
    
    if (!filename.includes('.')) {
      filename += extensions[newFileType] || '.py';
    }
    
    const defaultContent = newFileType === 'python' 
      ? '# Новый Python файл\n\n' 
      : '';
    
    onFileCreate(filename, defaultContent);
    setNewFileName("");
    setNewFileType("python");
    setIsCreateModalOpen(false);
  };

  const filesList = Object.keys(files).sort();
  const totalSize = Object.values(files).reduce((sum, content) => sum + content.length, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-80 bg-panel-bg border-r border-panel-border flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-panel-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-200">Файлы проекта</h3>
          <div className="flex items-center space-x-1">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1.5 h-auto">
                  <FilePlus className="w-4 h-4 text-slate-400" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-panel-bg border-panel-border">
                <DialogHeader>
                  <DialogTitle className="text-slate-200">Создать новый файл</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Имя файла
                    </label>
                    <Input
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="например: handlers.py"
                      className="bg-surface border-panel-border text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Тип файла
                    </label>
                    <Select value={newFileType} onValueChange={setNewFileType}>
                      <SelectTrigger className="bg-surface border-panel-border text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-panel-border">
                        <SelectItem value="python">Python (.py)</SelectItem>
                        <SelectItem value="text">Текст (.txt)</SelectItem>
                        <SelectItem value="markdown">Markdown (.md)</SelectItem>
                        <SelectItem value="json">JSON (.json)</SelectItem>
                        <SelectItem value="yaml">YAML (.yml)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsCreateModalOpen(false)}
                      className="text-slate-300"
                    >
                      Отмена
                    </Button>
                    <Button onClick={handleCreateFile} className="bg-blue-600 hover:bg-blue-700">
                      Создать
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" className="p-1.5 h-auto">
              <FolderPlus className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filesList.map((filename) => (
            <div
              key={filename}
              onClick={() => onFileSelect(filename)}
              className={`file-tree-item ${currentFile === filename ? 'active' : ''}`}
            >
              {getFileIcon(filename)}
              <span className={`text-sm file-name ${currentFile === filename ? 'text-blue-200 font-medium' : 'text-slate-300'}`}>
                {filename}
              </span>
              {currentFile === filename && (
                <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-panel-border text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>{filesList.length} файлов</span>
          <span>{formatSize(totalSize)}</span>
        </div>
      </div>
    </div>
  );
}

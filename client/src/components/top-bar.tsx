import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Download, Bot } from "lucide-react";

interface TopBarProps {
  projectName: string;
  isConnected: boolean;
  onSave: () => void;
  onExport: () => void;
}

export function TopBar({ projectName, isConnected, onSave, onExport }: TopBarProps) {
  const { toast } = useToast();

  const handleSave = () => {
    onSave();
    toast({
      title: "Проект сохранен",
      description: "Все изменения успешно сохранены",
    });
  };

  return (
    <div className="absolute top-0 left-0 right-0 bg-panel-bg border-b border-panel-border z-50 h-12 flex items-center px-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Bot className="text-blue-400 w-5 h-5" />
          <span className="font-semibold text-lg">TeleBot AI Studio</span>
        </div>
        <div className="h-6 w-px bg-panel-border"></div>
        <div className="flex items-center space-x-2 text-sm text-slate-300">
          <i className="fas fa-folder text-amber-400"></i>
          <span>{projectName}</span>
        </div>
      </div>
      
      <div className="ml-auto flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-slate-300">
            {isConnected ? 'GPT-4o подключен' : 'AI недоступен'}
          </span>
        </div>
        
        <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Сохранить
        </Button>
        
        <Button onClick={onExport} variant="secondary" size="sm" className="bg-surface hover:bg-slate-600">
          <Download className="w-4 h-4 mr-2" />
          Экспорт
        </Button>
      </div>
    </div>
  );
}

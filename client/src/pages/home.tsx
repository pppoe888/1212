import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TopBar } from "@/components/top-bar";
import { FileExplorer } from "@/components/file-explorer";
import { CodeEditor } from "@/components/code-editor";
import { AIChat } from "@/components/ai-chat";
import type { Project } from "@shared/schema";

export default function Home() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load default project
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      const defaultProject = projects.find(p => p.id === 'default-project') || projects[0];
      setCurrentProject(defaultProject);
      
      // Open main bot file by default
      if (defaultProject.files && 'bot.py' in defaultProject.files) {
        setCurrentFile('bot.py');
        setOpenFiles(['bot.py']);
      }
    }
  }, [projects, currentProject]);

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (updates: Partial<Project>) => {
      if (!currentProject) throw new Error('No current project');
      const response = await apiRequest('PUT', `/api/projects/${currentProject.id}`, updates);
      return response.json();
    },
    onSuccess: (updatedProject) => {
      setCurrentProject(updatedProject);
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });

  // Export project mutation
  const exportProjectMutation = useMutation({
    mutationFn: async () => {
      if (!currentProject) throw new Error('No current project');
      const response = await fetch(`/api/projects/${currentProject.id}/export`);
      if (!response.ok) throw new Error('Export failed');
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject?.name || 'project'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Проект экспортирован",
        description: "ZIP-архив загружен на ваш компьютер",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось создать архив проекта",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (filename: string) => {
    setCurrentFile(filename);
    if (!openFiles.includes(filename)) {
      setOpenFiles([...openFiles, filename]);
    }
  };

  const handleFileClose = (filename: string) => {
    const newOpenFiles = openFiles.filter(f => f !== filename);
    setOpenFiles(newOpenFiles);
    
    if (currentFile === filename) {
      setCurrentFile(newOpenFiles.length > 0 ? newOpenFiles[0] : null);
    }
  };

  const handleFileChange = (filename: string, content: string) => {
    if (!currentProject) return;
    
    const updatedFiles = {
      ...currentProject.files,
      [filename]: content,
    };
    
    setCurrentProject({
      ...currentProject,
      files: updatedFiles,
    });
  };

  const handleFileCreate = (filename: string, content: string) => {
    if (!currentProject) return;
    
    const updatedFiles = {
      ...currentProject.files,
      [filename]: content,
    };
    
    updateProjectMutation.mutate({ files: updatedFiles });
    handleFileSelect(filename);
    
    toast({
      title: "Файл создан",
      description: `Файл ${filename} успешно создан`,
    });
  };

  const handleFilesUpdate = (files: Record<string, string>) => {
    if (!currentProject) return;
    
    updateProjectMutation.mutate({ files });
  };

  const handleSaveProject = () => {
    if (!currentProject) return;
    
    updateProjectMutation.mutate({
      files: currentProject.files,
      updatedAt: new Date(),
    });
  };

  const handleExportProject = () => {
    exportProjectMutation.mutate();
  };

  // Check AI connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Test AI connection by making a simple health check
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'test' }],
          }),
        });
        setIsConnected(response.ok);
      } catch {
        setIsConnected(false);
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  if (!currentProject) {
    return (
      <div className="h-screen bg-editor-bg flex items-center justify-center">
        <div className="text-slate-400">Загрузка проекта...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-editor-bg text-slate-50 overflow-hidden">
      <TopBar
        projectName={currentProject.name}
        isConnected={isConnected}
        onSave={handleSaveProject}
        onExport={handleExportProject}
      />
      
      <div className="flex w-full pt-12">
        <FileExplorer
          files={currentProject.files || {}}
          currentFile={currentFile}
          onFileSelect={handleFileSelect}
          onFileCreate={handleFileCreate}
        />
        
        <CodeEditor
          files={currentProject.files || {}}
          currentFile={currentFile}
          onFileChange={handleFileChange}
          onFileClose={handleFileClose}
          openFiles={openFiles}
        />
        
        <AIChat
          projectId={currentProject.id}
          projectFiles={currentProject.files || {}}
          onFilesUpdate={handleFilesUpdate}
        />
      </div>
    </div>
  );
}

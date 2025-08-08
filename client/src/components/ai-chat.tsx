import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, Paperclip, Trash2, Bot, User } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";

interface AIChatProps {
  projectId: string;
  projectFiles: Record<string, string>;
  onFilesUpdate: (files: Record<string, string>) => void;
}

interface ChatResponse {
  message: string;
  files?: Record<string, string>;
}

export function AIChat({ projectId, projectFiles, onFilesUpdate }: AIChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chat messages
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/projects', projectId, 'messages'],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const userMessage = { role: 'user', content };
      await apiRequest('POST', `/api/projects/${projectId}/messages`, userMessage);
      
      // Send to AI
      const aiResponse = await apiRequest('POST', '/api/ai/chat', {
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          userMessage
        ],
        project_context: projectFiles
      });
      
      const response: ChatResponse = await aiResponse.json();
      
      // Save AI response
      await apiRequest('POST', `/api/projects/${projectId}/messages`, {
        role: 'assistant',
        content: response.message
      });
      
      return response;
    },
    onSuccess: (response) => {
      // Update files if AI provided new code
      if (response.files && Object.keys(response.files).length > 0) {
        onFilesUpdate({ ...projectFiles, ...response.files });
        toast({
          title: "Файлы обновлены",
          description: `AI создал/обновил ${Object.keys(response.files).length} файл(ов)`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'messages'] });
      setInputValue("");
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение AI",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/projects/${projectId}/messages`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'messages'] });
      toast({
        title: "Чат очищен",
        description: "История сообщений удалена",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;
    
    setIsLoading(true);
    sendMessageMutation.mutate(inputValue.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      'create-handler': 'Создай обработчик команд для бота с несколькими командами',
      'add-database': 'Добавь поддержку базы данных SQLite для хранения пользователей',
      'deploy-help': 'Как развернуть этого бота на сервере? Создай инструкцию',
    };
    
    if (prompts[action]) {
      setInputValue(prompts[action]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-96 bg-panel-bg border-l border-panel-border flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-panel-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="text-white w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">AI Ассистент</h3>
            <p className="text-xs text-slate-400">GPT-4o • Онлайн</p>
          </div>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearChatMutation.mutate()}
              className="text-slate-400 hover:text-slate-200 p-1"
              title="Очистить чат"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="chat-message assistant">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white w-3 h-3" />
              </div>
              <div className="flex-1">
                <div className="chat-message-content bg-surface">
                  Привет! Я помогу вам создать Telegram-бота. Что вы хотите, чтобы ваш бот умел делать?
                </div>
                <div className="mt-1 text-xs text-slate-500">сейчас</div>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.role}`}>
              {message.role === 'assistant' && (
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white w-3 h-3" />
                </div>
              )}
              
              <div className="flex-1">
                <div className={`chat-message-content ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white ml-auto' 
                    : 'bg-surface text-slate-200'
                }`}>
                  {message.content}
                </div>
                <div className={`mt-1 text-xs text-slate-500 ${
                  message.role === 'user' ? 'text-right' : ''
                }`}>
                  {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'сейчас'}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="text-white w-3 h-3" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="chat-message assistant">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white w-3 h-3" />
              </div>
              <div className="flex-1">
                <div className="chat-message-content bg-surface">
                  <div className="flex items-center space-x-2">
                    <div className="loading-dots">
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                    <span>Генерирую код...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 border-t border-panel-border">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Опишите, что должен делать бот..."
              className="w-full bg-surface border-panel-border text-slate-200 placeholder-slate-400 pr-10"
              disabled={isLoading}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              title="Прикрепить файл"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickAction('create-handler')}
            className="bg-surface hover:bg-slate-600 text-xs px-2 py-1 h-auto text-slate-300"
          >
            Создать обработчик
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickAction('add-database')}
            className="bg-surface hover:bg-slate-600 text-xs px-2 py-1 h-auto text-slate-300"
          >
            Добавить БД
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickAction('deploy-help')}
            className="bg-surface hover:bg-slate-600 text-xs px-2 py-1 h-auto text-slate-300"
          >
            Помощь с деплоем
          </Button>
        </div>
      </div>
    </div>
  );
}

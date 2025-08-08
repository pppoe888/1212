import { type Project, type InsertProject, type ChatMessage, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  getAllProjects(): Promise<Project[]>;
  
  // Chat messages
  getMessagesByProject(projectId: string): Promise<ChatMessage[]>;
  createMessage(message: InsertMessage): Promise<ChatMessage>;
  deleteMessagesByProject(projectId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;
  private messages: Map<string, ChatMessage>;

  constructor() {
    this.projects = new Map();
    this.messages = new Map();
    
    // Create default project
    this.initializeDefaultProject();
  }

  private initializeDefaultProject() {
    const defaultProject: Project = {
      id: "default-project",
      name: "my-telegram-bot",
      description: "Мой первый Telegram-бот",
      files: {
        "bot.py": `import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Отправляет сообщение при команде /start."""
    await update.message.reply_text('Привет! Я ваш Telegram-бот!')

def main() -> None:
    """Запуск бота."""
    # Вставьте сюда токен вашего бота
    application = Application.builder().token("YOUR_BOT_TOKEN").build()
    
    application.add_handler(CommandHandler("start", start))
    
    application.run_polling()

if __name__ == '__main__':
    main()`,
        "config.py": `import os
from typing import Final

# Токен бота из BotFather
BOT_TOKEN: Final = os.getenv('BOT_TOKEN', 'YOUR_BOT_TOKEN')

# Настройки базы данных (опционально)
DATABASE_URL: Final = os.getenv('DATABASE_URL', '')

# Настройки логирования
LOG_LEVEL: Final = os.getenv('LOG_LEVEL', 'INFO')`,
        "requirements.txt": `python-telegram-bot==20.7
python-dotenv==1.0.0`,
        "README.md": `# Telegram Bot

Простой Telegram-бот созданный с помощью TeleBot AI Studio.

## Установка

1. Установите зависимости:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Получите токен бота от @BotFather в Telegram

3. Установите токен в переменную окружения или замените в коде

4. Запустите бота:
\`\`\`bash
python bot.py
\`\`\``
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.projects.set(defaultProject.id, defaultProject);
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      id,
      name: insertProject.name,
      description: insertProject.description || null,
      files: insertProject.files || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getMessagesByProject(projectId: string): Promise<ChatMessage[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.projectId === projectId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createMessage(insertMessage: InsertMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      id,
      projectId: insertMessage.projectId || null,
      role: insertMessage.role,
      content: insertMessage.content,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async deleteMessagesByProject(projectId: string): Promise<boolean> {
    const messagesToDelete = Array.from(this.messages.values())
      .filter(msg => msg.projectId === projectId);
    
    messagesToDelete.forEach(msg => this.messages.delete(msg.id));
    return true;
  }
}

export const storage = new MemStorage();

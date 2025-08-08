import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertMessageSchema } from "@shared/schema";
import JSZip from "jszip";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects API
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const updates = req.body;
      const project = await storage.updateProject(req.params.id, updates);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Export project as ZIP
  app.get("/api/projects/:id/export", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const zip = new JSZip();
      
      // Add all files to ZIP
      Object.entries(project.files || {}).forEach(([filename, content]) => {
        zip.file(filename, content);
      });

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${project.name}.zip"`);
      res.send(zipBuffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to export project" });
    }
  });

  // Chat messages API
  app.get("/api/projects/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessagesByProject(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/projects/:id/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        projectId: req.params.id,
      });
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  app.delete("/api/projects/:id/messages", async (req, res) => {
    try {
      await storage.deleteMessagesByProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  // AI Chat endpoint - FastAPI proxy
  app.post("/api/ai/chat", async (req, res) => {
    const fastApiUrl = "http://127.0.0.1:8001";
    
    // First check if FastAPI is available
    try {
      const healthCheck = await fetch(`${fastApiUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(3000)
      });
      
      if (!healthCheck.ok) {
        throw new Error("FastAPI health check failed");
      }
    } catch (error) {
      console.error("FastAPI не доступен:", error);
      return res.status(500).json({ 
        error: "FastAPI прокси не запущен. Запустите workflow 'Start FastAPI Proxy' из выпадающего меню."
      });
    }

    // Send request to FastAPI
    try {
      const response = await fetch(`${fastApiUrl}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(30000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ AI response received successfully");
        return res.json(data);
      } else {
        const errorText = await response.text();
        console.error("FastAPI error response:", errorText);
        return res.status(response.status).json({ 
          error: `AI service error: ${errorText}` 
        });
      }
      
    } catch (error) {
      console.error("FastAPI request error:", error);
      return res.status(500).json({ 
        error: "Ошибка соединения с AI сервисом. Проверьте что FastAPI прокси запущен." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

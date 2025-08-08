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

  // AI Chat endpoint - using FastAPI proxy
  app.post("/api/ai/chat", async (req, res) => {
    try {
      // Check if OpenAI API key is provided
      const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "";
      
      if (hasOpenAIKey) {
        // Try to use FastAPI proxy
        try {
          const fastApiUrl = "http://localhost:8001";
          const response = await fetch(`${fastApiUrl}/ai/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.AUTH_TOKEN || "default_auth_token"}`,
            },
            body: JSON.stringify(req.body),
          });

          if (response.ok) {
            const data = await response.json();
            return res.json(data);
          } else {
            const error = await response.text();
            console.log("FastAPI error:", error);
          }
        } catch (fastApiError) {
          console.log("FastAPI unavailable:", fastApiError);
        }
      }
      
      // Use mock AI response as fallback
      const { mockAIChat } = await import('./ai-mock');
      const response = await mockAIChat(req.body);
      res.json(response);
      
    } catch (error) {
      console.error("AI Chat error:", error);
      res.status(500).json({ error: "AI service unavailable" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

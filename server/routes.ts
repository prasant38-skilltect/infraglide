import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertPipelineSchema, insertDeploymentSchema, insertCredentialSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
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
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Pipelines routes
  app.get("/api/pipelines", async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const pipelines = await storage.getPipelines(projectId);
      res.json(pipelines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipelines" });
    }
  });

  app.get("/api/pipelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pipeline = await storage.getPipeline(id);
      if (!pipeline) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      res.json(pipeline);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipeline" });
    }
  });

  app.post("/api/pipelines", async (req, res) => {
    try {
      const validatedData = insertPipelineSchema.parse(req.body);
      const pipeline = await storage.createPipeline(validatedData);
      res.status(201).json(pipeline);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid pipeline data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create pipeline" });
    }
  });

  app.put("/api/pipelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPipelineSchema.partial().parse(req.body);
      const pipeline = await storage.updatePipeline(id, validatedData);
      if (!pipeline) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      res.json(pipeline);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid pipeline data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update pipeline" });
    }
  });

  app.delete("/api/pipelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePipeline(id);
      if (!deleted) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete pipeline" });
    }
  });

  // Deployments routes
  app.get("/api/deployments", async (req, res) => {
    try {
      const pipelineId = req.query.pipelineId ? parseInt(req.query.pipelineId as string) : undefined;
      const deployments = await storage.getDeployments(pipelineId);
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deployments" });
    }
  });

  app.post("/api/deployments", async (req, res) => {
    try {
      const validatedData = insertDeploymentSchema.parse(req.body);
      const deployment = await storage.createDeployment(validatedData);
      
      // Simulate deployment process
      setTimeout(async () => {
        await storage.updateDeployment(deployment.id, { status: "running" });
        setTimeout(async () => {
          await storage.updateDeployment(deployment.id, { status: "success" });
        }, 5000);
      }, 1000);
      
      res.status(201).json(deployment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid deployment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create deployment" });
    }
  });

  // Credentials routes
  app.get("/api/credentials", async (req, res) => {
    try {
      const credentials = await storage.getCredentials();
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch credentials" });
    }
  });

  app.get("/api/credentials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const credential = await storage.getCredential(id);
      if (!credential) {
        return res.status(404).json({ error: "Credential not found" });
      }
      res.json(credential);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch credential" });
    }
  });

  app.post("/api/credentials", async (req, res) => {
    try {
      const validatedData = insertCredentialSchema.parse(req.body);
      const credential = await storage.createCredential(validatedData);
      res.status(201).json(credential);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid credential data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create credential" });
    }
  });

  app.put("/api/credentials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCredentialSchema.partial().parse(req.body);
      const credential = await storage.updateCredential(id, validatedData);
      if (!credential) {
        return res.status(404).json({ error: "Credential not found" });
      }
      res.json(credential);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid credential data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update credential" });
    }
  });

  app.delete("/api/credentials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCredential(id);
      if (!deleted) {
        return res.status(404).json({ error: "Credential not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete credential" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCloudProviderSchema, insertPipelineSchema, insertDeploymentSchema, insertResourceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Users
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data", details: error });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Cloud Providers
  app.get("/api/cloud-providers/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const providers = await storage.getCloudProviders(userId);
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cloud providers" });
    }
  });

  app.post("/api/cloud-providers", async (req, res) => {
    try {
      const providerData = insertCloudProviderSchema.parse(req.body);
      const provider = await storage.createCloudProvider(providerData);
      res.json(provider);
    } catch (error) {
      res.status(400).json({ error: "Invalid cloud provider data", details: error });
    }
  });

  app.put("/api/cloud-providers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertCloudProviderSchema.partial().parse(req.body);
      const provider = await storage.updateCloudProvider(id, updateData);
      if (!provider) {
        return res.status(404).json({ error: "Cloud provider not found" });
      }
      res.json(provider);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data", details: error });
    }
  });

  app.delete("/api/cloud-providers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCloudProvider(id);
      if (!deleted) {
        return res.status(404).json({ error: "Cloud provider not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cloud provider" });
    }
  });

  // Pipelines
  app.get("/api/pipelines/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const pipelines = await storage.getPipelines(userId);
      res.json(pipelines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipelines" });
    }
  });

  app.get("/api/pipeline/:id", async (req, res) => {
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
      const pipelineData = insertPipelineSchema.parse(req.body);
      const pipeline = await storage.createPipeline(pipelineData);
      res.json(pipeline);
    } catch (error) {
      res.status(400).json({ error: "Invalid pipeline data", details: error });
    }
  });

  app.put("/api/pipelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertPipelineSchema.partial().parse(req.body);
      const pipeline = await storage.updatePipeline(id, updateData);
      if (!pipeline) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      res.json(pipeline);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data", details: error });
    }
  });

  app.delete("/api/pipelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePipeline(id);
      if (!deleted) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete pipeline" });
    }
  });

  // Deployments
  app.get("/api/deployments/:pipelineId", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const deployments = await storage.getDeployments(pipelineId);
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deployments" });
    }
  });

  app.post("/api/deployments", async (req, res) => {
    try {
      const deploymentData = insertDeploymentSchema.parse(req.body);
      const deployment = await storage.createDeployment(deploymentData);
      res.json(deployment);
    } catch (error) {
      res.status(400).json({ error: "Invalid deployment data", details: error });
    }
  });

  app.put("/api/deployments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertDeploymentSchema.partial().parse(req.body);
      const deployment = await storage.updateDeployment(id, updateData);
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      res.json(deployment);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data", details: error });
    }
  });

  // Resources
  app.get("/api/resources/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const resources = await storage.getResources(userId);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/pipeline/:pipelineId", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const resources = await storage.getResourcesByPipeline(pipelineId);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipeline resources" });
    }
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const resourceData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(resourceData);
      res.json(resource);
    } catch (error) {
      res.status(400).json({ error: "Invalid resource data", details: error });
    }
  });

  app.put("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertResourceSchema.partial().parse(req.body);
      const resource = await storage.updateResource(id, updateData);
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data", details: error });
    }
  });

  app.delete("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteResource(id);
      if (!deleted) {
        return res.status(404).json({ error: "Resource not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard-stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const [pipelines, providers, resources] = await Promise.all([
        storage.getPipelines(userId),
        storage.getCloudProviders(userId),
        storage.getResources(userId)
      ]);

      const runningPipelines = pipelines.filter(p => p.status === 'active').length;
      const connectedProviders = providers.filter(p => p.isActive).length;
      const totalResources = resources.length;
      const runningResources = resources.filter(r => r.status === 'running').length;

      // Calculate estimated costs
      const totalDailyCost = resources.reduce((sum, resource) => {
        const cost = resource.cost ? parseFloat(resource.cost.replace('$', '').replace('/day', '')) : 0;
        return sum + cost;
      }, 0);

      res.json({
        runningPipelines,
        connectedProviders,
        totalResources,
        runningResources,
        totalDailyCost: totalDailyCost.toFixed(2),
        failedDeployments: 0, // TODO: Calculate from deployments
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

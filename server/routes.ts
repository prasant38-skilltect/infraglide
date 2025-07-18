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

  app.get("/api/pipelines/check-name/:name", async (req, res) => {
    try {
      const name = req.params.name;
      const existingPipelines = await storage.getPipelinesByName(name);
      const exists = existingPipelines.length > 0;
      const latestVersion = exists ? Math.max(...existingPipelines.map(p => p.version)) : 0;
      
      res.json({ 
        exists, 
        latestVersion,
        nextVersion: latestVersion + 1 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check pipeline name" });
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

  // Hub endpoints
  app.get("/api/hub/pipelines", async (req, res) => {
    try {
      // In a real implementation, this would fetch from GitHub or a hub database
      const hubPipelines = [
        {
          id: "hub-1",
          name: "AWS Full Stack Web App",
          description: "Complete infrastructure for a scalable web application with EC2, RDS, S3, and ALB",
          author: "CloudArchitect",
          provider: "AWS",
          region: "us-east-1",
          components: [
            { type: "aws-ec2", name: "Web Server" },
            { type: "aws-rds", name: "Database" },
            { type: "aws-s3", name: "Storage" },
            { type: "aws-alb", name: "Load Balancer" }
          ],
          connections: [],
          stars: 42,
          downloads: 128,
          publishedAt: "2025-01-15T10:30:00Z",
          version: "1.2.0",
          tags: ["web-app", "full-stack", "scalable"],
          status: "published",
          githubUrl: "https://github.com/cloudarchitect/aws-fullstack"
        },
        {
          id: "hub-2",
          name: "Azure Microservices Platform",
          description: "Microservices architecture with Azure Container Instances, Azure SQL, and Service Bus",
          author: "AzureExpert",
          provider: "Azure",
          region: "eastus",
          components: [
            { type: "azure-aci", name: "API Gateway" },
            { type: "azure-sql", name: "User Database" },
            { type: "azure-servicebus", name: "Message Queue" }
          ],
          connections: [],
          stars: 38,
          downloads: 94,
          publishedAt: "2025-01-12T14:20:00Z",
          version: "2.1.0",
          tags: ["microservices", "containers", "messaging"],
          status: "published",
          githubUrl: "https://github.com/azureexpert/microservices-platform"
        },
        {
          id: "hub-3",
          name: "GCP Data Pipeline",
          description: "Big data processing pipeline with Cloud Storage, BigQuery, and Dataflow",
          author: "DataEngineer",
          provider: "GCP",
          region: "us-central1",
          components: [
            { type: "gcp-storage", name: "Raw Data Storage" },
            { type: "gcp-bigquery", name: "Data Warehouse" },
            { type: "gcp-dataflow", name: "Processing Pipeline" }
          ],
          connections: [],
          stars: 31,
          downloads: 67,
          publishedAt: "2025-01-10T09:15:00Z",
          version: "1.0.0",
          tags: ["big-data", "analytics", "etl"],
          status: "published",
          githubUrl: "https://github.com/dataengineer/gcp-data-pipeline"
        }
      ];
      
      res.json(hubPipelines);
    } catch (error) {
      console.error("Failed to fetch hub pipelines:", error);
      res.status(500).json({ error: "Failed to fetch hub pipelines" });
    }
  });

  app.post("/api/hub/publish", async (req, res) => {
    try {
      const { pipelineId, description, tags } = req.body;
      
      if (!pipelineId || !description) {
        return res.status(400).json({ error: "Pipeline ID and description are required" });
      }

      // Fetch the pipeline to publish
      const pipeline = await storage.getPipeline(parseInt(pipelineId));
      if (!pipeline) {
        return res.status(404).json({ error: "Pipeline not found" });
      }

      // In a real implementation, this would:
      // 1. Create a GitHub repository or push to existing hub repo
      // 2. Upload pipeline JSON and documentation
      // 3. Create a release with proper versioning
      // 4. Update hub database with pipeline metadata
      
      const hubEntry = {
        id: `hub-${Date.now()}`,
        name: pipeline.name,
        description,
        author: "Current User", // Would be from auth
        provider: pipeline.provider,
        region: pipeline.region,
        components: pipeline.components,
        connections: pipeline.connections,
        stars: 0,
        downloads: 0,
        publishedAt: new Date().toISOString(),
        version: `${pipeline.version}.0`,
        tags: Array.isArray(tags) ? tags : [],
        status: "published",
        githubUrl: `https://github.com/infraglide-hub/${pipeline.name.toLowerCase().replace(/\s+/g, '-')}`
      };

      // Simulate GitHub API calls
      console.log("Publishing to GitHub:", {
        repository: hubEntry.githubUrl,
        pipeline: pipeline.name,
        description,
        tags
      });

      res.json({
        success: true,
        hubEntry,
        githubUrl: hubEntry.githubUrl,
        message: "Pipeline published successfully to GitHub Hub"
      });
    } catch (error) {
      console.error("Failed to publish pipeline:", error);
      res.status(500).json({ error: "Failed to publish pipeline" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

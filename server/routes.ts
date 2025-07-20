import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertPipelineSchema, 
  insertDeploymentSchema, 
  insertCredentialSchema,
  insertUserSchema,
  loginSchema,
  signupSchema
} from "@shared/schema";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";
import { AuthenticationService } from "./auth";
import { requireAuth, requireAdmin, optionalAuth, authRateLimit, generalRateLimit } from "./middleware";

const authService = new AuthenticationService(storage);

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply general rate limiting to all routes
  app.use("/api", generalRateLimit);

  // Authentication routes
  app.post("/api/auth/signup", authRateLimit, async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      const result = await authService.signup(validatedData);
      
      res.status(201).json({
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          fullName: result.user.fullName,
          isAdmin: result.user.isAdmin,
        },
        token: result.token,
        sessionId: result.session.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid signup data", details: error.errors });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : "Signup failed" });
    }
  });

  app.post("/api/auth/login", authRateLimit, async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);
      
      res.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          fullName: result.user.fullName,
          isAdmin: result.user.isAdmin,
        },
        token: result.token,
        sessionId: result.session.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid login data", details: error.errors });
      }
      res.status(401).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    try {
      if (req.sessionId) {
        await authService.logout(req.sessionId);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    res.json({
      user: {
        id: req.user!.id,
        email: req.user!.email,
        username: req.user!.username,
        fullName: req.user!.fullName,
        isAdmin: req.user!.isAdmin,
      }
    });
  });

  // LDAP Configuration routes removed for email-based authentication

  // User management routes (admin only)
  app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        authProvider: user.authProvider,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertUserSchema.partial().parse(req.body);
      
      // Don't allow password changes through this endpoint
      delete (validatedData as any).passwordHash;
      
      const user = await storage.updateUser(id, validatedData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        authProvider: user.authProvider,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      };
      
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Project routes with complete isolation
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjects(req.user!.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      console.log("Creating project with data:", req.body);
      console.log("User:", req.user);
      
      const validatedData = insertProjectSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      const project = await storage.createProject({ ...validatedData, userId: req.user!.id });
      console.log("Created project:", project);
      
      res.status(201).json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create project", details: error.message });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      
      const project = await storage.getProject(id);
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ error: "Project not found" });
      }

      const updatedProject = await storage.updateProject(id, validatedData);
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ error: "Project not found" });
      }

      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const projectData = { ...validatedData, userId: req.user!.id };
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(id, validatedData);
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const deleted = await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Pipelines routes
  app.get("/api/pipelines", requireAuth, async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const pipelines = await storage.getPipelines(projectId, req.user!.id);
      res.json(pipelines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipelines" });
    }
  });

  app.get("/api/pipelines/versions/:pipelineName", requireAuth, async (req, res) => {
    try {
      const pipelineName = req.params.pipelineName;
      const versions = await storage.getPipelineVersions(pipelineName, req.user!.id);
      res.json(versions);
    } catch (error) {
      console.error("Failed to fetch pipeline versions:", error);
      res.status(500).json({ error: "Failed to fetch pipeline versions" });
    }
  });

  app.get("/api/pipelines/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pipeline = await storage.getPipeline(id);
      if (!pipeline || pipeline.userId !== req.user!.id) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      res.json(pipeline);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipeline" });
    }
  });

  app.get("/api/pipelines/check-name/:name", requireAuth, async (req, res) => {
    try {
      const name = req.params.name;
      const existingPipelines = await storage.getPipelinesByName(name, req.user!.id);
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

  app.post("/api/pipelines", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPipelineSchema.parse(req.body);
      const pipelineData = { ...validatedData, userId: req.user!.id };
      const pipeline = await storage.createPipeline(pipelineData);
      
      // Create directory with pipeline name
      try {
        const pipelineDir = path.join(process.cwd(), "pipelines", pipeline.name.replace(/[^a-zA-Z0-9-_]/g, "_"));
        await fs.mkdir(pipelineDir, { recursive: true });
        
        // Create pipeline metadata file
        const pipelineMetadata = {
          id: pipeline.id,
          name: pipeline.name,
          description: pipeline.description,
          provider: pipeline.provider,
          region: pipeline.region,
          createdAt: new Date().toISOString(),
          components: pipeline.components,
          connections: pipeline.connections
        };
        
        await fs.writeFile(
          path.join(pipelineDir, "pipeline.json"),
          JSON.stringify(pipelineMetadata, null, 2)
        );
        
        // Create README file
        const readme = `# ${pipeline.name}

## Description
${pipeline.description || 'No description provided'}

## Provider
${pipeline.provider}

## Region
${pipeline.region}

## Components
${Array.isArray(pipeline.components) ? pipeline.components.length : 0} components configured

## Created
${new Date().toLocaleDateString()}

This directory was automatically created when the pipeline was saved in InfraGlide.
`;
        
        await fs.writeFile(path.join(pipelineDir, "README.md"), readme);
        
        console.log(`Created directory and files for pipeline: ${pipeline.name}`);
      } catch (dirError) {
        console.error("Failed to create pipeline directory:", dirError);
        // Don't fail the pipeline creation if directory creation fails
      }
      
      res.status(201).json(pipeline);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid pipeline data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create pipeline" });
    }
  });

  app.put("/api/pipelines/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingPipeline = await storage.getPipeline(id);
      if (!existingPipeline || existingPipeline.userId !== req.user!.id) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      
      const validatedData = insertPipelineSchema.partial().parse(req.body);
      const pipeline = await storage.updatePipeline(id, validatedData);
      if (!pipeline) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      
      // Update pipeline directory and files
      try {
        const pipelineDir = path.join(process.cwd(), "pipelines", pipeline.name.replace(/[^a-zA-Z0-9-_]/g, "_"));
        await fs.mkdir(pipelineDir, { recursive: true });
        
        // Update pipeline metadata file
        const pipelineMetadata = {
          id: pipeline.id,
          name: pipeline.name,
          description: pipeline.description,
          provider: pipeline.provider,
          region: pipeline.region,
          updatedAt: new Date().toISOString(),
          components: pipeline.components,
          connections: pipeline.connections
        };
        
        await fs.writeFile(
          path.join(pipelineDir, "pipeline.json"),
          JSON.stringify(pipelineMetadata, null, 2)
        );
        
        console.log(`Updated directory and files for pipeline: ${pipeline.name}`);
      } catch (dirError) {
        console.error("Failed to update pipeline directory:", dirError);
        // Don't fail the pipeline update if directory update fails
      }
      
      res.json(pipeline);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid pipeline data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update pipeline" });
    }
  });

  // Get pipeline versions
  app.get("/api/pipelines/versions/:name", requireAuth, async (req, res) => {
    try {
      const name = req.params.name;
      const versions = await storage.getPipelineVersions(name, req.user!.id);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipeline versions" });
    }
  });

  // Create a new version of a pipeline
  app.post("/api/pipelines/:id/versions", requireAuth, async (req, res) => {
    try {
      const parentId = parseInt(req.params.id);
      const existingPipeline = await storage.getPipeline(parentId);
      
      if (!existingPipeline || existingPipeline.userId !== req.user!.id) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      
      const validatedData = insertPipelineSchema.parse(req.body);
      const newVersion = await storage.createPipelineVersion(validatedData, parentId);
      
      res.status(201).json(newVersion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid pipeline data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create pipeline version" });
    }
  });

  app.delete("/api/pipelines/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get pipeline info before deletion for directory cleanup
      const pipeline = await storage.getPipeline(id);
      if (!pipeline || pipeline.userId !== req.user!.id) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      
      const deleted = await storage.deletePipeline(id);
      if (!deleted) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      
      // Clean up pipeline directory
      if (pipeline) {
        try {
          const pipelineDir = path.join(process.cwd(), "pipelines", pipeline.name.replace(/[^a-zA-Z0-9-_]/g, "_"));
          await fs.rm(pipelineDir, { recursive: true, force: true });
          console.log(`Deleted directory for pipeline: ${pipeline.name}`);
        } catch (dirError) {
          console.error("Failed to delete pipeline directory:", dirError);
          // Don't fail the pipeline deletion if directory cleanup fails
        }
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete pipeline" });
    }
  });

  // Deployments routes
  app.get("/api/deployments", requireAuth, async (req, res) => {
    try {
      const pipelineId = req.query.pipelineId ? parseInt(req.query.pipelineId as string) : undefined;
      const deployments = await storage.getDeployments(pipelineId);
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deployments" });
    }
  });

  app.post("/api/deployments", requireAuth, async (req, res) => {
    try {
      const validatedData = insertDeploymentSchema.parse(req.body);
      
      // Verify user owns the pipeline
      if (validatedData.pipelineId) {
        const pipeline = await storage.getPipeline(validatedData.pipelineId);
        if (!pipeline || pipeline.userId !== req.user!.id) {
          return res.status(403).json({ error: "Pipeline not found or access denied" });
        }
      }
      
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
  app.get("/api/credentials", requireAuth, async (req, res) => {
    try {
      const credentials = await storage.getCredentials(req.user!.id);
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch credentials" });
    }
  });

  app.get("/api/credentials/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const credential = await storage.getCredential(id);
      if (!credential || credential.userId !== req.user!.id) {
        return res.status(404).json({ error: "Credential not found" });
      }
      res.json(credential);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch credential" });
    }
  });

  app.post("/api/credentials", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCredentialSchema.parse(req.body);
      const credentialData = { ...validatedData, userId: req.user!.id };
      const credential = await storage.createCredential(credentialData);
      res.status(201).json(credential);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid credential data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create credential" });
    }
  });

  app.put("/api/credentials/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingCredential = await storage.getCredential(id);
      if (!existingCredential || existingCredential.userId !== req.user!.id) {
        return res.status(404).json({ error: "Credential not found" });
      }
      
      const validatedData = insertCredentialSchema.partial().parse(req.body);
      const credential = await storage.updateCredential(id, validatedData);
      res.json(credential);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid credential data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update credential" });
    }
  });

  app.delete("/api/credentials/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const credential = await storage.getCredential(id);
      if (!credential || credential.userId !== req.user!.id) {
        return res.status(404).json({ error: "Credential not found" });
      }
      
      const deleted = await storage.deleteCredential(id);
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

  // Hub publish endpoint
  app.post("/api/hub/publish", requireAuth, async (req, res) => {
    try {
      const { pipelineId, description, tags, githubRepo, version } = req.body;
      
      if (!pipelineId || !description || !githubRepo) {
        return res.status(400).json({ error: "Missing required fields: pipelineId, description, githubRepo" });
      }

      // Get the pipeline to publish
      const pipeline = await storage.getPipeline(parseInt(pipelineId));
      if (!pipeline || pipeline.userId !== req.user!.id) {
        return res.status(404).json({ error: "Pipeline not found or access denied" });
      }

      // In a real implementation, this would:
      // 1. Create or update a GitHub repository with the pipeline configuration
      // 2. Generate Terraform files and documentation
      // 3. Create a GitHub release with the specified version
      // 4. Update the hub database with the published pipeline metadata
      // 5. Send notifications to followers/subscribers

      console.log(`Publishing pipeline "${pipeline.name}" v${version} to GitHub repo: ${githubRepo}`);
      console.log(`Description: ${description}`);
      console.log(`Tags: ${tags?.join(', ') || 'none'}`);
      console.log(`Components: ${pipeline.components?.length || 0}`);
      console.log(`Provider: ${pipeline.provider}`);

      // Mock GitHub API integration
      const githubUrl = `https://github.com/${githubRepo}`;
      const releaseUrl = `${githubUrl}/releases/tag/v${version}`;
      
      // Simulate GitHub repository creation/update
      const publishResult = {
        id: `hub-${Date.now()}`,
        name: pipeline.name,
        description,
        author: req.user!.fullName || req.user!.username,
        provider: pipeline.provider,
        region: pipeline.region,
        components: pipeline.components || [],
        connections: pipeline.connections || [],
        stars: 0,
        downloads: 0,
        publishedAt: new Date().toISOString(),
        version: `${version}`,
        tags: tags || [],
        status: 'published' as const,
        githubUrl,
        releaseUrl,
        terraformUrl: `${githubUrl}/blob/main/main.tf.json`,
        readmeUrl: `${githubUrl}/blob/main/README.md`
      };

      // In production, save to hub database here
      console.log("Pipeline published successfully:", publishResult);
      
      res.json({
        success: true,
        message: "Pipeline published successfully to GitHub Hub!",
        pipeline: publishResult,
        githubUrl,
        releaseUrl
      });
    } catch (error) {
      console.error("Failed to publish pipeline:", error);
      res.status(500).json({ error: "Failed to publish pipeline to GitHub Hub" });
    }
  });

  // Deployed Resources endpoints
  app.get("/api/deployed-resources", async (req, res) => {
    try {
      const credentialId = req.query.credentialId as string;
      
      if (!credentialId) {
        return res.json([]);
      }

      // Fetch credential to determine provider
      const credential = await storage.getCredential(parseInt(credentialId));
      if (!credential) {
        return res.status(404).json({ error: "Credential not found" });
      }

      // In a real implementation, this would:
      // 1. Use the credential to authenticate with cloud provider APIs
      // 2. Call AWS EC2, RDS, S3 APIs for AWS resources
      // 3. Call Azure Resource Manager APIs for Azure resources  
      // 4. Call Google Cloud Resource Manager APIs for GCP resources
      // 5. Aggregate and normalize the resource data

      // Mock deployed resources based on provider
      const mockResources = generateMockResources(credential.provider, credential.name);
      
      res.json(mockResources);
    } catch (error) {
      console.error("Failed to fetch deployed resources:", error);
      res.status(500).json({ error: "Failed to fetch deployed resources" });
    }
  });

  function generateMockResources(provider: string, accountName: string): any[] {
    const baseResources: any[] = [];
    const regions = {
      'AWS': ['us-east-1', 'us-west-2', 'eu-west-1'],
      'Azure': ['eastus', 'westus2', 'westeurope'], 
      'GCP': ['us-central1', 'us-west1', 'europe-west1']
    };

    const resourceTypes = {
      'AWS': [
        { type: 'aws-ec2-instance', name: 'Web Server', cost: 45.60 },
        { type: 'aws-rds-mysql', name: 'Production DB', cost: 89.30 },
        { type: 'aws-s3-bucket', name: 'Assets Storage', cost: 12.50 },
        { type: 'aws-vpc', name: 'Main VPC', cost: 0 },
        { type: 'aws-alb', name: 'Load Balancer', cost: 22.40 }
      ],
      'Azure': [
        { type: 'azure-vm', name: 'App Server', cost: 52.80 },
        { type: 'azure-sql-database', name: 'User Database', cost: 95.20 },
        { type: 'azure-storage-account', name: 'Blob Storage', cost: 15.30 },
        { type: 'azure-vnet', name: 'Virtual Network', cost: 0 },
        { type: 'azure-load-balancer', name: 'Traffic Manager', cost: 18.90 }
      ],
      'GCP': [
        { type: 'gcp-compute-instance', name: 'Compute Engine', cost: 41.70 },
        { type: 'gcp-cloud-sql', name: 'Cloud SQL DB', cost: 78.40 },
        { type: 'gcp-cloud-storage', name: 'Cloud Storage', cost: 10.20 },
        { type: 'gcp-vpc', name: 'VPC Network', cost: 0 },
        { type: 'gcp-load-balancer', name: 'Cloud Load Balancer', cost: 20.60 }
      ]
    };

    const statuses = ['running', 'running', 'running', 'stopped', 'pending'];
    const providerRegions = regions[provider as keyof typeof regions] || ['us-east-1'];
    const providerTypes = resourceTypes[provider as keyof typeof resourceTypes] || [];

    providerTypes.forEach((resourceType, index) => {
      baseResources.push({
        id: `${provider.toLowerCase()}-${index + 1}-${Date.now()}`,
        name: resourceType.name,
        type: resourceType.type,
        status: statuses[index % statuses.length],
        region: providerRegions[index % providerRegions.length],
        cost: resourceType.cost,
        tags: {
          Environment: index < 2 ? 'Production' : 'Development',
          Project: 'InfraGlide',
          Owner: accountName
        },
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastModified: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        provider: provider as 'AWS' | 'Azure' | 'GCP',
        account: accountName,
        resourceGroup: provider === 'Azure' ? `${accountName}-rg` : undefined,
        project: provider === 'GCP' ? `${accountName}-project` : undefined
      });
    });

    return baseResources;
  }

  // Ask Jane AI Assistant endpoints
  app.post("/api/ask-jane", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Built-in AI responses for infrastructure questions
      const response = await generateJaneResponse(message.toLowerCase());
      
      res.json(response);
    } catch (error) {
      console.error("Failed to process Jane request:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  async function generateJaneResponse(message: string): Promise<{ response: string; terraformJson?: any; hasError?: boolean }> {
    // AWS Services
    if (message.includes('aws s3') || message.includes('s3 bucket')) {
      return {
        response: "Here's a Terraform configuration for an AWS S3 bucket with versioning and encryption:",
        terraformJson: {
          terraform: {
            required_providers: {
              aws: {
                source: "hashicorp/aws",
                version: "~> 5.0"
              }
            }
          },
          provider: {
            aws: {
              region: "us-east-1"
            }
          },
          resource: {
            aws_s3_bucket: {
              example_bucket: {
                bucket: "my-infrastructure-bucket-${random_id.bucket_suffix.hex}",
                tags: {
                  Name: "InfraGlide Bucket",
                  Environment: "Production"
                }
              }
            },
            aws_s3_bucket_versioning: {
              example_bucket_versioning: {
                bucket: "${aws_s3_bucket.example_bucket.id}",
                versioning_configuration: {
                  status: "Enabled"
                }
              }
            },
            random_id: {
              bucket_suffix: {
                byte_length: 4
              }
            }
          }
        }
      };
    }

    // Google Cloud Services
    if (message.includes('google compute') || message.includes('gcp compute') || message.includes('compute engine')) {
      return {
        response: "Here's a Terraform configuration for a Google Compute Engine instance:",
        terraformJson: {
          terraform: {
            required_providers: {
              google: {
                source: "hashicorp/google",
                version: "~> 4.0"
              }
            }
          },
          provider: {
            google: {
              project: "my-project-id",
              region: "us-central1",
              zone: "us-central1-a"
            }
          },
          resource: {
            google_compute_instance: {
              vm_instance: {
                name: "web-server",
                machine_type: "e2-micro",
                zone: "us-central1-a",
                boot_disk: {
                  initialize_params: {
                    image: "debian-cloud/debian-11"
                  }
                },
                network_interface: {
                  network: "default",
                  access_config: {}
                },
                tags: ["web-server", "http-server"]
              }
            }
          }
        }
      };
    }

    // Azure Services
    if (message.includes('azure sql') || message.includes('sql database')) {
      return {
        response: "Here's a Terraform configuration for Azure SQL Database:",
        terraformJson: {
          terraform: {
            required_providers: {
              azurerm: {
                source: "hashicorp/azurerm",
                version: "~> 3.0"
              }
            }
          },
          provider: {
            azurerm: {
              features: {}
            }
          },
          resource: {
            azurerm_resource_group: {
              main: {
                name: "rg-database",
                location: "East US"
              }
            },
            azurerm_mssql_server: {
              main: {
                name: "sql-server-${random_id.server_suffix.hex}",
                resource_group_name: "${azurerm_resource_group.main.name}",
                location: "${azurerm_resource_group.main.location}",
                version: "12.0",
                administrator_login: "sqladmin",
                administrator_login_password: "ComplexPassword123!"
              }
            },
            azurerm_mssql_database: {
              main: {
                name: "production-db",
                server_id: "${azurerm_mssql_server.main.id}",
                collation: "SQL_Latin1_General_CP1_CI_AS",
                sku_name: "Basic"
              }
            }
          }
        }
      };
    }

    // General infrastructure advice
    if (message.includes('best practices') || message.includes('architecture')) {
      return {
        response: `Here are some cloud architecture best practices:

**Security:**
• Use IAM roles and policies for least privilege access
• Enable encryption at rest and in transit
• Implement network security groups and firewalls

**Scalability:**
• Design for horizontal scaling with load balancers
• Use auto-scaling groups for dynamic capacity
• Consider microservices architecture

**Reliability:**
• Multi-AZ/region deployments for high availability
• Implement health checks and monitoring
• Use managed services when possible

Would you like me to create a specific Terraform configuration for any of these patterns?`
      };
    }

    // Default response for unrecognized queries
    return {
      response: `I can help you with Terraform configurations for cloud services! Try asking about:

**AWS Services:**
• "Create an AWS S3 bucket"
• "Show me AWS EC2 instance configuration"

**Google Cloud:**
• "Google Compute Engine instance"
• "GCP Cloud Storage bucket"

**Azure:**
• "Azure Virtual Machine"
• "Azure SQL Database"

**General Help:**
• "Best practices for cloud architecture"

What specific cloud service would you like to configure?`
    };
  }

  // Terraform execution test route
  app.post("/api/terraform/execute", async (req, res) => {
    try {
      const { command, pipelineName } = req.body;
      
      if (!command || !pipelineName) {
        return res.status(400).json({ error: "Missing required fields: command, pipelineName" });
      }

      const sanitizedName = pipelineName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      const pipelineDir = path.join('pipelines', sanitizedName);
      
      // Use absolute path to our terraform wrapper
      const terraformBinaryPath = '/home/runner/.local/bin/terraform';
      
      try {
        // Execute terraform command in the pipeline directory using absolute path
        const output = execSync(`cd ${pipelineDir} && ${terraformBinaryPath} ${command}`, { 
          encoding: 'utf8',
          timeout: 30000 // 30 second timeout
        });
        
        res.json({ 
          success: true, 
          output: output.trim(),
          command: `terraform ${command}`,
          directory: pipelineDir
        });
      } catch (execError: any) {
        res.status(500).json({ 
          error: "Terraform execution failed", 
          details: execError.message,
          command: `terraform ${command}`,
          directory: pipelineDir
        });
      }
    } catch (error) {
      console.error('Terraform execution error:', error);
      res.status(500).json({ error: "Failed to execute Terraform command" });
    }
  });

  // Terraform generation route
  app.post("/api/generate-terraform", async (req, res) => {
    try {
      const { pipelineName, components, provider, oldPipelineName, credentialId } = req.body;
      
      if (!pipelineName || !components || !provider) {
        return res.status(400).json({ error: "Missing required fields: pipelineName, components, provider" });
      }

      // Get credential information if credentialId is provided
      let credential = null;
      if (credentialId) {
        credential = await storage.getCredential(credentialId);
        if (!credential) {
          return res.status(404).json({ error: "Credential not found" });
        }
      }

      const terraformJson = generateTerraformJson(components, provider, credential);
      
      // Create pipeline directory with sanitized name
      const sanitizedName = pipelineName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      const pipelineDir = path.join('pipelines', sanitizedName);

      // Handle directory renaming if pipeline name changed
      if (oldPipelineName && oldPipelineName !== pipelineName) {
        const oldSanitizedName = oldPipelineName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
        const oldPipelineDir = path.join('pipelines', oldSanitizedName);
        
        try {
          await fs.access(oldPipelineDir);
          // Directory exists, try to rename it
          await fs.rename(oldPipelineDir, pipelineDir);
          console.log(`Renamed pipeline directory from ${oldSanitizedName} to ${sanitizedName}`);
        } catch (error) {
          // Old directory doesn't exist or rename failed, just create new one
          console.log(`Directory rename not needed or failed, creating new directory: ${sanitizedName}`);
        }
      }
      
      try {
        await fs.mkdir(pipelineDir, { recursive: true });
        
        // Write main.tf.json file
        const terraformPath = path.join(pipelineDir, 'main.tf.json');
        await fs.writeFile(terraformPath, JSON.stringify(terraformJson, null, 2));
        
        res.json({ 
          success: true, 
          message: `Terraform configuration generated for ${pipelineName}`,
          path: terraformPath
        });
      } catch (fileError) {
        console.error('File system error:', fileError);
        res.status(500).json({ error: "Failed to write Terraform files" });
      }
    } catch (error) {
      console.error('Terraform generation error:', error);
      res.status(500).json({ error: "Failed to generate Terraform configuration" });
    }
  });

  // Cost Optimization API Routes
  app.get("/api/cost-optimization/:pipelineId", requireAuth, async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      const pipeline = await storage.getPipeline(pipelineId);
      
      if (!pipeline || pipeline.userId !== req.user!.id) {
        return res.status(404).json({ error: "Pipeline not found or access denied" });
      }

      // Generate cost analysis based on pipeline components
      const costAnalysis = generateCostAnalysis(pipeline);
      res.json(costAnalysis);
    } catch (error) {
      console.error("Cost optimization analysis error:", error);
      res.status(500).json({ error: "Failed to analyze pipeline costs" });
    }
  });

  app.post("/api/cost-optimization/apply", requireAuth, async (req, res) => {
    try {
      const { pipelineId, recommendationId } = req.body;
      
      if (!pipelineId || !recommendationId) {
        return res.status(400).json({ error: "Missing required fields: pipelineId, recommendationId" });
      }

      const pipeline = await storage.getPipeline(parseInt(pipelineId));
      if (!pipeline || pipeline.userId !== req.user!.id) {
        return res.status(404).json({ error: "Pipeline not found or access denied" });
      }

      // Apply the cost optimization recommendation
      const result = await applyCostOptimization(pipeline, recommendationId, storage);
      
      res.json({
        success: true,
        message: "Cost optimization applied successfully",
        ...result
      });
    } catch (error) {
      console.error("Apply cost optimization error:", error);
      res.status(500).json({ error: "Failed to apply cost optimization" });
    }
  });

  // RBAC API Routes
  
  // Roles
  app.get("/api/rbac/roles", requireAuth, async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.post("/api/rbac/roles", requireAuth, async (req, res) => {
    try {
      const validatedData = req.body; // Add validation schema later
      const role = await storage.createRole(validatedData);
      res.status(201).json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to create role" });
    }
  });

  app.put("/api/rbac/roles/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = req.body; // Add validation schema later
      const role = await storage.updateRole(id, validatedData);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/rbac/roles/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRole(id);
      if (!deleted) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Permissions
  app.get("/api/rbac/permissions", requireAuth, async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  // User Roles
  app.get("/api/rbac/user-roles/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userRoles = await storage.getUserRoles(userId);
      res.json(userRoles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user roles" });
    }
  });

  app.post("/api/rbac/user-roles", requireAuth, async (req, res) => {
    try {
      const { userId, roleId } = req.body;
      const userRole = await storage.createUserRole({
        userId,
        roleId,
        assignedBy: req.user!.id
      });
      res.status(201).json(userRole);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign role" });
    }
  });

  app.delete("/api/rbac/user-roles/:userId/:roleId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const roleId = parseInt(req.params.roleId);
      const deleted = await storage.deleteUserRole(userId, roleId);
      if (!deleted) {
        return res.status(404).json({ error: "User role not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove role" });
    }
  });

  // Resource Permissions
  app.get("/api/rbac/resource-permissions", requireAuth, async (req, res) => {
    try {
      const { userId, resource } = req.query;
      const permissions = await storage.getResourcePermissions(
        userId ? parseInt(userId as string) : undefined,
        resource as string
      );
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resource permissions" });
    }
  });

  app.post("/api/rbac/resource-permissions", requireAuth, async (req, res) => {
    try {
      const validatedData = {
        ...req.body,
        grantedBy: req.user!.id
      };
      const permission = await storage.createResourcePermission(validatedData);
      res.status(201).json(permission);
    } catch (error) {
      res.status(500).json({ error: "Failed to grant permission" });
    }
  });

  app.delete("/api/rbac/resource-permissions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteResourcePermission(id);
      if (!deleted) {
        return res.status(404).json({ error: "Permission not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to revoke permission" });
    }
  });

  // Check Permission
  app.get("/api/rbac/check-permission", requireAuth, async (req, res) => {
    try {
      const { resource, action, resourceId } = req.query;
      const hasPermission = await storage.hasPermission(
        req.user!.id,
        resource as string,
        action as string,
        resourceId ? parseInt(resourceId as string) : undefined
      );
      res.json({ hasPermission });
    } catch (error) {
      res.status(500).json({ error: "Failed to check permission" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate Terraform JSON configuration
function generateTerraformJson(components: any[], provider: string, credential?: any) {
  const terraformConfig: any = {
    terraform: {
      required_providers: {}
    },
    provider: {},
    resource: {}
  };

  // Configure provider-specific settings with credentials
  switch (provider) {
    case 'aws':
      terraformConfig.terraform.required_providers.aws = {
        source: "hashicorp/aws",
        version: "~> 5.0"
      };
      terraformConfig.provider.aws = {
        region: "us-east-1"
      };
      // Add AWS credentials if available
      if (credential && credential.provider === 'AWS') {
        terraformConfig.provider.aws.access_key = credential.username; // AWS Access Key ID
        terraformConfig.provider.aws.secret_key = credential.password; // AWS Secret Access Key
      }
      break;
    case 'azure':
      terraformConfig.terraform.required_providers.azurerm = {
        source: "hashicorp/azurerm",
        version: "~> 3.0"
      };
      terraformConfig.provider.azurerm = {
        features: {}
      };
      // Add Azure credentials if available
      if (credential && credential.provider === 'Azure') {
        terraformConfig.provider.azurerm.client_id = credential.username; // Azure Client ID
        terraformConfig.provider.azurerm.client_secret = credential.password; // Azure Client Secret
        terraformConfig.provider.azurerm.tenant_id = credential.tenantId || "your-tenant-id"; // Azure Tenant ID
        terraformConfig.provider.azurerm.subscription_id = credential.subscriptionId || "your-subscription-id"; // Azure Subscription ID
      }
      break;
    case 'gcp':
      terraformConfig.terraform.required_providers.google = {
        source: "hashicorp/google",
        version: "~> 4.0"
      };
      terraformConfig.provider.google = {
        project: credential?.username || "my-project-id", // GCP Project ID
        region: "us-central1"
      };
      // Add GCP credentials if available
      if (credential && credential.provider === 'GCP') {
        terraformConfig.provider.google.credentials = credential.password; // GCP Service Account JSON
      }
      break;
  }

  // Generate resources for each component
  components.forEach((component, index) => {
    const resourceConfig = generateResourceConfig(component, provider, index);
    if (resourceConfig) {
      Object.assign(terraformConfig.resource, resourceConfig);
    }
  });

  return terraformConfig;
}

// Helper function to generate cost analysis and recommendations
function generateCostAnalysis(pipeline: any) {
  const components = Array.isArray(pipeline.components) ? pipeline.components : [];
  
  // Calculate base costs for each component type
  const costCalculations = {
    totalMonthlyCost: 0,
    breakdown: {
      compute: 0,
      storage: 0,
      networking: 0,
      database: 0,
      other: 0
    }
  };

  const recommendations: any[] = [];

  // Analyze each component and generate recommendations
  components.forEach((component: any, index: number) => {
    const { type, data } = component;
    let baseCost = 0;
    let category = 'other';

    switch (type) {
      // AWS Components
      case 'aws-ec2':
        category = 'compute';
        baseCost = calculateEC2Cost(data);
        // Generate EC2 optimization recommendations
        recommendations.push(...generateEC2Recommendations(component, index));
        break;
      
      case 'aws-s3':
        category = 'storage';
        baseCost = calculateS3Cost(data);
        recommendations.push(...generateS3Recommendations(component, index));
        break;
      
      case 'aws-rds':
        category = 'database';
        baseCost = calculateRDSCost(data);
        recommendations.push(...generateRDSRecommendations(component, index));
        break;
      
      case 'aws-lambda':
        category = 'compute';
        baseCost = calculateLambdaCost(data);
        recommendations.push(...generateLambdaRecommendations(component, index));
        break;
      
      case 'aws-vpc':
        category = 'networking';
        baseCost = calculateVPCCost(data);
        recommendations.push(...generateVPCRecommendations(component, index));
        break;

      // Azure Components
      case 'azure-vm':
        category = 'compute';
        baseCost = calculateAzureVMCost(data);
        recommendations.push(...generateAzureVMRecommendations(component, index));
        break;
      
      case 'azure-storage':
        category = 'storage';
        baseCost = calculateAzureStorageCost(data);
        recommendations.push(...generateAzureStorageRecommendations(component, index));
        break;

      // GCP Components
      case 'gcp-compute':
        category = 'compute';
        baseCost = calculateGCPComputeCost(data);
        recommendations.push(...generateGCPComputeRecommendations(component, index));
        break;
      
      case 'gcp-storage':
        category = 'storage';
        baseCost = calculateGCPStorageCost(data);
        recommendations.push(...generateGCPStorageRecommendations(component, index));
        break;
    }

    costCalculations.totalMonthlyCost += baseCost;
    costCalculations.breakdown[category as keyof typeof costCalculations.breakdown] += baseCost;
  });

  // Calculate potential savings
  const potentialSavings = recommendations.reduce((total, rec) => total + rec.potentialSavings, 0);
  const savingsPercentage = costCalculations.totalMonthlyCost > 0 
    ? (potentialSavings / costCalculations.totalMonthlyCost) * 100 
    : 0;

  return {
    totalMonthlyCost: costCalculations.totalMonthlyCost,
    potentialSavings,
    savingsPercentage,
    recommendations: recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings),
    breakdown: costCalculations.breakdown
  };
}

// Cost calculation functions for different services
function calculateEC2Cost(data: any): number {
  const instanceTypes: Record<string, number> = {
    't3.micro': 8.47,
    't3.small': 16.93,
    't3.medium': 33.87,
    't3.large': 67.74,
    't3.xlarge': 135.48,
    'm5.large': 96.36,
    'm5.xlarge': 192.72,
    'c5.large': 85.50,
    'c5.xlarge': 171.00
  };
  
  return instanceTypes[data?.instanceType] || 50.00;
}

function calculateS3Cost(data: any): number {
  // Basic S3 storage cost estimation
  const storageGB = parseInt(data?.storageSize) || 100;
  const standardStorageCost = storageGB * 0.023; // $0.023 per GB for Standard storage
  const requestsCost = 5.00; // Estimated monthly requests cost
  return standardStorageCost + requestsCost;
}

function calculateRDSCost(data: any): number {
  const instanceTypes: Record<string, number> = {
    'db.t3.micro': 15.33,
    'db.t3.small': 30.66,
    'db.m5.large': 144.00,
    'db.r5.large': 180.00
  };
  
  const instanceCost = instanceTypes[data?.instanceClass] || 75.00;
  const storageCost = (parseInt(data?.allocatedStorage) || 20) * 0.115; // $0.115 per GB for gp2
  return instanceCost + storageCost;
}

function calculateLambdaCost(data: any): number {
  // Lambda cost estimation based on invocations and duration
  const monthlyInvocations = parseInt(data?.monthlyInvocations) || 100000;
  const avgDuration = parseInt(data?.avgDuration) || 1000; // milliseconds
  const memoryMB = parseInt(data?.memorySize) || 128;
  
  const requestCost = Math.max(0, (monthlyInvocations - 1000000) * 0.0000002); // Free tier: 1M requests
  const computeCost = ((monthlyInvocations * avgDuration / 1000) * (memoryMB / 1024) * 0.0000166667);
  
  return requestCost + computeCost;
}

function calculateVPCCost(data: any): number {
  // Basic VPC costs (NAT Gateway, VPC Endpoints, etc.)
  const natGatewayCost = 45.00; // $0.045 per hour
  const vpcEndpointCost = 15.00; // Estimated for common endpoints
  return natGatewayCost + vpcEndpointCost;
}

function calculateAzureVMCost(data: any): number {
  const vmSizes: Record<string, number> = {
    'Standard_B1s': 7.59,
    'Standard_B1ms': 15.18,
    'Standard_B2s': 30.37,
    'Standard_D2s_v3': 96.36,
    'Standard_D4s_v3': 192.72
  };
  
  return vmSizes[data?.vmSize] || 50.00;
}

function calculateAzureStorageCost(data: any): number {
  const storageGB = parseInt(data?.storageSize) || 100;
  return storageGB * 0.0184; // Hot tier LRS pricing
}

function calculateGCPComputeCost(data: any): number {
  const machineTypes: Record<string, number> = {
    'e2-micro': 6.11,
    'e2-small': 12.23,
    'e2-medium': 24.45,
    'n1-standard-1': 24.27,
    'n1-standard-2': 48.55
  };
  
  return machineTypes[data?.machineType] || 35.00;
}

function calculateGCPStorageCost(data: any): number {
  const storageGB = parseInt(data?.storageSize) || 100;
  return storageGB * 0.020; // Standard storage pricing
}

// Recommendation generation functions
function generateEC2Recommendations(component: any, index: number) {
  const recommendations = [];
  const data = component.data || {};

  // Right-sizing recommendation
  if (data.instanceType && (data.instanceType.includes('large') || data.instanceType.includes('xlarge'))) {
    recommendations.push({
      id: `ec2-rightsizing-${index}`,
      type: 'savings',
      priority: 'high',
      title: 'Right-size EC2 Instance',
      description: 'Your current instance type may be over-provisioned. Consider downsizing to a smaller instance type.',
      currentCost: calculateEC2Cost(data),
      potentialSavings: calculateEC2Cost(data) * 0.4,
      implementationEffort: 'medium',
      timeToImplement: '30 minutes',
      impact: 'Reduce monthly costs by 40% without performance impact',
      steps: [
        'Monitor current CPU and memory utilization over 2 weeks',
        'Identify peak usage patterns and requirements',
        'Select appropriate smaller instance type (e.g., t3.medium → t3.small)',
        'Schedule maintenance window for instance resize',
        'Create AMI backup before resizing',
        'Stop instance and change instance type',
        'Start instance and verify application performance',
        'Monitor for 1 week to ensure stability'
      ],
      component: 'EC2 Instance',
      provider: 'AWS',
      region: data.region || 'us-east-1',
      applied: false
    });
  }

  // Spot instances recommendation
  if (!data.useSpotInstances) {
    recommendations.push({
      id: `ec2-spot-${index}`,
      type: 'savings',
      priority: 'medium',
      title: 'Use Spot Instances for Development',
      description: 'Save up to 90% by using Spot Instances for non-critical workloads.',
      currentCost: calculateEC2Cost(data),
      potentialSavings: calculateEC2Cost(data) * 0.7,
      implementationEffort: 'easy',
      timeToImplement: '15 minutes',
      impact: 'Reduce costs by 70% for fault-tolerant workloads',
      steps: [
        'Identify fault-tolerant applications suitable for Spot Instances',
        'Implement Spot Instance request with mixed instance types',
        'Configure Auto Scaling groups with Spot and On-Demand mix',
        'Set up CloudWatch monitoring for Spot Instance interruptions',
        'Test application behavior during Spot Instance termination'
      ],
      component: 'EC2 Instance',
      provider: 'AWS',
      region: data.region || 'us-east-1',
      applied: false
    });
  }

  return recommendations;
}

function generateS3Recommendations(component: any, index: number) {
  const recommendations = [];
  const data = component.data || {};

  // Lifecycle policy recommendation
  if (!data.lifecyclePolicy) {
    recommendations.push({
      id: `s3-lifecycle-${index}`,
      type: 'savings',
      priority: 'high',
      title: 'Implement S3 Lifecycle Policies',
      description: 'Automatically transition objects to cheaper storage classes to reduce costs.',
      currentCost: calculateS3Cost(data),
      potentialSavings: calculateS3Cost(data) * 0.6,
      implementationEffort: 'easy',
      timeToImplement: '10 minutes',
      impact: 'Reduce storage costs by 60% for infrequently accessed data',
      steps: [
        'Analyze access patterns for objects in the bucket',
        'Create lifecycle policy to transition to IA after 30 days',
        'Configure transition to Glacier after 90 days',
        'Set up deletion rules for expired objects',
        'Apply lifecycle policy to the S3 bucket',
        'Monitor cost reduction over the next month'
      ],
      component: 'S3 Bucket',
      provider: 'AWS',
      region: data.region || 'us-east-1',
      applied: false
    });
  }

  // Intelligent Tiering recommendation
  if (!data.intelligentTiering) {
    recommendations.push({
      id: `s3-intelligent-tiering-${index}`,
      type: 'efficiency',
      priority: 'medium',
      title: 'Enable S3 Intelligent Tiering',
      description: 'Automatically optimize storage costs by moving objects between access tiers.',
      currentCost: calculateS3Cost(data),
      potentialSavings: calculateS3Cost(data) * 0.3,
      implementationEffort: 'easy',
      timeToImplement: '5 minutes',
      impact: 'Automatic cost optimization with no performance impact',
      steps: [
        'Navigate to S3 bucket properties',
        'Enable Intelligent Tiering',
        'Configure monitoring and automation',
        'Review tiering policies and thresholds',
        'Monitor storage class transitions'
      ],
      component: 'S3 Bucket',
      provider: 'AWS',
      region: data.region || 'us-east-1',
      applied: false
    });
  }

  return recommendations;
}

function generateRDSRecommendations(component: any, index: number) {
  const recommendations = [];
  const data = component.data || {};

  // Multi-AZ optimization
  if (data.multiAZ !== false) {
    recommendations.push({
      id: `rds-multiaz-${index}`,
      type: 'savings',
      priority: 'medium',
      title: 'Disable Multi-AZ for Development',
      description: 'Save 50% on RDS costs by disabling Multi-AZ deployment for non-production databases.',
      currentCost: calculateRDSCost(data),
      potentialSavings: calculateRDSCost(data) * 0.5,
      implementationEffort: 'easy',
      timeToImplement: '20 minutes',
      impact: 'Reduce RDS costs by 50% for development environments',
      steps: [
        'Identify non-production RDS instances with Multi-AZ enabled',
        'Create snapshot backup before making changes',
        'Modify RDS instance to disable Multi-AZ deployment',
        'Monitor database performance after change',
        'Update disaster recovery procedures for development environment'
      ],
      component: 'RDS Database',
      provider: 'AWS',
      region: data.region || 'us-east-1',
      applied: false
    });
  }

  // Reserved Instance recommendation
  if (!data.reservedInstance) {
    recommendations.push({
      id: `rds-reserved-${index}`,
      type: 'savings',
      priority: 'high',
      title: 'Purchase RDS Reserved Instances',
      description: 'Save up to 60% by purchasing 1-year Reserved Instances for steady-state workloads.',
      currentCost: calculateRDSCost(data),
      potentialSavings: calculateRDSCost(data) * 0.6,
      implementationEffort: 'easy',
      timeToImplement: '10 minutes',
      impact: 'Immediate cost reduction with 1-year commitment',
      steps: [
        'Analyze RDS usage patterns over past 3 months',
        'Calculate potential savings with Reserved Instances',
        'Purchase 1-year No Upfront Reserved Instance',
        'Apply Reserved Instance to existing RDS instances',
        'Monitor cost savings in billing dashboard'
      ],
      component: 'RDS Database',
      provider: 'AWS',
      region: data.region || 'us-east-1',
      applied: false
    });
  }

  return recommendations;
}

function generateLambdaRecommendations(component: any, index: number) {
  const recommendations = [];
  const data = component.data || {};

  // Memory optimization
  if (parseInt(data.memorySize) > 512) {
    recommendations.push({
      id: `lambda-memory-${index}`,
      type: 'efficiency',
      priority: 'medium',
      title: 'Optimize Lambda Memory Allocation',
      description: 'Right-size Lambda memory allocation to balance performance and cost.',
      currentCost: calculateLambdaCost(data),
      potentialSavings: calculateLambdaCost(data) * 0.3,
      implementationEffort: 'easy',
      timeToImplement: '15 minutes',
      impact: 'Optimize performance-to-cost ratio',
      steps: [
        'Use AWS Lambda Power Tuning tool to analyze optimal memory',
        'Test function performance with different memory settings',
        'Monitor execution duration and cost metrics',
        'Adjust memory allocation based on optimal configuration',
        'Set up CloudWatch alarms for performance monitoring'
      ],
      component: 'Lambda Function',
      provider: 'AWS',
      region: data.region || 'us-east-1',
      applied: false
    });
  }

  return recommendations;
}

function generateVPCRecommendations(component: any, index: number) {
  const recommendations = [];
  const data = component.data || {};

  // NAT Gateway optimization
  recommendations.push({
    id: `vpc-nat-${index}`,
    type: 'savings',
    priority: 'medium',
    title: 'Optimize NAT Gateway Usage',
    description: 'Consider NAT Instances or VPC Endpoints to reduce NAT Gateway costs.',
    currentCost: calculateVPCCost(data),
    potentialSavings: calculateVPCCost(data) * 0.4,
    implementationEffort: 'medium',
    timeToImplement: '45 minutes',
    impact: 'Reduce networking costs by 40%',
    steps: [
      'Analyze current NAT Gateway traffic patterns',
      'Consider NAT Instances for low-traffic scenarios',
      'Implement VPC Endpoints for AWS services',
      'Configure route tables for optimal traffic flow',
      'Monitor data transfer costs after optimization'
    ],
    component: 'VPC Network',
    provider: 'AWS',
    region: data.region || 'us-east-1',
    applied: false
  });

  return recommendations;
}

function generateAzureVMRecommendations(component: any, index: number) {
  const recommendations = [];
  const data = component.data || {};

  // Reserved Instance recommendation
  recommendations.push({
    id: `azure-vm-reserved-${index}`,
    type: 'savings',
    priority: 'high',
    title: 'Purchase Azure Reserved VM Instances',
    description: 'Save up to 72% with 1-year or 3-year Azure Reserved VM Instances.',
    currentCost: calculateAzureVMCost(data),
    potentialSavings: calculateAzureVMCost(data) * 0.6,
    implementationEffort: 'easy',
    timeToImplement: '10 minutes',
    impact: 'Significant cost reduction with commitment',
    steps: [
      'Review VM usage patterns over past 3 months',
      'Calculate savings with Azure Reserved Instances',
      'Purchase appropriate Reserved Instance term',
      'Apply reservation to existing VMs',
      'Monitor cost savings in Azure Cost Management'
    ],
    component: 'Azure VM',
    provider: 'Azure',
    region: data.region || 'East US',
    applied: false
  });

  return recommendations;
}

function generateAzureStorageRecommendations(component: any, index: number) {
  const recommendations = [];
  const data = component.data || {};

  // Storage tier optimization
  recommendations.push({
    id: `azure-storage-tier-${index}`,
    type: 'savings',
    priority: 'medium',
    title: 'Optimize Azure Storage Tiers',
    description: 'Move infrequently accessed data to Cool or Archive storage tiers.',
    currentCost: calculateAzureStorageCost(data),
    potentialSavings: calculateAzureStorageCost(data) * 0.5,
    implementationEffort: 'easy',
    timeToImplement: '15 minutes',
    impact: 'Reduce storage costs by 50% for infrequent access',
    steps: [
      'Analyze blob access patterns using Azure Storage Analytics',
      'Implement lifecycle management policies',
      'Configure automatic tiering rules',
      'Move eligible data to Cool storage tier',
      'Set up monitoring for cost optimization'
    ],
    component: 'Azure Storage',
    provider: 'Azure',
    region: data.region || 'East US',
    applied: false
  });

  return recommendations;
}

function generateGCPComputeRecommendations(component: any, index: number) {
  const recommendations = [];
  const data = component.data || {};

  // Committed use discount
  recommendations.push({
    id: `gcp-compute-committed-${index}`,
    type: 'savings',
    priority: 'high',
    title: 'Purchase GCP Committed Use Discounts',
    description: 'Save up to 57% with 1-year or 3-year Committed Use Discounts.',
    currentCost: calculateGCPComputeCost(data),
    potentialSavings: calculateGCPComputeCost(data) * 0.5,
    implementationEffort: 'easy',
    timeToImplement: '10 minutes',
    impact: 'Substantial cost reduction with commitment',
    steps: [
      'Analyze Compute Engine usage patterns',
      'Purchase appropriate Committed Use Discount',
      'Apply discount to existing VM instances',
      'Monitor savings in Google Cloud Billing',
      'Plan future capacity with committed discounts'
    ],
    component: 'GCP Compute Engine',
    provider: 'GCP',
    region: data.region || 'us-central1',
    applied: false
  });

  return recommendations;
}

function generateGCPStorageRecommendations(component: any, index: number) {
  const recommendations = [];
  const data = component.data || {};

  // Storage class optimization
  recommendations.push({
    id: `gcp-storage-class-${index}`,
    type: 'savings',
    priority: 'medium',
    title: 'Optimize Google Cloud Storage Classes',
    description: 'Use appropriate storage classes based on access patterns.',
    currentCost: calculateGCPStorageCost(data),
    potentialSavings: calculateGCPStorageCost(data) * 0.4,
    implementationEffort: 'easy',
    timeToImplement: '15 minutes',
    impact: 'Reduce storage costs by 40% with optimal classes',
    steps: [
      'Analyze object access patterns in Cloud Storage',
      'Implement Object Lifecycle Management',
      'Configure automatic transitions to Nearline/Coldline',
      'Set up deletion policies for expired objects',
      'Monitor cost optimization results'
    ],
    component: 'GCP Cloud Storage',
    provider: 'GCP',
    region: data.region || 'us-central1',
    applied: false
  });

  return recommendations;
}

// Helper function to apply cost optimization recommendations
async function applyCostOptimization(pipeline: any, recommendationId: string, storage: any) {
  // This would typically integrate with cloud provider APIs to implement the changes
  // For now, we'll simulate the application of recommendations
  
  const components = Array.isArray(pipeline.components) ? pipeline.components : [];
  
  // Find and apply the specific recommendation
  let updatedComponents = [...components];
  let recommendationApplied = false;
  
  // Simulate applying optimization based on recommendation ID
  if (recommendationId.includes('ec2-rightsizing')) {
    updatedComponents = components.map(component => {
      if (component.type === 'aws-ec2') {
        return {
          ...component,
          data: {
            ...component.data,
            optimized: true,
            previousInstanceType: component.data?.instanceType,
            instanceType: 't3.small' // Example downsize
          }
        };
      }
      return component;
    });
    recommendationApplied = true;
  }
  
  if (recommendationId.includes('s3-lifecycle')) {
    updatedComponents = components.map(component => {
      if (component.type === 'aws-s3') {
        return {
          ...component,
          data: {
            ...component.data,
            optimized: true,
            lifecyclePolicy: true,
            lifecycleRules: [
              { transition: 'IA', days: 30 },
              { transition: 'Glacier', days: 90 }
            ]
          }
        };
      }
      return component;
    });
    recommendationApplied = true;
  }
  
  if (recommendationApplied) {
    // Update the pipeline in storage
    await storage.updatePipeline(pipeline.id, {
      ...pipeline,
      components: updatedComponents,
      updatedAt: new Date()
    });
    
    // Generate and update Terraform configuration
    const pipelineName = pipeline.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    // This would call the generateTerraformJson function and update files
    
    return {
      recommendationId,
      updatedComponents: updatedComponents.length,
      message: "Cost optimization has been applied to your pipeline configuration"
    };
  }
  
  return {
    error: "Recommendation not found or could not be applied"
  };
}

// Helper function to generate resource configuration for each component type
function generateResourceConfig(component: any, provider: string, index: number) {
  const config = component.data?.config || {};
  
  switch (provider) {
    case 'aws':
      return generateAWSResource(component, config, index);
    case 'azure':
      return generateAzureResource(component, config, index);
    case 'gcp':
      return generateGCPResource(component, config, index);
    default:
      return null;
  }
}

function generateAWSResource(component: any, config: any, index: number) {
  const type = component.data?.type;
  const resourceName = `${type}_${index + 1}`;

  switch (type) {
    case 'ec2':
      return {
        aws_instance: {
          [resourceName]: {
            ami: config.amiId || "ami-0c02fb55956c7d316",
            instance_type: config.machineType || "t2.micro",
            key_name: config.keyPair || null,
            security_groups: config.securityGroup ? [config.securityGroup] : null,
            subnet_id: config.subnetwork || null,
            availability_zone: config.zone || null,
            tags: {
              Name: config.instanceName || `EC2-Instance-${index + 1}`
            }
          }
        }
      };
    
    case 's3':
      return {
        aws_s3_bucket: {
          [resourceName]: {
            bucket: config.bucketName || `my-bucket-${Date.now()}`,
            tags: {
              Name: config.bucketName || `S3-Bucket-${index + 1}`
            }
          }
        }
      };
    
    case 'rds':
      return {
        aws_db_instance: {
          [resourceName]: {
            identifier: config.dbIdentifier || `mydb-${index + 1}`,
            engine: config.engine || "mysql",
            engine_version: config.engineVersion || "8.0",
            instance_class: config.instanceClass || "db.t3.micro",
            allocated_storage: parseInt(config.allocatedStorage) || 20,
            storage_type: config.storageType || "gp2",
            db_name: config.dbName || "mydb",
            username: config.username || "admin",
            password: config.password || "changeme123!",
            skip_final_snapshot: config.skipFinalSnapshot !== false,
            tags: {
              Name: config.dbIdentifier || `RDS-${index + 1}`
            }
          }
        }
      };
    
    case 'lambda':
      return {
        aws_lambda_function: {
          [resourceName]: {
            function_name: config.functionName || `lambda-function-${index + 1}`,
            runtime: config.runtime || "python3.9",
            handler: config.handler || "lambda_function.lambda_handler",
            filename: "lambda_function.zip",
            source_code_hash: "${filebase64sha256(\"lambda_function.zip\")}",
            role: "${aws_iam_role.lambda_role.arn}",
            tags: {
              Name: config.functionName || `Lambda-${index + 1}`
            }
          }
        }
      };
    
    case 'vpc':
      return {
        aws_vpc: {
          [resourceName]: {
            cidr_block: config.vpcCidrBlock || "10.0.0.0/16",
            enable_dns_hostnames: true,
            enable_dns_support: true,
            tags: {
              Name: config.vpcName || `VPC-${index + 1}`
            }
          }
        }
      };
    
    default:
      return null;
  }
}

function generateAzureResource(component: any, config: any, index: number) {
  const type = component.data?.type;
  const resourceName = `${type.replace('azure-', '')}_${index + 1}`;

  switch (type) {
    case 'azure-vm':
      return {
        azurerm_virtual_machine: {
          [resourceName]: {
            name: config.vmName || `vm-${index + 1}`,
            location: config.location || "East US",
            resource_group_name: "${azurerm_resource_group.main.name}",
            vm_size: config.vmSize || "Standard_B1s",
            tags: {
              Name: config.vmName || `Azure-VM-${index + 1}`
            }
          }
        }
      };
    
    case 'azure-storage':
      return {
        azurerm_storage_account: {
          [resourceName]: {
            name: config.storageAccountName || `storage${index + 1}${Date.now()}`,
            resource_group_name: "${azurerm_resource_group.main.name}",
            location: config.location || "East US",
            account_tier: config.accountTier || "Standard",
            account_replication_type: config.replicationType || "LRS",
            tags: {
              Name: config.storageAccountName || `Storage-${index + 1}`
            }
          }
        }
      };
    
    case 'azure-sql':
      return {
        azurerm_sql_database: {
          [resourceName]: {
            name: config.databaseName || `sqldb-${index + 1}`,
            resource_group_name: "${azurerm_resource_group.main.name}",
            location: config.location || "East US",
            server_name: "${azurerm_sql_server.main.name}",
            tags: {
              Name: config.databaseName || `Azure-SQL-${index + 1}`
            }
          }
        }
      };
    
    default:
      return null;
  }
}

function generateGCPResource(component: any, config: any, index: number) {
  const type = component.data?.type;
  const resourceName = `${type.replace('gcp-', '')}_${index + 1}`;

  switch (type) {
    case 'gcp-compute':
      return {
        google_compute_instance: {
          [resourceName]: {
            name: config.instanceName || `compute-instance-${index + 1}`,
            machine_type: config.machineType || "e2-micro",
            zone: config.zone || "us-central1-a",
            boot_disk: {
              initialize_params: {
                image: config.image || "debian-cloud/debian-11"
              }
            },
            network_interface: {
              network: "default",
              access_config: {}
            },
            labels: {
              name: config.instanceName || `gcp-compute-${index + 1}`
            }
          }
        }
      };
    
    case 'gcp-storage':
      return {
        google_storage_bucket: {
          [resourceName]: {
            name: config.bucketName || `gcp-bucket-${index + 1}-${Date.now()}`,
            location: config.location || "US",
            storage_class: config.storageClass || "STANDARD",
            labels: {
              name: config.bucketName || `gcp-storage-${index + 1}`
            }
          }
        }
      };
    
    case 'gcp-sql':
      return {
        google_sql_database_instance: {
          [resourceName]: {
            name: config.instanceName || `sql-instance-${index + 1}`,
            database_version: config.databaseVersion || "MYSQL_8_0",
            region: config.region || "us-central1",
            settings: {
              tier: config.tier || "db-f1-micro",
              disk_size: parseInt(config.diskSize) || 20,
              disk_type: config.diskType || "PD_SSD"
            }
          }
        }
      };
    
    default:
      return null;
  }
}



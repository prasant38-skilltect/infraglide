import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertPipelineSchema, insertDeploymentSchema, insertCredentialSchema } from "@shared/schema";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

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
${pipeline.components.length} components configured

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

  app.put("/api/pipelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.delete("/api/pipelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get pipeline info before deletion for directory cleanup
      const pipeline = await storage.getPipeline(id);
      
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

  function generateMockResources(provider: string, accountName: string) {
    const baseResources = [];
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

  // Terraform generation route
  app.post("/api/generate-terraform", async (req, res) => {
    try {
      const { pipelineName, components, provider, oldPipelineName } = req.body;
      
      if (!pipelineName || !components || !provider) {
        return res.status(400).json({ error: "Missing required fields: pipelineName, components, provider" });
      }

      const terraformJson = generateTerraformJson(components, provider);
      
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

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate Terraform JSON configuration
function generateTerraformJson(components: any[], provider: string) {
  const terraformConfig: any = {
    terraform: {
      required_providers: {}
    },
    provider: {},
    resource: {}
  };

  // Configure provider-specific settings
  switch (provider) {
    case 'aws':
      terraformConfig.terraform.required_providers.aws = {
        source: "hashicorp/aws",
        version: "~> 5.0"
      };
      terraformConfig.provider.aws = {
        region: "us-east-1"
      };
      break;
    case 'azure':
      terraformConfig.terraform.required_providers.azurerm = {
        source: "hashicorp/azurerm",
        version: "~> 3.0"
      };
      terraformConfig.provider.azurerm = {
        features: {}
      };
      break;
    case 'gcp':
      terraformConfig.terraform.required_providers.google = {
        source: "hashicorp/google",
        version: "~> 4.0"
      };
      terraformConfig.provider.google = {
        project: "my-project-id",
        region: "us-central1"
      };
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



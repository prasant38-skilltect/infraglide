import { 
  projects, 
  pipelines, 
  deployments,
  credentials,
  type Project, 
  type Pipeline, 
  type Deployment,
  type Credential,
  type InsertProject, 
  type InsertPipeline, 
  type InsertDeployment,
  type InsertCredential
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Pipelines
  getPipelines(projectId?: number): Promise<Pipeline[]>;
  getPipeline(id: number): Promise<Pipeline | undefined>;
  getPipelinesByName(name: string): Promise<Pipeline[]>;
  createPipeline(pipeline: InsertPipeline): Promise<Pipeline>;
  updatePipeline(id: number, pipeline: Partial<InsertPipeline>): Promise<Pipeline | undefined>;
  deletePipeline(id: number): Promise<boolean>;

  // Deployments
  getDeployments(pipelineId?: number): Promise<Deployment[]>;
  getDeployment(id: number): Promise<Deployment | undefined>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: number, deployment: Partial<InsertDeployment>): Promise<Deployment | undefined>;

  // Credentials
  getCredentials(): Promise<Credential[]>;
  getCredential(id: number): Promise<Credential | undefined>;
  createCredential(credential: InsertCredential): Promise<Credential>;
  updateCredential(id: number, credential: Partial<InsertCredential>): Promise<Credential | undefined>;
  deleteCredential(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project>;
  private pipelines: Map<number, Pipeline>;
  private deployments: Map<number, Deployment>;
  private credentials: Map<number, Credential>;
  private currentProjectId: number;
  private currentPipelineId: number;
  private currentDeploymentId: number;
  private currentCredentialId: number;

  constructor() {
    this.projects = new Map();
    this.pipelines = new Map();
    this.deployments = new Map();
    this.credentials = new Map();
    this.currentProjectId = 1;
    this.currentPipelineId = 1;
    this.currentDeploymentId = 1;
    this.currentCredentialId = 1;

    // Create default project
    this.createProject({
      name: "Default Project",
      description: "Default project for pipelines"
    });
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = {
      ...insertProject,
      id,
      description: insertProject.description || null,
      createdAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, insertProject: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject: Project = { ...project, ...insertProject };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Pipelines
  async getPipelines(projectId?: number): Promise<Pipeline[]> {
    const allPipelines = Array.from(this.pipelines.values());
    if (projectId) {
      return allPipelines.filter(pipeline => pipeline.projectId === projectId);
    }
    return allPipelines;
  }

  async getPipeline(id: number): Promise<Pipeline | undefined> {
    return this.pipelines.get(id);
  }

  async getPipelinesByName(name: string): Promise<Pipeline[]> {
    const allPipelines = Array.from(this.pipelines.values());
    return allPipelines.filter(pipeline => pipeline.name === name);
  }

  async createPipeline(insertPipeline: InsertPipeline): Promise<Pipeline> {
    const id = this.currentPipelineId++;
    const now = new Date();
    const pipeline: Pipeline = {
      ...insertPipeline,
      id,
      name: insertPipeline.name,
      description: insertPipeline.description || null,
      version: insertPipeline.version || 1,
      region: insertPipeline.region || "us-east-1",
      status: insertPipeline.status || "draft",
      projectId: insertPipeline.projectId || null,
      components: insertPipeline.components || [],
      connections: insertPipeline.connections || [],
      snapshot: insertPipeline.snapshot || null,
      credentialName: insertPipeline.credentialName || null,
      credentialUsername: insertPipeline.credentialUsername || null,
      credentialPassword: insertPipeline.credentialPassword || null,
      isTemplate: insertPipeline.isTemplate || false,
      createdAt: now,
      updatedAt: now,
    };
    this.pipelines.set(id, pipeline);
    return pipeline;
  }

  async updatePipeline(id: number, insertPipeline: Partial<InsertPipeline>): Promise<Pipeline | undefined> {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return undefined;

    const updatedPipeline: Pipeline = { 
      ...pipeline, 
      ...insertPipeline,
      updatedAt: new Date()
    };
    this.pipelines.set(id, updatedPipeline);
    return updatedPipeline;
  }

  async deletePipeline(id: number): Promise<boolean> {
    return this.pipelines.delete(id);
  }

  // Deployments
  async getDeployments(pipelineId?: number): Promise<Deployment[]> {
    const allDeployments = Array.from(this.deployments.values());
    if (pipelineId) {
      return allDeployments.filter(deployment => deployment.pipelineId === pipelineId);
    }
    return allDeployments;
  }

  async getDeployment(id: number): Promise<Deployment | undefined> {
    return this.deployments.get(id);
  }

  async createDeployment(insertDeployment: InsertDeployment): Promise<Deployment> {
    const id = this.currentDeploymentId++;
    const deployment: Deployment = {
      ...insertDeployment,
      id,
      status: insertDeployment.status || "pending",
      environment: insertDeployment.environment || "development",
      notes: insertDeployment.notes || null,
      validateConfig: insertDeployment.validateConfig || true,
      dryRun: insertDeployment.dryRun || false,
      notifications: insertDeployment.notifications || true,
      createdAt: new Date(),
    };
    this.deployments.set(id, deployment);
    return deployment;
  }

  async updateDeployment(id: number, insertDeployment: Partial<InsertDeployment>): Promise<Deployment | undefined> {
    const deployment = this.deployments.get(id);
    if (!deployment) return undefined;

    const updatedDeployment: Deployment = { ...deployment, ...insertDeployment };
    this.deployments.set(id, updatedDeployment);
    return updatedDeployment;
  }

  // Credentials
  async getCredentials(): Promise<Credential[]> {
    return Array.from(this.credentials.values());
  }

  async getCredential(id: number): Promise<Credential | undefined> {
    return this.credentials.get(id);
  }

  async createCredential(insertCredential: InsertCredential): Promise<Credential> {
    const id = this.currentCredentialId++;
    const now = new Date();
    const credential: Credential = {
      ...insertCredential,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.credentials.set(id, credential);
    return credential;
  }

  async updateCredential(id: number, insertCredential: Partial<InsertCredential>): Promise<Credential | undefined> {
    const credential = this.credentials.get(id);
    if (!credential) return undefined;

    const updatedCredential: Credential = { 
      ...credential, 
      ...insertCredential,
      updatedAt: new Date()
    };
    this.credentials.set(id, updatedCredential);
    return updatedCredential;
  }

  async deleteCredential(id: number): Promise<boolean> {
    return this.credentials.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, insertProject: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(insertProject)
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Pipelines
  async getPipelines(projectId?: number): Promise<Pipeline[]> {
    if (projectId) {
      return db.select().from(pipelines).where(eq(pipelines.projectId, projectId));
    }
    return db.select().from(pipelines);
  }

  async getPipeline(id: number): Promise<Pipeline | undefined> {
    const [pipeline] = await db.select().from(pipelines).where(eq(pipelines.id, id));
    return pipeline || undefined;
  }

  async getPipelinesByName(name: string): Promise<Pipeline[]> {
    return db.select().from(pipelines).where(eq(pipelines.name, name));
  }

  async createPipeline(insertPipeline: InsertPipeline): Promise<Pipeline> {
    const [pipeline] = await db
      .insert(pipelines)
      .values(insertPipeline)
      .returning();
    return pipeline;
  }

  async updatePipeline(id: number, insertPipeline: Partial<InsertPipeline>): Promise<Pipeline | undefined> {
    const [pipeline] = await db
      .update(pipelines)
      .set({ ...insertPipeline, updatedAt: new Date() })
      .where(eq(pipelines.id, id))
      .returning();
    return pipeline || undefined;
  }

  async deletePipeline(id: number): Promise<boolean> {
    const result = await db.delete(pipelines).where(eq(pipelines.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Deployments
  async getDeployments(pipelineId?: number): Promise<Deployment[]> {
    if (pipelineId) {
      return db.select().from(deployments).where(eq(deployments.pipelineId, pipelineId));
    }
    return db.select().from(deployments);
  }

  async getDeployment(id: number): Promise<Deployment | undefined> {
    const [deployment] = await db.select().from(deployments).where(eq(deployments.id, id));
    return deployment || undefined;
  }

  async createDeployment(insertDeployment: InsertDeployment): Promise<Deployment> {
    const [deployment] = await db
      .insert(deployments)
      .values(insertDeployment)
      .returning();
    return deployment;
  }

  async updateDeployment(id: number, insertDeployment: Partial<InsertDeployment>): Promise<Deployment | undefined> {
    const [deployment] = await db
      .update(deployments)
      .set(insertDeployment)
      .where(eq(deployments.id, id))
      .returning();
    return deployment || undefined;
  }

  // Credentials
  async getCredentials(): Promise<Credential[]> {
    return db.select().from(credentials);
  }

  async getCredential(id: number): Promise<Credential | undefined> {
    const [credential] = await db.select().from(credentials).where(eq(credentials.id, id));
    return credential || undefined;
  }

  async createCredential(insertCredential: InsertCredential): Promise<Credential> {
    const [credential] = await db
      .insert(credentials)
      .values(insertCredential)
      .returning();
    return credential;
  }

  async updateCredential(id: number, insertCredential: Partial<InsertCredential>): Promise<Credential | undefined> {
    const [credential] = await db
      .update(credentials)
      .set({ ...insertCredential, updatedAt: new Date() })
      .where(eq(credentials.id, id))
      .returning();
    return credential || undefined;
  }

  async deleteCredential(id: number): Promise<boolean> {
    const result = await db.delete(credentials).where(eq(credentials.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();

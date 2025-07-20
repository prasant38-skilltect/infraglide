import { 
  users, 
  cloudProviders, 
  pipelines, 
  deployments, 
  resources,
  type User, 
  type InsertUser,
  type CloudProvider,
  type InsertCloudProvider,
  type Pipeline,
  type InsertPipeline,
  type Deployment,
  type InsertDeployment,
  type Resource,
  type InsertResource
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Cloud Providers
  getCloudProviders(userId: number): Promise<CloudProvider[]>;
  createCloudProvider(provider: InsertCloudProvider): Promise<CloudProvider>;
  updateCloudProvider(id: number, provider: Partial<InsertCloudProvider>): Promise<CloudProvider | undefined>;
  deleteCloudProvider(id: number): Promise<boolean>;

  // Pipelines
  getPipelines(userId: number): Promise<Pipeline[]>;
  getPipeline(id: number): Promise<Pipeline | undefined>;
  createPipeline(pipeline: InsertPipeline): Promise<Pipeline>;
  updatePipeline(id: number, pipeline: Partial<InsertPipeline>): Promise<Pipeline | undefined>;
  deletePipeline(id: number): Promise<boolean>;

  // Deployments
  getDeployments(pipelineId: number): Promise<Deployment[]>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: number, deployment: Partial<InsertDeployment>): Promise<Deployment | undefined>;

  // Resources
  getResources(userId: number): Promise<Resource[]>;
  getResourcesByPipeline(pipelineId: number): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Cloud Providers
  async getCloudProviders(userId: number): Promise<CloudProvider[]> {
    return await db
      .select()
      .from(cloudProviders)
      .where(eq(cloudProviders.userId, userId))
      .orderBy(desc(cloudProviders.createdAt));
  }

  async createCloudProvider(provider: InsertCloudProvider): Promise<CloudProvider> {
    const [newProvider] = await db
      .insert(cloudProviders)
      .values(provider)
      .returning();
    return newProvider;
  }

  async updateCloudProvider(id: number, provider: Partial<InsertCloudProvider>): Promise<CloudProvider | undefined> {
    const [updated] = await db
      .update(cloudProviders)
      .set(provider)
      .where(eq(cloudProviders.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCloudProvider(id: number): Promise<boolean> {
    const result = await db
      .delete(cloudProviders)
      .where(eq(cloudProviders.id, id));
    return result.rowCount > 0;
  }

  // Pipelines
  async getPipelines(userId: number): Promise<Pipeline[]> {
    return await db
      .select()
      .from(pipelines)
      .where(eq(pipelines.userId, userId))
      .orderBy(desc(pipelines.updatedAt));
  }

  async getPipeline(id: number): Promise<Pipeline | undefined> {
    const [pipeline] = await db
      .select()
      .from(pipelines)
      .where(eq(pipelines.id, id));
    return pipeline || undefined;
  }

  async createPipeline(pipeline: InsertPipeline): Promise<Pipeline> {
    const [newPipeline] = await db
      .insert(pipelines)
      .values(pipeline)
      .returning();
    return newPipeline;
  }

  async updatePipeline(id: number, pipeline: Partial<InsertPipeline>): Promise<Pipeline | undefined> {
    const [updated] = await db
      .update(pipelines)
      .set({ ...pipeline, updatedAt: new Date() })
      .where(eq(pipelines.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePipeline(id: number): Promise<boolean> {
    const result = await db
      .delete(pipelines)
      .where(eq(pipelines.id, id));
    return result.rowCount > 0;
  }

  // Deployments
  async getDeployments(pipelineId: number): Promise<Deployment[]> {
    return await db
      .select()
      .from(deployments)
      .where(eq(deployments.pipelineId, pipelineId))
      .orderBy(desc(deployments.startedAt));
  }

  async createDeployment(deployment: InsertDeployment): Promise<Deployment> {
    const [newDeployment] = await db
      .insert(deployments)
      .values(deployment)
      .returning();
    return newDeployment;
  }

  async updateDeployment(id: number, deployment: Partial<InsertDeployment>): Promise<Deployment | undefined> {
    const [updated] = await db
      .update(deployments)
      .set(deployment)
      .where(eq(deployments.id, id))
      .returning();
    return updated || undefined;
  }

  // Resources
  async getResources(userId: number): Promise<Resource[]> {
    return await db
      .select()
      .from(resources)
      .innerJoin(pipelines, eq(resources.pipelineId, pipelines.id))
      .where(eq(pipelines.userId, userId))
      .orderBy(desc(resources.createdAt));
  }

  async getResourcesByPipeline(pipelineId: number): Promise<Resource[]> {
    return await db
      .select()
      .from(resources)
      .where(eq(resources.pipelineId, pipelineId))
      .orderBy(desc(resources.createdAt));
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db
      .insert(resources)
      .values(resource)
      .returning();
    return newResource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const [updated] = await db
      .update(resources)
      .set(resource)
      .where(eq(resources.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteResource(id: number): Promise<boolean> {
    const result = await db
      .delete(resources)
      .where(eq(resources.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();

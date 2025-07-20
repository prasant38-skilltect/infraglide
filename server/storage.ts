import { 
  projects, 
  pipelines, 
  deployments,
  credentials,
  users,
  sessions,
  ldapConfig,
  type Project, 
  type Pipeline, 
  type Deployment,
  type Credential,
  type User,
  type Session,
  type LdapConfig,
  type InsertProject, 
  type InsertPipeline, 
  type InsertDeployment,
  type InsertCredential,
  type InsertUser,
  type InsertSession,
  type InsertLdapConfig
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Sessions
  getSessions(): Promise<Session[]>;
  getSessionById(id: string): Promise<Session | undefined>;
  getSessionsByUserId(userId: number): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  deleteSession(id: string): Promise<boolean>;
  cleanupExpiredSessions(): Promise<void>;

  // LDAP Configuration
  getLdapConfigs(): Promise<LdapConfig[]>;
  getLdapConfigById(id: number): Promise<LdapConfig | undefined>;
  createLdapConfig(config: InsertLdapConfig): Promise<LdapConfig>;
  updateLdapConfig(id: number, config: Partial<InsertLdapConfig>): Promise<LdapConfig | undefined>;
  deleteLdapConfig(id: number): Promise<boolean>;

  // Projects
  getProjects(userId?: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Pipelines
  getPipelines(projectId?: number, userId?: number): Promise<Pipeline[]>;
  getPipeline(id: number): Promise<Pipeline | undefined>;
  getPipelinesByName(name: string, userId?: number): Promise<Pipeline[]>;
  createPipeline(pipeline: InsertPipeline): Promise<Pipeline>;
  updatePipeline(id: number, pipeline: Partial<InsertPipeline>): Promise<Pipeline | undefined>;
  deletePipeline(id: number): Promise<boolean>;

  // Deployments
  getDeployments(pipelineId?: number): Promise<Deployment[]>;
  getDeployment(id: number): Promise<Deployment | undefined>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: number, deployment: Partial<InsertDeployment>): Promise<Deployment | undefined>;

  // Credentials
  getCredentials(userId?: number): Promise<Credential[]>;
  getCredential(id: number): Promise<Credential | undefined>;
  createCredential(credential: InsertCredential): Promise<Credential>;
  updateCredential(id: number, credential: Partial<InsertCredential>): Promise<Credential | undefined>;
  deleteCredential(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<string, Session>;
  private ldapConfigs: Map<number, LdapConfig>;
  private projects: Map<number, Project>;
  private pipelines: Map<number, Pipeline>;
  private deployments: Map<number, Deployment>;
  private credentials: Map<number, Credential>;
  private currentUserId: number;
  private currentLdapConfigId: number;
  private currentProjectId: number;
  private currentPipelineId: number;
  private currentDeploymentId: number;
  private currentCredentialId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.ldapConfigs = new Map();
    this.projects = new Map();
    this.pipelines = new Map();
    this.deployments = new Map();
    this.credentials = new Map();
    this.currentUserId = 1;
    this.currentLdapConfigId = 1;
    this.currentProjectId = 1;
    this.currentPipelineId = 1;
    this.currentDeploymentId = 1;
    this.currentCredentialId = 1;

    // Create default admin user
    this.createUser({
      email: "admin@infraglide.com",
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      passwordHash: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUyYzFo1oQq/BQe", // password: admin123
      authProvider: "local",
      isActive: true,
      isAdmin: true,
    });
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...userData,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Session methods
  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async getSessionById(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getSessionsByUserId(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      ...insertSession,
      createdAt: new Date(),
    };
    this.sessions.set(insertSession.id, session);
    return session;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
      }
    }
  }

  // LDAP Configuration methods
  async getLdapConfigs(): Promise<LdapConfig[]> {
    return Array.from(this.ldapConfigs.values());
  }

  async getLdapConfigById(id: number): Promise<LdapConfig | undefined> {
    return this.ldapConfigs.get(id);
  }

  async createLdapConfig(insertConfig: InsertLdapConfig): Promise<LdapConfig> {
    const id = this.currentLdapConfigId++;
    const now = new Date();
    const config: LdapConfig = {
      ...insertConfig,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.ldapConfigs.set(id, config);
    return config;
  }

  async updateLdapConfig(id: number, configData: Partial<InsertLdapConfig>): Promise<LdapConfig | undefined> {
    const config = this.ldapConfigs.get(id);
    if (!config) return undefined;

    const updatedConfig: LdapConfig = {
      ...config,
      ...configData,
      updatedAt: new Date(),
    };
    this.ldapConfigs.set(id, updatedConfig);
    return updatedConfig;
  }

  async deleteLdapConfig(id: number): Promise<boolean> {
    return this.ldapConfigs.delete(id);
  }

  // Projects
  async getProjects(userId?: number): Promise<Project[]> {
    const allProjects = Array.from(this.projects.values());
    if (userId) {
      return allProjects.filter(project => project.userId === userId);
    }
    return allProjects;
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
  async getPipelines(projectId?: number, userId?: number): Promise<Pipeline[]> {
    const allPipelines = Array.from(this.pipelines.values());
    let filteredPipelines = allPipelines;
    
    if (projectId) {
      filteredPipelines = filteredPipelines.filter(pipeline => pipeline.projectId === projectId);
    }
    
    if (userId) {
      filteredPipelines = filteredPipelines.filter(pipeline => pipeline.userId === userId);
    }
    
    return filteredPipelines;
  }

  async getPipeline(id: number): Promise<Pipeline | undefined> {
    return this.pipelines.get(id);
  }

  async getPipelinesByName(name: string, userId?: number): Promise<Pipeline[]> {
    const allPipelines = Array.from(this.pipelines.values());
    let filteredPipelines = allPipelines.filter(pipeline => pipeline.name === name);
    
    if (userId) {
      filteredPipelines = filteredPipelines.filter(pipeline => pipeline.userId === userId);
    }
    
    return filteredPipelines;
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
      provider: insertPipeline.provider || "aws",
      region: insertPipeline.region || "us-east-1",
      status: insertPipeline.status || "draft",
      projectId: insertPipeline.projectId || null,
      components: insertPipeline.components || [],
      connections: insertPipeline.connections || [],
      snapshot: insertPipeline.snapshot || null,
      credentialId: insertPipeline.credentialId || null,
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
  async getCredentials(userId?: number): Promise<Credential[]> {
    const allCredentials = Array.from(this.credentials.values());
    if (userId) {
      return allCredentials.filter(credential => credential.userId === userId);
    }
    return allCredentials;
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
  // Users
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Sessions
  async getSessions(): Promise<Session[]> {
    return db.select().from(sessions);
  }

  async getSessionById(id: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions).where(eq(sessions.id, id));
    return result[0];
  }

  async getSessionsByUserId(userId: number): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.userId, userId));
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.id, id));
    return result.rowCount > 0;
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(eq(sessions.expiresAt, new Date()));
  }

  // LDAP Configuration
  async getLdapConfigs(): Promise<LdapConfig[]> {
    return db.select().from(ldapConfig);
  }

  async getLdapConfigById(id: number): Promise<LdapConfig | undefined> {
    const result = await db.select().from(ldapConfig).where(eq(ldapConfig.id, id));
    return result[0];
  }

  async createLdapConfig(insertConfig: InsertLdapConfig): Promise<LdapConfig> {
    const [config] = await db
      .insert(ldapConfig)
      .values(insertConfig)
      .returning();
    return config;
  }

  async updateLdapConfig(id: number, configData: Partial<InsertLdapConfig>): Promise<LdapConfig | undefined> {
    const [config] = await db
      .update(ldapConfig)
      .set({ ...configData, updatedAt: new Date() })
      .where(eq(ldapConfig.id, id))
      .returning();
    return config;
  }

  async deleteLdapConfig(id: number): Promise<boolean> {
    const result = await db.delete(ldapConfig).where(eq(ldapConfig.id, id));
    return result.rowCount > 0;
  }

  // Projects
  async getProjects(userId?: number): Promise<Project[]> {
    if (userId) {
      return db.select().from(projects).where(eq(projects.userId, userId));
    }
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
  async getPipelines(projectId?: number, userId?: number): Promise<Pipeline[]> {
    let query = db.select().from(pipelines);
    
    if (projectId && userId) {
      return db.select().from(pipelines)
        .where(eq(pipelines.projectId, projectId))
        .where(eq(pipelines.userId, userId));
    } else if (projectId) {
      return db.select().from(pipelines).where(eq(pipelines.projectId, projectId));
    } else if (userId) {
      return db.select().from(pipelines).where(eq(pipelines.userId, userId));
    }
    
    return db.select().from(pipelines);
  }

  async getPipeline(id: number): Promise<Pipeline | undefined> {
    const [pipeline] = await db.select().from(pipelines).where(eq(pipelines.id, id));
    return pipeline || undefined;
  }

  async getPipelinesByName(name: string, userId?: number): Promise<Pipeline[]> {
    if (userId) {
      return db.select().from(pipelines)
        .where(eq(pipelines.name, name))
        .where(eq(pipelines.userId, userId));
    }
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
  async getCredentials(userId?: number): Promise<Credential[]> {
    if (userId) {
      return db.select().from(credentials).where(eq(credentials.userId, userId));
    }
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

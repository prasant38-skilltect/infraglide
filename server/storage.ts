import { 
  projects, 
  pipelines, 
  deployments,
  credentials,
  users,
  sessions,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  resourcePermissions,
  type Project, 
  type Pipeline, 
  type Deployment,
  type Credential,
  type User,
  type Session,
  type Role,
  type Permission,
  type RolePermission,
  type UserRole,
  type ResourcePermission,
  type InsertProject, 
  type InsertPipeline, 
  type InsertDeployment,
  type InsertCredential,
  type InsertUser,
  type InsertSession,
  type InsertRole,
  type InsertPermission,
  type InsertRolePermission,
  type InsertUserRole,
  type InsertResourcePermission
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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

  // LDAP Configuration removed for email-based authentication

  // Projects
  getProjects(userId?: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject & { userId: number }): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Pipelines
  getPipelines(projectId?: number, userId?: number): Promise<Pipeline[]>;
  getPipeline(id: number): Promise<Pipeline | undefined>;
  getPipelinesByName(name: string, userId?: number): Promise<Pipeline[]>;
  getPipelineVersions(name: string, userId?: number): Promise<Pipeline[]>;
  createPipeline(pipeline: InsertPipeline & { userId: number }): Promise<Pipeline>;
  createPipelineVersion(pipeline: InsertPipeline & { userId: number }, parentId: number): Promise<Pipeline>;
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
  createCredential(credential: InsertCredential & { userId: number }): Promise<Credential>;
  updateCredential(id: number, credential: Partial<InsertCredential>): Promise<Credential | undefined>;
  deleteCredential(id: number): Promise<boolean>;

  // RBAC - Roles
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;

  // RBAC - Permissions
  getPermissions(): Promise<Permission[]>;
  getPermission(id: number): Promise<Permission | undefined>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined>;
  deletePermission(id: number): Promise<boolean>;

  // RBAC - Role Permissions
  getRolePermissions(roleId?: number): Promise<RolePermission[]>;
  createRolePermission(rolePermission: InsertRolePermission): Promise<RolePermission>;
  deleteRolePermission(roleId: number, permissionId: number): Promise<boolean>;

  // RBAC - User Roles
  getUserRoles(userId?: number): Promise<UserRole[]>;
  createUserRole(userRole: InsertUserRole): Promise<UserRole>;
  deleteUserRole(userId: number, roleId: number): Promise<boolean>;

  // RBAC - Resource Permissions
  getResourcePermissions(userId?: number, resource?: string): Promise<ResourcePermission[]>;
  createResourcePermission(resourcePermission: InsertResourcePermission): Promise<ResourcePermission>;
  deleteResourcePermission(id: number): Promise<boolean>;

  // RBAC - Helper Methods
  getUserPermissions(userId: number): Promise<Permission[]>;
  hasPermission(userId: number, resource: string, action: string, resourceId?: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<string, Session>;

  private projects: Map<number, Project>;
  private pipelines: Map<number, Pipeline>;
  private deployments: Map<number, Deployment>;
  private credentials: Map<number, Credential>;
  private roles: Map<number, Role>;
  private permissions: Map<number, Permission>;
  private rolePermissions: Map<number, RolePermission>;
  private userRoles: Map<number, UserRole>;
  private resourcePermissions: Map<number, ResourcePermission>;
  private currentUserId: number;

  private currentProjectId: number;
  private currentPipelineId: number;
  private currentDeploymentId: number;
  private currentCredentialId: number;
  private currentRoleId: number;
  private currentPermissionId: number;
  private currentRolePermissionId: number;
  private currentUserRoleId: number;
  private currentResourcePermissionId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();

    this.projects = new Map();
    this.pipelines = new Map();
    this.deployments = new Map();
    this.credentials = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.rolePermissions = new Map();
    this.userRoles = new Map();
    this.resourcePermissions = new Map();
    this.currentUserId = 1;

    this.currentProjectId = 1;
    this.currentPipelineId = 1;
    this.currentDeploymentId = 1;
    this.currentCredentialId = 1;
    this.currentRoleId = 1;
    this.currentPermissionId = 1;
    this.currentRolePermissionId = 1;
    this.currentUserRoleId = 1;
    this.currentResourcePermissionId = 1;

    // Create default admin user
    this.createUser({
      email: "admin@infraglide.com",
      username: "admin",
      fullName: "Admin User",
      password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUyYzFo1oQq/BQe", // password: admin123
      isAdmin: true,
      isActive: true,
      authProvider: "email",
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
      isAdmin: insertUser.isAdmin ?? null,
      isActive: insertUser.isActive ?? true,
      lastLoginAt: insertUser.lastLoginAt ?? null,
      authProvider: insertUser.authProvider ?? "email",
      createdAt: now,
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
    for (const [id, session] of Array.from(this.sessions.entries())) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
      }
    }
  }

  // LDAP Configuration methods
  // LDAP methods removed - email-based authentication only

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

  async createProject(insertProject: InsertProject & { userId: number }): Promise<Project> {
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

  async createPipeline(insertPipeline: InsertPipeline & { userId: number }): Promise<Pipeline> {
    const id = this.currentPipelineId++;
    const now = new Date();
    const pipeline: Pipeline = {
      ...insertPipeline,
      id,
      description: insertPipeline.description ?? null,
      version: insertPipeline.version || 1,
      status: insertPipeline.status || "draft",
      projectId: insertPipeline.projectId || null,
      provider: insertPipeline.provider || "aws",
      region: insertPipeline.region || "us-east-1",
      components: insertPipeline.components || {},
      connections: insertPipeline.connections || {},
      parentPipelineId: insertPipeline.parentPipelineId ?? null,
      isLatestVersion: insertPipeline.isLatestVersion ?? null,
      versionNotes: insertPipeline.versionNotes ?? null,
      snapshot: insertPipeline.snapshot ?? null,
      credentialId: insertPipeline.credentialId ?? null,
      credentialName: insertPipeline.credentialName ?? null,
      credentialUsername: insertPipeline.credentialUsername ?? null,
      credentialPassword: insertPipeline.credentialPassword ?? null,
      isTemplate: insertPipeline.isTemplate ?? null,
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

  async createCredential(insertCredential: InsertCredential & { userId: number }): Promise<Credential> {
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

  // Missing pipeline methods
  async getPipelineVersions(name: string, userId?: number): Promise<Pipeline[]> {
    return this.getPipelinesByName(name, userId);
  }

  async createPipelineVersion(insertPipeline: InsertPipeline & { userId: number }, parentId: number): Promise<Pipeline> {
    const pipeline = await this.createPipeline({
      ...insertPipeline,
      parentPipelineId: parentId,
    });
    return pipeline;
  }

  // RBAC - Roles
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = this.currentRoleId++;
    const role: Role = {
      ...insertRole,
      id,
      description: insertRole.description ?? null,
      isSystem: insertRole.isSystem ?? null,
      createdAt: new Date(),
    };
    this.roles.set(id, role);
    return role;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | undefined> {
    const role = this.roles.get(id);
    if (!role) return undefined;

    const updatedRole: Role = { ...role, ...roleData };
    this.roles.set(id, updatedRole);
    return updatedRole;
  }

  async deleteRole(id: number): Promise<boolean> {
    return this.roles.delete(id);
  }

  // RBAC - Permissions
  async getPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    return this.permissions.get(id);
  }

  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const id = this.currentPermissionId++;
    const permission: Permission = {
      ...insertPermission,
      id,
      description: insertPermission.description ?? null,
      createdAt: new Date(),
    };
    this.permissions.set(id, permission);
    return permission;
  }

  async updatePermission(id: number, permissionData: Partial<InsertPermission>): Promise<Permission | undefined> {
    const permission = this.permissions.get(id);
    if (!permission) return undefined;

    const updatedPermission: Permission = { ...permission, ...permissionData };
    this.permissions.set(id, updatedPermission);
    return updatedPermission;
  }

  async deletePermission(id: number): Promise<boolean> {
    return this.permissions.delete(id);
  }

  // RBAC - Role Permissions
  async getRolePermissions(roleId?: number): Promise<RolePermission[]> {
    const allRolePermissions = Array.from(this.rolePermissions.values());
    if (roleId) {
      return allRolePermissions.filter(rp => rp.roleId === roleId);
    }
    return allRolePermissions;
  }

  async createRolePermission(insertRolePermission: InsertRolePermission): Promise<RolePermission> {
    const id = this.currentRolePermissionId++;
    const rolePermission: RolePermission = {
      ...insertRolePermission,
      id,
      createdAt: new Date(),
    };
    this.rolePermissions.set(id, rolePermission);
    return rolePermission;
  }

  async deleteRolePermission(roleId: number, permissionId: number): Promise<boolean> {
    for (const [id, rp] of Array.from(this.rolePermissions.entries())) {
      if (rp.roleId === roleId && rp.permissionId === permissionId) {
        return this.rolePermissions.delete(id);
      }
    }
    return false;
  }

  // RBAC - User Roles
  async getUserRoles(userId?: number): Promise<UserRole[]> {
    const allUserRoles = Array.from(this.userRoles.values());
    if (userId) {
      return allUserRoles.filter(ur => ur.userId === userId);
    }
    return allUserRoles;
  }

  async createUserRole(insertUserRole: InsertUserRole): Promise<UserRole> {
    const id = this.currentUserRoleId++;
    const userRole: UserRole = {
      ...insertUserRole,
      id,
      createdAt: new Date(),
    };
    this.userRoles.set(id, userRole);
    return userRole;
  }

  async deleteUserRole(userId: number, roleId: number): Promise<boolean> {
    for (const [id, ur] of Array.from(this.userRoles.entries())) {
      if (ur.userId === userId && ur.roleId === roleId) {
        return this.userRoles.delete(id);
      }
    }
    return false;
  }

  // RBAC - Resource Permissions
  async getResourcePermissions(userId?: number, resource?: string): Promise<ResourcePermission[]> {
    let allResourcePermissions = Array.from(this.resourcePermissions.values());
    
    if (userId) {
      allResourcePermissions = allResourcePermissions.filter(rp => rp.userId === userId);
    }
    
    if (resource) {
      allResourcePermissions = allResourcePermissions.filter(rp => rp.resource === resource);
    }
    
    return allResourcePermissions;
  }

  async createResourcePermission(insertResourcePermission: InsertResourcePermission): Promise<ResourcePermission> {
    const id = this.currentResourcePermissionId++;
    const resourcePermission: ResourcePermission = {
      ...insertResourcePermission,
      id,
      createdAt: new Date(),
    };
    this.resourcePermissions.set(id, resourcePermission);
    return resourcePermission;
  }

  async deleteResourcePermission(id: number): Promise<boolean> {
    return this.resourcePermissions.delete(id);
  }

  // RBAC - Helper Methods
  async getUserPermissions(userId: number): Promise<Permission[]> {
    const userRoles = await this.getUserRoles(userId);
    const permissions: Permission[] = [];
    
    for (const userRole of userRoles) {
      const rolePermissions = await this.getRolePermissions(userRole.roleId);
      for (const rolePermission of rolePermissions) {
        const permission = await this.getPermission(rolePermission.permissionId);
        if (permission) {
          permissions.push(permission);
        }
      }
    }
    
    return permissions;
  }

  async hasPermission(userId: number, resource: string, action: string, resourceId?: number): Promise<boolean> {
    // Check direct resource permissions first
    const resourcePermissions = await this.getResourcePermissions(userId, resource);
    const hasDirectPermission = resourcePermissions.some(rp => 
      rp.action === action && (resourceId === undefined || rp.resourceId === resourceId)
    );
    
    if (hasDirectPermission) {
      return true;
    }
    
    // Check role-based permissions
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.some(permission => 
      permission.resource === resource && permission.action === action
    );
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
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(eq(sessions.expiresAt, new Date()));
  }

  // LDAP Configuration removed for email-based authentication

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

  async createProject(insertProject: InsertProject & { userId: number }): Promise<Project> {
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
    if (projectId && userId) {
      return db.select().from(pipelines)
        .where(and(eq(pipelines.projectId, projectId), eq(pipelines.userId, userId)));
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
        .where(and(eq(pipelines.name, name), eq(pipelines.userId, userId)));
    }
    return db.select().from(pipelines).where(eq(pipelines.name, name));
  }

  async getPipelineVersions(name: string, userId?: number): Promise<Pipeline[]> {
    if (userId) {
      return db.select().from(pipelines)
        .where(and(eq(pipelines.name, name), eq(pipelines.userId, userId)))
        .orderBy(desc(pipelines.version));
    }
    
    return db.select().from(pipelines)
      .where(eq(pipelines.name, name))
      .orderBy(desc(pipelines.version));
  }

  async createPipelineVersion(insertPipeline: InsertPipeline & { userId: number }, parentId: number): Promise<Pipeline> {
    // Get the parent pipeline to determine the next version number
    const parentPipeline = await this.getPipeline(parentId);
    if (!parentPipeline) {
      throw new Error("Parent pipeline not found");
    }

    // Get all versions of this pipeline to determine the next version number
    const existingVersions = await this.getPipelineVersions(parentPipeline.name, parentPipeline.userId);
    const nextVersion = Math.max(...existingVersions.map(p => p.version), 0) + 1;

    // Mark all previous versions as not latest
    await db.update(pipelines)
      .set({ isLatestVersion: false })
      .where(eq(pipelines.name, parentPipeline.name));

    // Create the new version
    const [pipeline] = await db
      .insert(pipelines)
      .values({
        ...insertPipeline,
        version: nextVersion,
        parentPipelineId: parentId,
        isLatestVersion: true
      })
      .returning();
    
    return pipeline;
  }

  async createPipeline(insertPipeline: InsertPipeline & { userId: number }): Promise<Pipeline> {
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

  async createCredential(insertCredential: InsertCredential & { userId: number }): Promise<Credential> {
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

  // RBAC - Roles
  async getRoles(): Promise<Role[]> {
    return db.select().from(roles);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await db.update(roles).set(roleData).where(eq(roles.id, id)).returning();
    return role || undefined;
  }

  async deleteRole(id: number): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // RBAC - Permissions
  async getPermissions(): Promise<Permission[]> {
    return db.select().from(permissions);
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission || undefined;
  }

  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const [permission] = await db.insert(permissions).values(insertPermission).returning();
    return permission;
  }

  async updatePermission(id: number, permissionData: Partial<InsertPermission>): Promise<Permission | undefined> {
    const [permission] = await db.update(permissions).set(permissionData).where(eq(permissions.id, id)).returning();
    return permission || undefined;
  }

  async deletePermission(id: number): Promise<boolean> {
    const result = await db.delete(permissions).where(eq(permissions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // RBAC - Role Permissions
  async getRolePermissions(roleId?: number): Promise<RolePermission[]> {
    if (roleId) {
      return db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    }
    return db.select().from(rolePermissions);
  }

  async createRolePermission(insertRolePermission: InsertRolePermission): Promise<RolePermission> {
    const [rolePermission] = await db.insert(rolePermissions).values(insertRolePermission).returning();
    return rolePermission;
  }

  async deleteRolePermission(roleId: number, permissionId: number): Promise<boolean> {
    const result = await db.delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId) && eq(rolePermissions.permissionId, permissionId));
    return (result.rowCount ?? 0) > 0;
  }

  // RBAC - User Roles
  async getUserRoles(userId?: number): Promise<UserRole[]> {
    if (userId) {
      return db.select().from(userRoles).where(eq(userRoles.userId, userId));
    }
    return db.select().from(userRoles);
  }

  async createUserRole(insertUserRole: InsertUserRole): Promise<UserRole> {
    const [userRole] = await db.insert(userRoles).values(insertUserRole).returning();
    return userRole;
  }

  async deleteUserRole(userId: number, roleId: number): Promise<boolean> {
    const result = await db.delete(userRoles)
      .where(eq(userRoles.userId, userId) && eq(userRoles.roleId, roleId));
    return (result.rowCount ?? 0) > 0;
  }

  // RBAC - Resource Permissions
  async getResourcePermissions(userId?: number, resource?: string): Promise<ResourcePermission[]> {
    let query = db.select().from(resourcePermissions);
    
    if (userId && resource) {
      return db.select().from(resourcePermissions)
        .where(eq(resourcePermissions.userId, userId) && eq(resourcePermissions.resource, resource));
    } else if (userId) {
      return db.select().from(resourcePermissions).where(eq(resourcePermissions.userId, userId));
    } else if (resource) {
      return db.select().from(resourcePermissions).where(eq(resourcePermissions.resource, resource));
    }
    
    return db.select().from(resourcePermissions);
  }

  async createResourcePermission(insertResourcePermission: InsertResourcePermission): Promise<ResourcePermission> {
    const [resourcePermission] = await db.insert(resourcePermissions).values(insertResourcePermission).returning();
    return resourcePermission;
  }

  async deleteResourcePermission(id: number): Promise<boolean> {
    const result = await db.delete(resourcePermissions).where(eq(resourcePermissions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // RBAC - Helper Methods
  async getUserPermissions(userId: number): Promise<Permission[]> {
    // Get user roles
    const userRolesList = await this.getUserRoles(userId);
    if (userRolesList.length === 0) return [];
    
    const roleIds = userRolesList.map(ur => ur.roleId);
    
    // Get permissions for those roles
    const rolePermissionsList = await db.select({
      permissionId: rolePermissions.permissionId
    }).from(rolePermissions).where(eq(rolePermissions.roleId, roleIds[0])); // Simple implementation
    
    if (rolePermissionsList.length === 0) return [];
    
    const permissionIds = rolePermissionsList.map(rp => rp.permissionId);
    
    // Get the actual permissions
    return db.select().from(permissions).where(eq(permissions.id, permissionIds[0])); // Simple implementation
  }

  async hasPermission(userId: number, resource: string, action: string, resourceId?: number): Promise<boolean> {
    // Check if user is admin
    const user = await this.getUserById(userId);
    if (user?.isAdmin) return true;
    
    // Check user's role-based permissions
    const userPermissions = await this.getUserPermissions(userId);
    const hasRolePermission = userPermissions.some(p => p.resource === resource && p.action === action);
    
    if (hasRolePermission) return true;
    
    // Check specific resource permissions
    if (resourceId) {
      const resourcePermissionsList = await this.getResourcePermissions(userId, resource);
      return resourcePermissionsList.some(rp => 
        rp.resourceId === resourceId && rp.action === action
      );
    }
    
    return false;
  }
}

// Add RBAC initialization method
async function initializeRBACSystem(storage: DatabaseStorage) {
  try {
    // Check if roles already exist
    const existingRoles = await storage.getRoles();
    if (existingRoles.length > 0) {
      console.log("RBAC system already initialized");
      return;
    }

    console.log("Initializing RBAC system...");

    // Create default roles
    const adminRole = await storage.createRole({
      name: "Administrator",
      description: "Full system access with all permissions",
      isSystem: true
    });

    const managerRole = await storage.createRole({
      name: "Manager",
      description: "Manage projects and oversee teams",
      isSystem: true
    });

    const developerRole = await storage.createRole({
      name: "Developer",
      description: "Create and manage pipelines and deployments",
      isSystem: true
    });

    const viewerRole = await storage.createRole({
      name: "Viewer",
      description: "Read-only access to resources",
      isSystem: true
    });

    // Create default permissions
    const resources = ['pipelines', 'credentials', 'hub', 'deployments', 'users'];
    const actions = ['read', 'write', 'execute', 'delete', 'share', 'publish'];

    for (const resource of resources) {
      for (const action of actions) {
        await storage.createPermission({
          resource,
          action,
          description: `${action} access to ${resource}`
        });
      }
    }

    console.log("RBAC system initialized successfully");
  } catch (error) {
    console.error("Failed to initialize RBAC system:", error);
  }
}

export const storage = new DatabaseStorage();

// Initialize RBAC system after storage is created
initializeRBACSystem(storage);

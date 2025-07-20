import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table must be defined first for foreign key references
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  password: text("password").notNull(), // hashed password
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ldapConfig = pgTable("ldap_config", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  baseDN: text("base_dn").notNull(),
  bindDN: text("bind_dn"),
  bindPassword: text("bind_password"),
  userSearchBase: text("user_search_base").notNull(),
  userSearchFilter: text("user_search_filter").notNull().default("(sAMAccountName={{username}})"),
  emailAttribute: text("email_attribute").default("mail"),
  firstNameAttribute: text("first_name_attribute").default("givenName"),
  lastNameAttribute: text("last_name_attribute").default("sn"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pipelines = pgTable("pipelines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  version: integer("version").notNull().default(1),
  projectId: integer("project_id").references(() => projects.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  provider: text("provider").notNull().default("aws"), // aws, gcp, azure
  region: text("region").notNull().default("us-east-1"),
  components: jsonb("components").notNull().default([]),
  connections: jsonb("connections").notNull().default([]),
  snapshot: text("snapshot"), // Base64 encoded image of the pipeline canvas
  credentialId: integer("credential_id").references(() => credentials.id),
  credentialName: text("credential_name"),
  credentialUsername: text("credential_username"),
  credentialPassword: text("credential_password"),
  isTemplate: boolean("is_template").default(false),
  status: text("status").notNull().default("draft"), // draft, deployed, failed
  parentPipelineId: integer("parent_pipeline_id"),
  isLatestVersion: boolean("is_latest_version").default(true),
  versionNotes: text("version_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  pipelineId: integer("pipeline_id").references(() => pipelines.id).notNull(),
  environment: text("environment").notNull().default("development"),
  status: text("status").notNull().default("pending"), // pending, running, success, failed
  notes: text("notes"),
  validateConfig: boolean("validate_config").default(true),
  dryRun: boolean("dry_run").default(false),
  notifications: boolean("notifications").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// RBAC Tables
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").default(false), // System roles cannot be deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  resource: text("resource").notNull(), // pipelines, credentials, hub, deployments, users
  action: text("action").notNull(), // read, write, execute, delete, share, publish
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  assignedBy: integer("assigned_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resourcePermissions = pgTable("resource_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  resource: text("resource").notNull(), // pipelines, credentials, hub
  resourceId: integer("resource_id").notNull(), // ID of the specific resource
  action: text("action").notNull(), // read, write, execute, delete, share
  grantedBy: integer("granted_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const credentials = pgTable("credentials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  provider: text("provider").notNull(), // AWS, GCP, Azure
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Component schemas
export const componentConfigSchema = z.object({
  id: z.string(),
  type: z.enum([
    // AWS
    "ec2", "s3", "rds", "lambda", "vpc", "alb", "dynamodb",
    // Azure
    "azure-vm", "azure-functions", "azure-storage", "azure-sql", "azure-cosmos", "azure-vnet", "azure-lb",
    // GCP
    "gcp-vm", "gcp-functions", "gcp-storage", "gcp-sql", "gcp-firestore", "gcp-vpc", "gcp-lb"
  ]),
  name: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.any()),
});

export const pipelineConnectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertPipelineSchema = createInsertSchema(pipelines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeploymentSchema = createInsertSchema(deployments).omit({
  id: true,
  createdAt: true,
});

// RBAC Schemas
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
});

export const insertResourcePermissionSchema = createInsertSchema(resourcePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertCredentialSchema = createInsertSchema(credentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  createdAt: true,
});

export const insertLdapConfigSchema = createInsertSchema(ldapConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(1, "Full name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type LdapConfig = typeof ldapConfig.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Pipeline = typeof pipelines.$inferSelect;
export type Deployment = typeof deployments.$inferSelect;
export type Credential = typeof credentials.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type ResourcePermission = typeof resourcePermissions.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertLdapConfig = z.infer<typeof insertLdapConfigSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type InsertResourcePermission = z.infer<typeof insertResourcePermissionSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type SignupRequest = z.infer<typeof signupSchema>;
export type ComponentConfig = z.infer<typeof componentConfigSchema>;
export type PipelineConnection = z.infer<typeof pipelineConnectionSchema>;

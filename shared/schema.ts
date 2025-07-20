import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table must be defined first for foreign key references
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  passwordHash: text("password_hash"), // null for LDAP users
  isActive: boolean("is_active").default(true),
  isAdmin: boolean("is_admin").default(false),
  authProvider: text("auth_provider").notNull().default("local"), // local, ldap, ad
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const insertCredentialSchema = createInsertSchema(credentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
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
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  authProvider: z.enum(["local", "ldap", "ad"]).default("local"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type LdapConfig = typeof ldapConfig.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Pipeline = typeof pipelines.$inferSelect;
export type Deployment = typeof deployments.$inferSelect;
export type Credential = typeof credentials.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertLdapConfig = z.infer<typeof insertLdapConfigSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type SignupRequest = z.infer<typeof signupSchema>;
export type ComponentConfig = z.infer<typeof componentConfigSchema>;
export type PipelineConnection = z.infer<typeof pipelineConnectionSchema>;

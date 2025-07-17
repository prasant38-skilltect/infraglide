import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pipelines = pgTable("pipelines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  version: integer("version").notNull().default(1),
  projectId: integer("project_id").references(() => projects.id),
  region: text("region").notNull().default("us-east-1"),
  components: jsonb("components").notNull().default([]),
  connections: jsonb("connections").notNull().default([]),
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

export type Project = typeof projects.$inferSelect;
export type Pipeline = typeof pipelines.$inferSelect;
export type Deployment = typeof deployments.$inferSelect;
export type Credential = typeof credentials.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type ComponentConfig = z.infer<typeof componentConfigSchema>;
export type PipelineConnection = z.infer<typeof pipelineConnectionSchema>;

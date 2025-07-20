import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cloudProviders = pgTable("cloud_providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // aws, gcp, azure
  credentials: jsonb("credentials").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pipelines = pgTable("pipelines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  provider: text("provider").notNull(), // aws, gcp, azure
  region: text("region"),
  configuration: jsonb("configuration").notNull(),
  status: text("status").default("draft"), // draft, active, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  pipelineId: integer("pipeline_id").references(() => pipelines.id),
  status: text("status").notNull(), // pending, running, success, failed
  environment: text("environment"), // dev, staging, prod
  terraformState: jsonb("terraform_state"),
  logs: text("logs"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  deploymentId: integer("deployment_id").references(() => deployments.id),
  pipelineId: integer("pipeline_id").references(() => pipelines.id),
  provider: text("provider").notNull(),
  type: text("type").notNull(), // ec2, s3, gke, etc.
  name: text("name").notNull(),
  region: text("region"),
  status: text("status").notNull(), // creating, running, stopped, terminated
  configuration: jsonb("configuration"),
  cost: text("cost"), // daily cost estimate
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cloudProviders: many(cloudProviders),
  pipelines: many(pipelines),
}));

export const cloudProvidersRelations = relations(cloudProviders, ({ one }) => ({
  user: one(users, {
    fields: [cloudProviders.userId],
    references: [users.id],
  }),
}));

export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
  user: one(users, {
    fields: [pipelines.userId],
    references: [users.id],
  }),
  deployments: many(deployments),
  resources: many(resources),
}));

export const deploymentsRelations = relations(deployments, ({ one, many }) => ({
  pipeline: one(pipelines, {
    fields: [deployments.pipelineId],
    references: [pipelines.id],
  }),
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  deployment: one(deployments, {
    fields: [resources.deploymentId],
    references: [deployments.id],
  }),
  pipeline: one(pipelines, {
    fields: [resources.pipelineId],
    references: [pipelines.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

export const insertCloudProviderSchema = createInsertSchema(cloudProviders).pick({
  userId: true,
  name: true,
  type: true,
  credentials: true,
  isActive: true,
});

export const insertPipelineSchema = createInsertSchema(pipelines).pick({
  userId: true,
  name: true,
  description: true,
  provider: true,
  region: true,
  configuration: true,
  status: true,
});

export const insertDeploymentSchema = createInsertSchema(deployments).pick({
  pipelineId: true,
  status: true,
  environment: true,
  terraformState: true,
  logs: true,
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  deploymentId: true,
  pipelineId: true,
  provider: true,
  type: true,
  name: true,
  region: true,
  status: true,
  configuration: true,
  cost: true,
  tags: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CloudProvider = typeof cloudProviders.$inferSelect;
export type InsertCloudProvider = z.infer<typeof insertCloudProviderSchema>;
export type Pipeline = typeof pipelines.$inferSelect;
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

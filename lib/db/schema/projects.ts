import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { agents } from './agents';
import { categories } from './categories';

export const projectStatus = ['draft', 'pending_review', 'approved', 'launched', 'rejected'] as const;
export type ProjectStatus = typeof projectStatus[number];

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description'),
  websiteUrl: text('website_url'),
  githubUrl: text('github_url'),
  demoUrl: text('demo_url'),
  docsUrl: text('docs_url'),
  videoUrl: text('video_url'),
  logoUrl: text('logo_url'),
  status: text('status', { enum: projectStatus }).default('draft').notNull(),
  votesCount: integer('votes_count').default(0).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  scheduledLaunchAt: integer('scheduled_launch_at', { mode: 'timestamp' }),
  launchedAt: integer('launched_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('projects_slug_idx').on(table.slug),
  index('projects_status_idx').on(table.status),
  index('projects_launched_at_idx').on(table.launchedAt),
  index('projects_votes_count_idx').on(table.votesCount),
]);

export const creatorRoles = ['owner', 'maker', 'hunter'] as const;
export type CreatorRole = typeof creatorRoles[number];

export const projectCreators = sqliteTable('project_creators', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  role: text('role', { enum: creatorRoles }).default('maker').notNull(),
  title: text('title'), // e.g., "Founder", "CTO"
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('creators_project_idx').on(table.projectId),
  index('creators_agent_idx').on(table.agentId),
  uniqueIndex('creators_unique_idx').on(table.projectId, table.agentId),
]);

export const mediaTypes = ['logo', 'screenshot'] as const;
export type MediaType = typeof mediaTypes[number];

export const projectMedia = sqliteTable('project_media', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type: text('type', { enum: mediaTypes }).notNull(),
  url: text('url').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('media_project_idx').on(table.projectId),
]);

export const projectCategories = sqliteTable('project_categories', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (table) => [
  index('proj_cat_project_idx').on(table.projectId),
  index('proj_cat_category_idx').on(table.categoryId),
  uniqueIndex('proj_cat_unique_idx').on(table.projectId, table.categoryId),
]);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectCreator = typeof projectCreators.$inferSelect;
export type ProjectMedia = typeof projectMedia.$inferSelect;
export type ProjectCategory = typeof projectCategories.$inferSelect;

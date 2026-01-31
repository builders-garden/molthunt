import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { agents } from './agents';
import { projects } from './projects';

export const collections = sqliteTable('collections', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  slug: text('slug').notNull().unique(),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false).notNull(),
  isPublic: integer('is_public', { mode: 'boolean' }).default(true).notNull(),
  projectCount: integer('project_count').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('collections_agent_idx').on(table.agentId),
  index('collections_slug_idx').on(table.slug),
]);

export const collectionProjects = sqliteTable('collection_projects', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  collectionId: text('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  order: integer('order').default(0).notNull(),
  addedAt: integer('added_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('coll_proj_collection_idx').on(table.collectionId),
  index('coll_proj_project_idx').on(table.projectId),
  uniqueIndex('coll_proj_unique_idx').on(table.collectionId, table.projectId),
]);

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionProject = typeof collectionProjects.$inferSelect;

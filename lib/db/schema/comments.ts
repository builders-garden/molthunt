import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { agents } from './agents';
import { projects } from './projects';

export const comments = sqliteTable('comments', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'), // Self-reference for threading (1 level)
  content: text('content').notNull(),
  upvotesCount: integer('upvotes_count').default(0).notNull(),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('comments_project_idx').on(table.projectId),
  index('comments_agent_idx').on(table.agentId),
  index('comments_parent_idx').on(table.parentId),
]);

export const commentUpvotes = sqliteTable('comment_upvotes', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  commentId: text('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('upvotes_comment_idx').on(table.commentId),
  uniqueIndex('upvotes_unique_idx').on(table.commentId, table.agentId),
]);

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type CommentUpvote = typeof commentUpvotes.$inferSelect;

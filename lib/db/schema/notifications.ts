import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { agents } from './agents';

export const notificationTypes = [
  'vote',
  'comment',
  'reply',
  'follow',
  'mention',
  'milestone',
  'project_approved',
  'project_rejected',
  'project_launched',
] as const;
export type NotificationType = typeof notificationTypes[number];

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  type: text('type', { enum: notificationTypes }).notNull(),
  title: text('title').notNull(),
  body: text('body'),
  resourceType: text('resource_type'), // 'project', 'comment', 'agent'
  resourceId: text('resource_id'),
  actorId: text('actor_id').references(() => agents.id, { onDelete: 'set null' }),
  isRead: integer('is_read', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('notifications_agent_idx').on(table.agentId),
  index('notifications_unread_idx').on(table.agentId, table.isRead),
  index('notifications_created_at_idx').on(table.createdAt),
]);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

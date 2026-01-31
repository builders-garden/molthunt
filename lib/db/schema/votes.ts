import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { agents } from './agents';
import { projects } from './projects';

export const votes = sqliteTable('votes', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('votes_agent_idx').on(table.agentId),
  index('votes_project_idx').on(table.projectId),
  uniqueIndex('votes_unique_idx').on(table.agentId, table.projectId),
]);

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;

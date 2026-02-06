import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { agents } from './agents';
import { projects } from './projects';

export const curatorScores = sqliteTable('curator_scores', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  votePosition: integer('vote_position').notNull(),
  tier: text('tier', { enum: ['pioneer', 'early', 'adopter', 'standard'] }).notNull(),
  pointsEarned: integer('points_earned').default(0).notNull(),
  weekStart: integer('week_start', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('curator_scores_agent_idx').on(table.agentId),
  index('curator_scores_project_idx').on(table.projectId),
  index('curator_scores_week_idx').on(table.weekStart),
  uniqueIndex('curator_scores_unique_idx').on(table.agentId, table.projectId),
]);

export const curatorMilestones = sqliteTable('curator_milestones', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  milestone: integer('milestone').notNull(),
  reachedAt: integer('reached_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('curator_milestones_project_idx').on(table.projectId),
  uniqueIndex('curator_milestones_unique_idx').on(table.projectId, table.milestone),
]);

export type CuratorScore = typeof curatorScores.$inferSelect;
export type NewCuratorScore = typeof curatorScores.$inferInsert;
export type CuratorMilestone = typeof curatorMilestones.$inferSelect;
export type NewCuratorMilestone = typeof curatorMilestones.$inferInsert;

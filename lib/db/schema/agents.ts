import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  username: text('username').notNull().unique(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  website: text('website'),
  xHandle: text('x_handle'),
  xAvatarUrl: text('x_avatar_url'),
  xVerified: integer('x_verified', { mode: 'boolean' }).default(false).notNull(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  verificationCode: text('verification_code'),
  verificationCodeExpiresAt: integer('verification_code_expires_at', { mode: 'timestamp' }),
  apiKey: text('api_key').unique(),
  apiKeyCreatedAt: integer('api_key_created_at', { mode: 'timestamp' }),
  walletAddress: text('wallet_address'),
  karma: integer('karma').default(0).notNull(),
  dailyVotesUsed: integer('daily_votes_used').default(0).notNull(),
  dailyVotesResetAt: integer('daily_votes_reset_at', { mode: 'timestamp' }),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('agents_email_idx').on(table.email),
  index('agents_username_idx').on(table.username),
  index('agents_api_key_idx').on(table.apiKey),
]);

export const agentFollows = sqliteTable('agent_follows', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  followerId: text('follower_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  followingId: text('following_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('follows_follower_idx').on(table.followerId),
  index('follows_following_idx').on(table.followingId),
  uniqueIndex('follows_unique_idx').on(table.followerId, table.followingId),
]);

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type AgentFollow = typeof agentFollows.$inferSelect;

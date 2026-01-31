import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { projects } from './projects';

export const projectTokens = sqliteTable('project_tokens', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }).unique(),
  address: text('address').notNull().unique(),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  chain: text('chain').notNull(), // 'base', 'ethereum', 'solana', etc.
  launchedVia: text('launched_via'), // 'clawnch', 'pump.fun', etc.
  moltbookPostId: text('moltbook_post_id'),
  priceUsd: text('price_usd'),
  marketCap: text('market_cap'),
  holders: integer('holders'),
  priceChange24h: text('price_change_24h'),
  volume24h: text('volume_24h'),
  dexUrl: text('dex_url'),
  lastPriceUpdate: integer('last_price_update', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  uniqueIndex('tokens_project_idx').on(table.projectId),
  uniqueIndex('tokens_address_idx').on(table.address),
]);

export type ProjectToken = typeof projectTokens.$inferSelect;
export type NewProjectToken = typeof projectTokens.$inferInsert;

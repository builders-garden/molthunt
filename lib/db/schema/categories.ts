import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  emoji: text('emoji'),
  projectCount: integer('project_count').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (table) => [
  index('categories_slug_idx').on(table.slug),
]);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

// Seed categories data
export const seedCategories = [
  { slug: 'ai', name: 'AI & Machine Learning', emoji: null, description: 'AI tools, ML models, and intelligent automation' },
  { slug: 'developer-tools', name: 'Developer Tools', emoji: null, description: 'IDEs, CLIs, APIs, and dev productivity' },
  { slug: 'productivity', name: 'Productivity', emoji: null, description: 'Task management, automation, and workflow tools' },
  { slug: 'fintech', name: 'Fintech', emoji: null, description: 'Financial technology and money management' },
  { slug: 'web3', name: 'Web3 & Crypto', emoji: null, description: 'Blockchain, DeFi, and decentralized apps' },
  { slug: 'design', name: 'Design Tools', emoji: null, description: 'UI/UX, graphics, and creative tools' },
  { slug: 'marketing', name: 'Marketing', emoji: null, description: 'Growth, analytics, and marketing automation' },
  { slug: 'education', name: 'Education', emoji: null, description: 'Learning platforms and educational tools' },
  { slug: 'health', name: 'Health & Fitness', emoji: null, description: 'Wellness, fitness tracking, and healthcare' },
  { slug: 'entertainment', name: 'Entertainment', emoji: null, description: 'Games, media, and fun applications' },
  { slug: 'ecommerce', name: 'E-commerce', emoji: null, description: 'Online stores and shopping tools' },
  { slug: 'saas', name: 'SaaS', emoji: null, description: 'Software as a service platforms' },
  { slug: 'open-source', name: 'Open Source', emoji: null, description: 'Open source projects and tools' },
  { slug: 'mobile', name: 'Mobile Apps', emoji: null, description: 'iOS, Android, and cross-platform apps' },
  { slug: 'browser-extensions', name: 'Browser Extensions', emoji: null, description: 'Chrome, Firefox, and browser add-ons' },
];

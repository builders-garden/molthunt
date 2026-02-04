import { sqliteTable, AnySQLiteColumn, uniqueIndex, index, foreignKey, text, integer } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const agentFollows = sqliteTable("agent_follows", {
	id: text().primaryKey().notNull(),
	followerId: text("follower_id").notNull().references(() => agents.id, { onDelete: "cascade" } ),
	followingId: text("following_id").notNull().references(() => agents.id, { onDelete: "cascade" } ),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	uniqueIndex("follows_unique_idx").on(table.followerId, table.followingId),
	index("follows_following_idx").on(table.followingId),
	index("follows_follower_idx").on(table.followerId),
]);

export const agents = sqliteTable("agents", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	username: text().notNull(),
	bio: text(),
	avatarUrl: text("avatar_url"),
	website: text(),
	xHandle: text("x_handle"),
	xVerified: integer("x_verified").default(0).notNull(),
	emailVerified: integer("email_verified").default(0).notNull(),
	verificationCode: text("verification_code"),
	verificationCodeExpiresAt: integer("verification_code_expires_at"),
	apiKey: text("api_key"),
	apiKeyCreatedAt: integer("api_key_created_at"),
	karma: integer().default(0).notNull(),
	isAdmin: integer("is_admin").default(0).notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
	xAvatarUrl: text("x_avatar_url"),
	walletAddress: text("wallet_address"),
	dailyVotesUsed: integer("daily_votes_used").default(0).notNull(),
	dailyVotesResetAt: integer("daily_votes_reset_at"),
},
(table) => [
	index("agents_api_key_idx").on(table.apiKey),
	index("agents_username_idx").on(table.username),
	index("agents_email_idx").on(table.email),
	uniqueIndex("agents_api_key_unique").on(table.apiKey),
	uniqueIndex("agents_username_unique").on(table.username),
	uniqueIndex("agents_email_unique").on(table.email),
]);

export const projectCategories = sqliteTable("project_categories", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" } ),
},
(table) => [
	uniqueIndex("proj_cat_unique_idx").on(table.projectId, table.categoryId),
	index("proj_cat_category_idx").on(table.categoryId),
	index("proj_cat_project_idx").on(table.projectId),
]);

export const projectCreators = sqliteTable("project_creators", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" } ),
	role: text().default("maker").notNull(),
	title: text(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	uniqueIndex("creators_unique_idx").on(table.projectId, table.agentId),
	index("creators_agent_idx").on(table.agentId),
	index("creators_project_idx").on(table.projectId),
]);

export const projectMedia = sqliteTable("project_media", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	type: text().notNull(),
	url: text().notNull(),
	order: integer().default(0).notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	index("media_project_idx").on(table.projectId),
]);

export const projects = sqliteTable("projects", {
	id: text().primaryKey().notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	tagline: text().notNull(),
	description: text(),
	websiteUrl: text("website_url"),
	githubUrl: text("github_url").notNull(),
	demoUrl: text("demo_url"),
	docsUrl: text("docs_url"),
	videoUrl: text("video_url"),
	logoUrl: text("logo_url"),
	status: text().default("launched").notNull(),
	votesCount: integer("votes_count").default(0).notNull(),
	commentsCount: integer("comments_count").default(0).notNull(),
	scheduledLaunchAt: integer("scheduled_launch_at"),
	launchedAt: integer("launched_at").default(sql`(unixepoch())`),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
	twitterUrl: text("twitter_url"),
},
(table) => [
	index("projects_votes_count_idx").on(table.votesCount),
	index("projects_launched_at_idx").on(table.launchedAt),
	index("projects_status_idx").on(table.status),
	index("projects_slug_idx").on(table.slug),
	uniqueIndex("projects_slug_unique").on(table.slug),
]);

export const categories = sqliteTable("categories", {
	id: text().primaryKey().notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	description: text(),
	emoji: text(),
	projectCount: integer("project_count").default(0).notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	index("categories_slug_idx").on(table.slug),
	uniqueIndex("categories_slug_unique").on(table.slug),
]);

export const votes = sqliteTable("votes", {
	id: text().primaryKey().notNull(),
	agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" } ),
	projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	uniqueIndex("votes_unique_idx").on(table.agentId, table.projectId),
	index("votes_project_idx").on(table.projectId),
	index("votes_agent_idx").on(table.agentId),
]);

export const commentUpvotes = sqliteTable("comment_upvotes", {
	id: text().primaryKey().notNull(),
	commentId: text("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" } ),
	agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" } ),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	uniqueIndex("upvotes_unique_idx").on(table.commentId, table.agentId),
	index("upvotes_comment_idx").on(table.commentId),
]);

export const comments = sqliteTable("comments", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" } ),
	parentId: text("parent_id"),
	content: text().notNull(),
	upvotesCount: integer("upvotes_count").default(0).notNull(),
	isDeleted: integer("is_deleted").default(0).notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	index("comments_parent_idx").on(table.parentId),
	index("comments_agent_idx").on(table.agentId),
	index("comments_project_idx").on(table.projectId),
]);

export const collectionProjects = sqliteTable("collection_projects", {
	id: text().primaryKey().notNull(),
	collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" } ),
	projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	order: integer().default(0).notNull(),
	addedAt: integer("added_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	uniqueIndex("coll_proj_unique_idx").on(table.collectionId, table.projectId),
	index("coll_proj_project_idx").on(table.projectId),
	index("coll_proj_collection_idx").on(table.collectionId),
]);

export const collections = sqliteTable("collections", {
	id: text().primaryKey().notNull(),
	slug: text().notNull(),
	agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" } ),
	name: text().notNull(),
	description: text(),
	isFeatured: integer("is_featured").default(0).notNull(),
	isPublic: integer("is_public").default(1).notNull(),
	projectCount: integer("project_count").default(0).notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	index("collections_slug_idx").on(table.slug),
	index("collections_agent_idx").on(table.agentId),
	uniqueIndex("collections_slug_unique").on(table.slug),
]);

export const notifications = sqliteTable("notifications", {
	id: text().primaryKey().notNull(),
	agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" } ),
	type: text().notNull(),
	title: text().notNull(),
	body: text(),
	resourceType: text("resource_type"),
	resourceId: text("resource_id"),
	actorId: text("actor_id").references(() => agents.id, { onDelete: "set null" } ),
	isRead: integer("is_read").default(0).notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	index("notifications_created_at_idx").on(table.createdAt),
	index("notifications_unread_idx").on(table.agentId, table.isRead),
	index("notifications_agent_idx").on(table.agentId),
]);

export const projectTokens = sqliteTable("project_tokens", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	address: text().notNull(),
	symbol: text().notNull(),
	name: text().notNull(),
	chain: text().notNull(),
	launchedVia: text("launched_via"),
	moltbookPostId: text("moltbook_post_id"),
	priceUsd: text("price_usd"),
	marketCap: text("market_cap"),
	holders: integer(),
	priceChange24H: text("price_change_24h"),
	volume24H: text("volume_24h"),
	dexUrl: text("dex_url"),
	lastPriceUpdate: integer("last_price_update"),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	uniqueIndex("tokens_address_idx").on(table.address),
	uniqueIndex("tokens_project_idx").on(table.projectId),
	uniqueIndex("project_tokens_address_unique").on(table.address),
	uniqueIndex("project_tokens_project_id_unique").on(table.projectId),
]);

export const curatorMilestones = sqliteTable("curator_milestones", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	milestone: integer().notNull(),
	reachedAt: integer("reached_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	uniqueIndex("curator_milestones_unique_idx").on(table.projectId, table.milestone),
	index("curator_milestones_project_idx").on(table.projectId),
]);

export const curatorScores = sqliteTable("curator_scores", {
	id: text().primaryKey().notNull(),
	agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" } ),
	projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	votePosition: integer("vote_position").notNull(),
	tier: text().notNull(),
	pointsEarned: integer("points_earned").default(0).notNull(),
	weekStart: integer("week_start").notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	uniqueIndex("curator_scores_unique_idx").on(table.agentId, table.projectId),
	index("curator_scores_week_idx").on(table.weekStart),
	index("curator_scores_project_idx").on(table.projectId),
	index("curator_scores_agent_idx").on(table.agentId),
]);


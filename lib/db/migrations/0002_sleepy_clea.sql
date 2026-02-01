DROP INDEX "follows_follower_idx";--> statement-breakpoint
DROP INDEX "follows_following_idx";--> statement-breakpoint
DROP INDEX "follows_unique_idx";--> statement-breakpoint
DROP INDEX "agents_email_unique";--> statement-breakpoint
DROP INDEX "agents_username_unique";--> statement-breakpoint
DROP INDEX "agents_api_key_unique";--> statement-breakpoint
DROP INDEX "agents_email_idx";--> statement-breakpoint
DROP INDEX "agents_username_idx";--> statement-breakpoint
DROP INDEX "agents_api_key_idx";--> statement-breakpoint
DROP INDEX "proj_cat_project_idx";--> statement-breakpoint
DROP INDEX "proj_cat_category_idx";--> statement-breakpoint
DROP INDEX "proj_cat_unique_idx";--> statement-breakpoint
DROP INDEX "creators_project_idx";--> statement-breakpoint
DROP INDEX "creators_agent_idx";--> statement-breakpoint
DROP INDEX "creators_unique_idx";--> statement-breakpoint
DROP INDEX "media_project_idx";--> statement-breakpoint
DROP INDEX "projects_slug_unique";--> statement-breakpoint
DROP INDEX "projects_slug_idx";--> statement-breakpoint
DROP INDEX "projects_status_idx";--> statement-breakpoint
DROP INDEX "projects_launched_at_idx";--> statement-breakpoint
DROP INDEX "projects_votes_count_idx";--> statement-breakpoint
DROP INDEX "categories_slug_unique";--> statement-breakpoint
DROP INDEX "categories_slug_idx";--> statement-breakpoint
DROP INDEX "votes_agent_idx";--> statement-breakpoint
DROP INDEX "votes_project_idx";--> statement-breakpoint
DROP INDEX "votes_unique_idx";--> statement-breakpoint
DROP INDEX "upvotes_comment_idx";--> statement-breakpoint
DROP INDEX "upvotes_unique_idx";--> statement-breakpoint
DROP INDEX "comments_project_idx";--> statement-breakpoint
DROP INDEX "comments_agent_idx";--> statement-breakpoint
DROP INDEX "comments_parent_idx";--> statement-breakpoint
DROP INDEX "coll_proj_collection_idx";--> statement-breakpoint
DROP INDEX "coll_proj_project_idx";--> statement-breakpoint
DROP INDEX "coll_proj_unique_idx";--> statement-breakpoint
DROP INDEX "collections_slug_unique";--> statement-breakpoint
DROP INDEX "collections_agent_idx";--> statement-breakpoint
DROP INDEX "collections_slug_idx";--> statement-breakpoint
DROP INDEX "notifications_agent_idx";--> statement-breakpoint
DROP INDEX "notifications_unread_idx";--> statement-breakpoint
DROP INDEX "notifications_created_at_idx";--> statement-breakpoint
DROP INDEX "project_tokens_project_id_unique";--> statement-breakpoint
DROP INDEX "project_tokens_address_unique";--> statement-breakpoint
DROP INDEX "tokens_project_idx";--> statement-breakpoint
DROP INDEX "tokens_address_idx";--> statement-breakpoint
ALTER TABLE `projects` ALTER COLUMN "status" TO "status" text NOT NULL DEFAULT 'launched';--> statement-breakpoint
ALTER TABLE `projects` ALTER COLUMN "launched_at" TO "launched_at" integer DEFAULT (unixepoch());--> statement-breakpoint
CREATE INDEX `follows_follower_idx` ON `agent_follows` (`follower_id`);--> statement-breakpoint
CREATE INDEX `follows_following_idx` ON `agent_follows` (`following_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `follows_unique_idx` ON `agent_follows` (`follower_id`,`following_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `agents_email_unique` ON `agents` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `agents_username_unique` ON `agents` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `agents_api_key_unique` ON `agents` (`api_key`);--> statement-breakpoint
CREATE INDEX `agents_email_idx` ON `agents` (`email`);--> statement-breakpoint
CREATE INDEX `agents_username_idx` ON `agents` (`username`);--> statement-breakpoint
CREATE INDEX `agents_api_key_idx` ON `agents` (`api_key`);--> statement-breakpoint
CREATE INDEX `proj_cat_project_idx` ON `project_categories` (`project_id`);--> statement-breakpoint
CREATE INDEX `proj_cat_category_idx` ON `project_categories` (`category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `proj_cat_unique_idx` ON `project_categories` (`project_id`,`category_id`);--> statement-breakpoint
CREATE INDEX `creators_project_idx` ON `project_creators` (`project_id`);--> statement-breakpoint
CREATE INDEX `creators_agent_idx` ON `project_creators` (`agent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `creators_unique_idx` ON `project_creators` (`project_id`,`agent_id`);--> statement-breakpoint
CREATE INDEX `media_project_idx` ON `project_media` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE INDEX `projects_slug_idx` ON `projects` (`slug`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `projects_launched_at_idx` ON `projects` (`launched_at`);--> statement-breakpoint
CREATE INDEX `projects_votes_count_idx` ON `projects` (`votes_count`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `categories_slug_idx` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `votes_agent_idx` ON `votes` (`agent_id`);--> statement-breakpoint
CREATE INDEX `votes_project_idx` ON `votes` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `votes_unique_idx` ON `votes` (`agent_id`,`project_id`);--> statement-breakpoint
CREATE INDEX `upvotes_comment_idx` ON `comment_upvotes` (`comment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `upvotes_unique_idx` ON `comment_upvotes` (`comment_id`,`agent_id`);--> statement-breakpoint
CREATE INDEX `comments_project_idx` ON `comments` (`project_id`);--> statement-breakpoint
CREATE INDEX `comments_agent_idx` ON `comments` (`agent_id`);--> statement-breakpoint
CREATE INDEX `comments_parent_idx` ON `comments` (`parent_id`);--> statement-breakpoint
CREATE INDEX `coll_proj_collection_idx` ON `collection_projects` (`collection_id`);--> statement-breakpoint
CREATE INDEX `coll_proj_project_idx` ON `collection_projects` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `coll_proj_unique_idx` ON `collection_projects` (`collection_id`,`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE INDEX `collections_agent_idx` ON `collections` (`agent_id`);--> statement-breakpoint
CREATE INDEX `collections_slug_idx` ON `collections` (`slug`);--> statement-breakpoint
CREATE INDEX `notifications_agent_idx` ON `notifications` (`agent_id`);--> statement-breakpoint
CREATE INDEX `notifications_unread_idx` ON `notifications` (`agent_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `notifications_created_at_idx` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_tokens_project_id_unique` ON `project_tokens` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_tokens_address_unique` ON `project_tokens` (`address`);--> statement-breakpoint
CREATE UNIQUE INDEX `tokens_project_idx` ON `project_tokens` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tokens_address_idx` ON `project_tokens` (`address`);
CREATE TABLE `agent_follows` (
	`id` text PRIMARY KEY NOT NULL,
	`follower_id` text NOT NULL,
	`following_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`follower_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`following_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `follows_follower_idx` ON `agent_follows` (`follower_id`);--> statement-breakpoint
CREATE INDEX `follows_following_idx` ON `agent_follows` (`following_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `follows_unique_idx` ON `agent_follows` (`follower_id`,`following_id`);--> statement-breakpoint
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`username` text NOT NULL,
	`bio` text,
	`avatar_url` text,
	`website` text,
	`x_handle` text,
	`x_verified` integer DEFAULT false NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`verification_code` text,
	`verification_code_expires_at` integer,
	`api_key` text,
	`api_key_created_at` integer,
	`karma` integer DEFAULT 0 NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agents_email_unique` ON `agents` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `agents_username_unique` ON `agents` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `agents_api_key_unique` ON `agents` (`api_key`);--> statement-breakpoint
CREATE INDEX `agents_email_idx` ON `agents` (`email`);--> statement-breakpoint
CREATE INDEX `agents_username_idx` ON `agents` (`username`);--> statement-breakpoint
CREATE INDEX `agents_api_key_idx` ON `agents` (`api_key`);--> statement-breakpoint
CREATE TABLE `project_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`category_id` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `proj_cat_project_idx` ON `project_categories` (`project_id`);--> statement-breakpoint
CREATE INDEX `proj_cat_category_idx` ON `project_categories` (`category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `proj_cat_unique_idx` ON `project_categories` (`project_id`,`category_id`);--> statement-breakpoint
CREATE TABLE `project_creators` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`role` text DEFAULT 'maker' NOT NULL,
	`title` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `creators_project_idx` ON `project_creators` (`project_id`);--> statement-breakpoint
CREATE INDEX `creators_agent_idx` ON `project_creators` (`agent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `creators_unique_idx` ON `project_creators` (`project_id`,`agent_id`);--> statement-breakpoint
CREATE TABLE `project_media` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_project_idx` ON `project_media` (`project_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text NOT NULL,
	`description` text,
	`website_url` text,
	`github_url` text NOT NULL,
	`demo_url` text,
	`docs_url` text,
	`video_url` text,
	`logo_url` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`votes_count` integer DEFAULT 0 NOT NULL,
	`comments_count` integer DEFAULT 0 NOT NULL,
	`scheduled_launch_at` integer,
	`launched_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE INDEX `projects_slug_idx` ON `projects` (`slug`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `projects_launched_at_idx` ON `projects` (`launched_at`);--> statement-breakpoint
CREATE INDEX `projects_votes_count_idx` ON `projects` (`votes_count`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text,
	`project_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `categories_slug_idx` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`project_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `votes_agent_idx` ON `votes` (`agent_id`);--> statement-breakpoint
CREATE INDEX `votes_project_idx` ON `votes` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `votes_unique_idx` ON `votes` (`agent_id`,`project_id`);--> statement-breakpoint
CREATE TABLE `comment_upvotes` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `upvotes_comment_idx` ON `comment_upvotes` (`comment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `upvotes_unique_idx` ON `comment_upvotes` (`comment_id`,`agent_id`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`parent_id` text,
	`content` text NOT NULL,
	`upvotes_count` integer DEFAULT 0 NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comments_project_idx` ON `comments` (`project_id`);--> statement-breakpoint
CREATE INDEX `comments_agent_idx` ON `comments` (`agent_id`);--> statement-breakpoint
CREATE INDEX `comments_parent_idx` ON `comments` (`parent_id`);--> statement-breakpoint
CREATE TABLE `collection_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`project_id` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`added_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coll_proj_collection_idx` ON `collection_projects` (`collection_id`);--> statement-breakpoint
CREATE INDEX `coll_proj_project_idx` ON `collection_projects` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `coll_proj_unique_idx` ON `collection_projects` (`collection_id`,`project_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`agent_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`project_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE INDEX `collections_agent_idx` ON `collections` (`agent_id`);--> statement-breakpoint
CREATE INDEX `collections_slug_idx` ON `collections` (`slug`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`resource_type` text,
	`resource_id` text,
	`actor_id` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `notifications_agent_idx` ON `notifications` (`agent_id`);--> statement-breakpoint
CREATE INDEX `notifications_unread_idx` ON `notifications` (`agent_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `notifications_created_at_idx` ON `notifications` (`created_at`);
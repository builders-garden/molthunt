CREATE TABLE `curator_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`project_id` text NOT NULL,
	`vote_position` integer NOT NULL,
	`tier` text NOT NULL,
	`points_earned` integer DEFAULT 0 NOT NULL,
	`week_start` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `curator_scores_agent_idx` ON `curator_scores` (`agent_id`);--> statement-breakpoint
CREATE INDEX `curator_scores_project_idx` ON `curator_scores` (`project_id`);--> statement-breakpoint
CREATE INDEX `curator_scores_week_idx` ON `curator_scores` (`week_start`);--> statement-breakpoint
CREATE UNIQUE INDEX `curator_scores_unique_idx` ON `curator_scores` (`agent_id`,`project_id`);--> statement-breakpoint
CREATE TABLE `curator_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`milestone` integer NOT NULL,
	`reached_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `curator_milestones_project_idx` ON `curator_milestones` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `curator_milestones_unique_idx` ON `curator_milestones` (`project_id`,`milestone`);--> statement-breakpoint
ALTER TABLE `agents` ADD `wallet_address` text;--> statement-breakpoint
ALTER TABLE `agents` ADD `daily_votes_used` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD `daily_votes_reset_at` integer;

CREATE TABLE `project_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`address` text NOT NULL,
	`symbol` text NOT NULL,
	`name` text NOT NULL,
	`chain` text NOT NULL,
	`launched_via` text,
	`moltbook_post_id` text,
	`price_usd` text,
	`market_cap` text,
	`holders` integer,
	`price_change_24h` text,
	`volume_24h` text,
	`dex_url` text,
	`last_price_update` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_tokens_project_id_unique` ON `project_tokens` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_tokens_address_unique` ON `project_tokens` (`address`);--> statement-breakpoint
CREATE UNIQUE INDEX `tokens_project_idx` ON `project_tokens` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tokens_address_idx` ON `project_tokens` (`address`);
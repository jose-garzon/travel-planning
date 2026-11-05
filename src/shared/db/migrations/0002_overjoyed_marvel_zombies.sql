CREATE TABLE `trip_invite` (
	`trip_id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trip_invite_token_unique` ON `trip_invite` (`token`);--> statement-breakpoint
ALTER TABLE `trip_member` ADD `joined_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Backfill: existing members joined when their trip was created (feature 009 plan "Data model").
UPDATE `trip_member` SET `joined_at` = (SELECT `trip`.`created_at` FROM `trip` WHERE `trip`.`id` = `trip_member`.`trip_id`);
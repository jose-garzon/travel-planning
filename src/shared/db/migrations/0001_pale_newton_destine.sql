CREATE TABLE `trip` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`currency` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trip_leg` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`position` integer NOT NULL,
	`from_city_id` text,
	`from_code` text NOT NULL,
	`from_name` text NOT NULL,
	`to_city_id` text,
	`to_code` text NOT NULL,
	`to_name` text NOT NULL,
	`date` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trip_leg_trip_position_unique` ON `trip_leg` (`trip_id`,`position`);--> statement-breakpoint
CREATE TABLE `trip_member` (
	`trip_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`trip_id`, `user_id`),
	FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `trip_member_user_idx` ON `trip_member` (`user_id`);
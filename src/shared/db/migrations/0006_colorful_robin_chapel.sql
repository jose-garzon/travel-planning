CREATE TABLE `transfer` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`gap` integer NOT NULL,
	`mode` text NOT NULL,
	`from_name` text NOT NULL,
	`to_name` text NOT NULL,
	`depart_date` text NOT NULL,
	`depart_time` text,
	`depart_tz` text,
	`arrive_date` text,
	`arrive_time` text,
	`arrive_tz` text,
	`cost` integer,
	`currency` text,
	`rate` text,
	`charge` text NOT NULL,
	`booking_ref` text,
	`link` text,
	`notes` text,
	`needs_review` integer DEFAULT false NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `transfer_trip_idx` ON `transfer` (`trip_id`);--> statement-breakpoint
CREATE TABLE `transfer_participant` (
	`transfer_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`transfer_id`, `user_id`),
	FOREIGN KEY (`transfer_id`) REFERENCES `transfer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

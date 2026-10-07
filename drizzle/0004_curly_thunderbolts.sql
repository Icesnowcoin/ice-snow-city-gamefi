CREATE TABLE `game_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stateJson` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_states_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_states_backup` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stateJson` text NOT NULL,
	`version` int NOT NULL,
	`backupAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_states_backup_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `game_states` ADD CONSTRAINT `game_states_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_states_backup` ADD CONSTRAINT `game_states_backup_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
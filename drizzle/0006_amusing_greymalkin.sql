CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`username` varchar(128) NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`experience` int NOT NULL DEFAULT 0,
	`totalExperience` int NOT NULL DEFAULT 0,
	`stamina` int NOT NULL DEFAULT 100,
	`maxStamina` int NOT NULL DEFAULT 100,
	`hunger` int NOT NULL DEFAULT 50,
	`thirst` int NOT NULL DEFAULT 50,
	`happiness` int NOT NULL DEFAULT 0,
	`health` int NOT NULL DEFAULT 100,
	`money` int NOT NULL DEFAULT 1000,
	`isc` int NOT NULL DEFAULT 0,
	`bankBalance` int NOT NULL DEFAULT 0,
	`currentScene` varchar(128) NOT NULL DEFAULT 'home',
	`maritalStatus` varchar(32) NOT NULL DEFAULT 'single',
	`createdAt` bigint NOT NULL,
	`propertiesOwned` int NOT NULL DEFAULT 0,
	`farmsCreated` int NOT NULL DEFAULT 0,
	`tasksCompleted` int NOT NULL DEFAULT 0,
	`npcsFriended` int NOT NULL DEFAULT 0,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` varchar(64) NOT NULL,
	`initiatorId` int NOT NULL,
	`recipientId` int NOT NULL,
	`initiatorItems` text NOT NULL,
	`recipientItems` text NOT NULL,
	`initiatorAssets` text NOT NULL,
	`recipientAssets` text NOT NULL,
	`status` enum('pending','accepted','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` bigint NOT NULL,
	`expiresAt` bigint NOT NULL,
	`completedAt` bigint,
	`reason` text,
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `players` ADD CONSTRAINT `players_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trades` ADD CONSTRAINT `trades_initiatorId_players_id_fk` FOREIGN KEY (`initiatorId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trades` ADD CONSTRAINT `trades_recipientId_players_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;
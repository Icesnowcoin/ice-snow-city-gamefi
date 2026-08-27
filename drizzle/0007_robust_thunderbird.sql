CREATE TABLE `player_professions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentProfession` enum('commoner','merchant','architect','industrialist','entrepreneur') NOT NULL DEFAULT 'commoner',
	`level` int NOT NULL DEFAULT 1,
	`experience` bigint NOT NULL DEFAULT 0,
	`nextLevelExperience` bigint NOT NULL DEFAULT 100,
	`totalAssets` varchar(78) NOT NULL DEFAULT '0',
	`professionHistory` text NOT NULL,
	`lastProfessionChangeAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_professions_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_professions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `profession_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profession` enum('commoner','merchant','architect','industrialist','entrepreneur') NOT NULL,
	`achievementType` varchar(64) NOT NULL,
	`achievementData` text,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profession_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profession_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profession` enum('commoner','merchant','architect','industrialist','entrepreneur') NOT NULL,
	`totalProfit` varchar(78) NOT NULL DEFAULT '0',
	`totalProduction` bigint NOT NULL DEFAULT 0,
	`totalHarvest` bigint NOT NULL DEFAULT 0,
	`totalTrades` bigint NOT NULL DEFAULT 0,
	`buildingsConstructed` int NOT NULL DEFAULT 0,
	`workersEmployed` int NOT NULL DEFAULT 0,
	`timeSpentHours` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profession_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `player_professions` ADD CONSTRAINT `player_professions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profession_achievements` ADD CONSTRAINT `profession_achievements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profession_stats` ADD CONSTRAINT `profession_stats_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
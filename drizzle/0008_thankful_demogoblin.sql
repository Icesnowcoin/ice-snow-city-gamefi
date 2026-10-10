CREATE TABLE `character_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scene` varchar(128) NOT NULL,
	`positionX` decimal(10,2) NOT NULL,
	`positionY` decimal(10,2) NOT NULL,
	`direction` varchar(32) NOT NULL DEFAULT 'down',
	`isMoving` enum('yes','no') NOT NULL DEFAULT 'no',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `character_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `character_presets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`customizationData` text NOT NULL,
	`thumbnailUrl` text,
	`isPublic` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_presets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_characters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`gender` enum('male','female') NOT NULL,
	`faceShape` varchar(32) NOT NULL,
	`eyeShape` varchar(32) NOT NULL,
	`eyeColor` varchar(32) NOT NULL,
	`noseSize` int NOT NULL DEFAULT 50,
	`mouthSize` int NOT NULL DEFAULT 50,
	`skinTone` varchar(32) NOT NULL,
	`hairStyle` varchar(32) NOT NULL,
	`hairColor` varchar(32) NOT NULL,
	`bodyType` varchar(32) NOT NULL,
	`height` varchar(32) NOT NULL,
	`clothingStyle` varchar(32) NOT NULL,
	`clothingColor` varchar(7) NOT NULL,
	`shoes` varchar(32) NOT NULL,
	`shoeColor` varchar(7) NOT NULL,
	`accessories` text NOT NULL,
	`accessoryColor` varchar(7) NOT NULL,
	`positionX` decimal(10,2) NOT NULL DEFAULT '0',
	`positionY` decimal(10,2) NOT NULL DEFAULT '0',
	`currentScene` varchar(128) NOT NULL DEFAULT 'home',
	`modelUrl` text,
	`thumbnailUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_characters_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_characters_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `character_positions` ADD CONSTRAINT `character_positions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_presets` ADD CONSTRAINT `character_presets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_characters` ADD CONSTRAINT `player_characters_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
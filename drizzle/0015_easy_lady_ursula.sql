CREATE TABLE `guild_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`role` enum('leader','officer','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guild_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `guild_members_guild_user_unique` UNIQUE(`guildId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `guilds` (
	`id` varchar(64) NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`description` varchar(300),
	`status` enum('active','closed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guilds_id` PRIMARY KEY(`id`),
	CONSTRAINT `guilds_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `social_friendships` (
	`id` varchar(64) NOT NULL,
	`userLowId` int NOT NULL,
	`userHighId` int NOT NULL,
	`initiatedByUserId` int NOT NULL,
	`status` enum('active','blocked') NOT NULL DEFAULT 'active',
	`privateChatEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_friendships_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_friendships_pair_unique` UNIQUE(`userLowId`,`userHighId`)
);
--> statement-breakpoint
CREATE TABLE `social_messages` (
	`id` varchar(64) NOT NULL,
	`senderUserId` int NOT NULL,
	`channelType` enum('world','guild','team','private','community') NOT NULL,
	`channelId` varchar(64),
	`recipientUserId` int,
	`content` varchar(500) NOT NULL,
	`megaphoneConsumed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_transactions` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('megaphone_purchase','world_message','guild_creation','team_creation','friend_activation') NOT NULL,
	`amount` int NOT NULL,
	`balanceAfter` decimal(20,6) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`referenceId` varchar(64),
	`idempotencyKey` varchar(128) NOT NULL,
	`status` enum('completed','failed') NOT NULL DEFAULT 'completed',
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_transactions_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `social_wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`megaphones` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_wallets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`role` enum('leader','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_members_team_user_unique` UNIQUE(`teamId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` varchar(64) NOT NULL,
	`creatorUserId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`status` enum('active','expired','closed') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `guild_members` ADD CONSTRAINT `guild_members_guildId_guilds_id_fk` FOREIGN KEY (`guildId`) REFERENCES `guilds`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guild_members` ADD CONSTRAINT `guild_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guilds` ADD CONSTRAINT `guilds_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_friendships` ADD CONSTRAINT `social_friendships_userLowId_users_id_fk` FOREIGN KEY (`userLowId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_friendships` ADD CONSTRAINT `social_friendships_userHighId_users_id_fk` FOREIGN KEY (`userHighId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_friendships` ADD CONSTRAINT `social_friendships_initiatedByUserId_users_id_fk` FOREIGN KEY (`initiatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_messages` ADD CONSTRAINT `social_messages_senderUserId_users_id_fk` FOREIGN KEY (`senderUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_messages` ADD CONSTRAINT `social_messages_recipientUserId_users_id_fk` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_transactions` ADD CONSTRAINT `social_transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_wallets` ADD CONSTRAINT `social_wallets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teams` ADD CONSTRAINT `teams_creatorUserId_users_id_fk` FOREIGN KEY (`creatorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `guild_members_user_idx` ON `guild_members` (`userId`);--> statement-breakpoint
CREATE INDEX `guilds_owner_idx` ON `guilds` (`ownerUserId`);--> statement-breakpoint
CREATE INDEX `social_friendships_low_idx` ON `social_friendships` (`userLowId`);--> statement-breakpoint
CREATE INDEX `social_friendships_high_idx` ON `social_friendships` (`userHighId`);--> statement-breakpoint
CREATE INDEX `social_messages_channel_created_idx` ON `social_messages` (`channelType`,`channelId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `social_messages_recipient_created_idx` ON `social_messages` (`recipientUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `social_transactions_user_created_idx` ON `social_transactions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `social_transactions_reference_idx` ON `social_transactions` (`referenceId`);--> statement-breakpoint
CREATE INDEX `team_members_user_idx` ON `team_members` (`userId`);--> statement-breakpoint
CREATE INDEX `teams_creator_idx` ON `teams` (`creatorUserId`);--> statement-breakpoint
CREATE INDEX `teams_expiry_idx` ON `teams` (`status`,`expiresAt`);
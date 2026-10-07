CREATE TABLE `blockchain_transactions` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','withdraw') NOT NULL,
	`amount` varchar(78) NOT NULL,
	`txHash` varchar(66) NOT NULL,
	`gasUsed` varchar(78) NOT NULL DEFAULT '0',
	`gasPrice` varchar(78) NOT NULL DEFAULT '0',
	`fromAddress` varchar(42),
	`toAddress` varchar(42) NOT NULL,
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`confirmations` int NOT NULL DEFAULT 0,
	`blockNumber` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	CONSTRAINT `blockchain_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gamePoints` bigint NOT NULL DEFAULT 0,
	`blockchainBalance` varchar(78) NOT NULL DEFAULT '0',
	`pendingPoints` bigint NOT NULL DEFAULT 0,
	`lastSettled` timestamp NOT NULL DEFAULT (now()),
	`settlementCycle` int NOT NULL DEFAULT 24,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `game_accounts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `game_transactions` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('transfer','purchase','sale','reward','penalty') NOT NULL,
	`amount` bigint NOT NULL,
	`description` text,
	`relatedUserId` int,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'completed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `blockchain_transactions` ADD CONSTRAINT `blockchain_transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_accounts` ADD CONSTRAINT `game_accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_transactions` ADD CONSTRAINT `game_transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_transactions` ADD CONSTRAINT `game_transactions_relatedUserId_users_id_fk` FOREIGN KEY (`relatedUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
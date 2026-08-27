CREATE TABLE `game_consumption_allocations` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`scene` varchar(64) NOT NULL,
	`sourceTransactionId` varchar(64),
	`grossAmount` int NOT NULL,
	`treasuryAmount` int NOT NULL,
	`marketingAmount` int NOT NULL,
	`treasuryAddress` varchar(42) NOT NULL,
	`marketingWalletAddress` varchar(42) NOT NULL,
	`idempotencyKey` varchar(128) NOT NULL,
	`status` enum('recorded','settled','failed') NOT NULL DEFAULT 'recorded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_consumption_allocations_id` PRIMARY KEY(`id`),
	CONSTRAINT `game_consumption_allocations_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
ALTER TABLE `game_consumption_allocations` ADD CONSTRAINT `game_consumption_allocations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `game_consumption_user_scene_idx` ON `game_consumption_allocations` (`userId`,`scene`,`createdAt`);--> statement-breakpoint
CREATE INDEX `game_consumption_source_idx` ON `game_consumption_allocations` (`sourceTransactionId`);
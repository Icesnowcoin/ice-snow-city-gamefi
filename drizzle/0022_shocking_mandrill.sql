CREATE TABLE `wallet_bindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`walletAddress` varchar(42) NOT NULL,
	`chainId` int NOT NULL,
	`nonce` varchar(128) NOT NULL,
	`issuedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_bindings_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallet_bindings_wallet_chain_key` UNIQUE(`walletAddress`,`chainId`)
);
--> statement-breakpoint
ALTER TABLE `wallet_bindings` ADD CONSTRAINT `wallet_bindings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `wallet_bindings_user_idx` ON `wallet_bindings` (`userId`);
CREATE TABLE `player_nft_holdings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`walletAddress` varchar(42) NOT NULL,
	`chainId` int NOT NULL,
	`nftContract` varchar(42) NOT NULL,
	`tokenId` varchar(78) NOT NULL,
	`amount` varchar(78) NOT NULL,
	`lastSyncedBlock` varchar(78) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_nft_holdings_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_nft_holdings_ownership_key` UNIQUE(`walletAddress`,`chainId`,`nftContract`,`tokenId`)
);
--> statement-breakpoint
ALTER TABLE `player_nft_holdings` ADD CONSTRAINT `player_nft_holdings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `player_nft_holdings_user_idx` ON `player_nft_holdings` (`userId`,`chainId`);
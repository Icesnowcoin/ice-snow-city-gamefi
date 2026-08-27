CREATE TABLE `signed_nft_orders` (
	`orderHash` varchar(66) NOT NULL,
	`userId` int NOT NULL,
	`offerer` varchar(42) NOT NULL,
	`nftContract` varchar(42) NOT NULL,
	`tokenId` varchar(78) NOT NULL,
	`amount` varchar(78) NOT NULL,
	`price` varchar(78) NOT NULL,
	`expiration` varchar(78) NOT NULL,
	`nonce` varchar(78) NOT NULL,
	`itemType` int NOT NULL,
	`salt` varchar(66) NOT NULL,
	`signature` varchar(132) NOT NULL,
	`chainId` int NOT NULL,
	`marketplaceAddress` varchar(42) NOT NULL,
	`status` enum('active','cancelled','fulfilled','expired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `signed_nft_orders_orderHash` PRIMARY KEY(`orderHash`)
);
--> statement-breakpoint
ALTER TABLE `signed_nft_orders` ADD CONSTRAINT `signed_nft_orders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `signed_nft_orders_offerer_status_idx` ON `signed_nft_orders` (`offerer`,`status`);--> statement-breakpoint
CREATE INDEX `signed_nft_orders_expiry_idx` ON `signed_nft_orders` (`status`,`expiration`);--> statement-breakpoint
CREATE INDEX `signed_nft_orders_collection_idx` ON `signed_nft_orders` (`nftContract`,`tokenId`);
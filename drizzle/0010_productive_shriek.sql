CREATE TABLE `item_purchase_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`totalPrice` int NOT NULL,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `item_purchase_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`iscBalance` decimal(20,6) NOT NULL DEFAULT '0',
	`bankBalance` decimal(20,6) NOT NULL DEFAULT '0',
	`bankInterest` decimal(20,6) NOT NULL DEFAULT '0',
	`investments` decimal(20,6) NOT NULL DEFAULT '0',
	`realEstateValue` decimal(20,6) NOT NULL DEFAULT '0',
	`businessValue` decimal(20,6) NOT NULL DEFAULT '0',
	`totalAssets` decimal(20,6) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_assets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `player_inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`equippedSlot` varchar(64),
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`category` enum('hat','scarf','shirt','pants','skirt','shoes','socks','bag','ring','bracelet','earring','glasses','hairstyle') NOT NULL,
	`rarity` enum('common','uncommon','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`price` int NOT NULL,
	`imageUrl` varchar(512) NOT NULL,
	`previewUrl` varchar(512),
	`attributes` text,
	`availableFrom` timestamp,
	`availableUntil` timestamp,
	`isLimited` enum('yes','no') NOT NULL DEFAULT 'no',
	`stock` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `item_purchase_transactions` ADD CONSTRAINT `item_purchase_transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_purchase_transactions` ADD CONSTRAINT `item_purchase_transactions_itemId_shop_items_id_fk` FOREIGN KEY (`itemId`) REFERENCES `shop_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_assets` ADD CONSTRAINT `player_assets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_inventory` ADD CONSTRAINT `player_inventory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_inventory` ADD CONSTRAINT `player_inventory_itemId_shop_items_id_fk` FOREIGN KEY (`itemId`) REFERENCES `shop_items`(`id`) ON DELETE no action ON UPDATE no action;
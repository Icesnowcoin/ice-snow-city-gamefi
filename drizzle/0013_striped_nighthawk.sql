CREATE TABLE `share_statistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`transactionId` int,
	`platform` enum('twitter','telegram','clipboard','download') NOT NULL,
	`transactionType` varchar(32),
	`amount` varchar(78),
	`success` boolean NOT NULL DEFAULT true,
	`userAgent` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `share_statistics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `share_statistics` (`userId`);--> statement-breakpoint
CREATE INDEX `platform_idx` ON `share_statistics` (`platform`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `share_statistics` (`createdAt`);--> statement-breakpoint
CREATE INDEX `user_platform_idx` ON `share_statistics` (`userId`,`platform`);
CREATE TABLE `checkin_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(128) NOT NULL,
	`configValue` text NOT NULL,
	`description` text,
	`enabled` enum('yes','no') NOT NULL DEFAULT 'yes',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` varchar(64),
	CONSTRAINT `checkin_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `checkin_config_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE TABLE `checkin_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`checkinDate` date NOT NULL,
	`platform` enum('telegram','whatsapp','facebook','instagram','x','zalo','reddit','discord') NOT NULL,
	`shareUrl` text NOT NULL,
	`status` enum('pending','verified','claimed','expired') NOT NULL DEFAULT 'pending',
	`verificationData` text,
	`rewardAmount` int NOT NULL DEFAULT 10,
	`consecutiveDays` int NOT NULL DEFAULT 1,
	`canWithdraw` enum('yes','no') NOT NULL DEFAULT 'no',
	`withdrawalActivated` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checkin_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checkin_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalCheckIns` int NOT NULL DEFAULT 0,
	`consecutiveDays` int NOT NULL DEFAULT 0,
	`lastCheckInDate` date,
	`totalRewards` int NOT NULL DEFAULT 0,
	`withdrawalEligible` enum('yes','no') NOT NULL DEFAULT 'no',
	`withdrawalActivated` enum('yes','no') NOT NULL DEFAULT 'no',
	`checkInsToday` int NOT NULL DEFAULT 0,
	`lastResetDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checkin_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `checkin_stats_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `share_verification_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('telegram','whatsapp','facebook','instagram','x','zalo','reddit','discord') NOT NULL,
	`shareUrl` text NOT NULL,
	`verificationStatus` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
	`verificationData` text,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `share_verification_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `checkin_records` ADD CONSTRAINT `checkin_records_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkin_stats` ADD CONSTRAINT `checkin_stats_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `share_verification_logs` ADD CONSTRAINT `share_verification_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
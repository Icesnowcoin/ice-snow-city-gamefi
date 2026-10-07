CREATE TABLE `kyc_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`realName` varchar(128) NOT NULL,
	`idType` enum('passport','id_card','driver_license') NOT NULL,
	`idNumber` varchar(128) NOT NULL,
	`idImage` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`verifiedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kyc_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `kyc_verifications_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `payment_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`iscPrice` decimal(10,4) NOT NULL,
	`withdrawalActivationAmount` decimal(10,2) NOT NULL DEFAULT '5',
	`minPurchaseAmount` decimal(20,6) NOT NULL DEFAULT '1',
	`maxPurchaseAmount` decimal(20,6) NOT NULL DEFAULT '100000',
	`minWithdrawalAmount` decimal(20,6) NOT NULL DEFAULT '10',
	`maxWithdrawalAmount` decimal(20,6) NOT NULL DEFAULT '1000000',
	`gasMultiplier` decimal(5,2) NOT NULL DEFAULT '1.5',
	`confirmationBlocks` int NOT NULL DEFAULT 12,
	`maxWithdrawalAddresses` int NOT NULL DEFAULT 3,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderNo` varchar(64) NOT NULL,
	`type` enum('purchase','withdrawal','refund','fee') NOT NULL,
	`amount` decimal(20,6) NOT NULL,
	`usdtValue` decimal(20,6) NOT NULL,
	`status` enum('pending','confirmed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`txHash` varchar(66),
	`fromAddress` varchar(42),
	`toAddress` varchar(42),
	`gasUsed` decimal(20,6),
	`gasFee` decimal(20,6),
	`failureReason` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	CONSTRAINT `payment_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_orders_orderNo_unique` UNIQUE(`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `player_payment_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPurchased` decimal(20,6) NOT NULL DEFAULT '0',
	`totalWithdrawn` decimal(20,6) NOT NULL DEFAULT '0',
	`totalSpent` decimal(20,6) NOT NULL DEFAULT '0',
	`totalGasPaid` decimal(20,6) NOT NULL DEFAULT '0',
	`withdrawalActivated` boolean NOT NULL DEFAULT false,
	`activationDate` timestamp,
	`boundAddresses` text,
	`lastPurchaseDate` timestamp,
	`lastWithdrawalDate` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_payment_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_payment_stats_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`iscPrice` decimal(10,4) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`riskScore` int NOT NULL DEFAULT 0,
	`reasons` text,
	`requiresVerification` boolean NOT NULL DEFAULT false,
	`blockedUntil` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `risk_assessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `risk_assessments_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `transaction_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase','withdrawal','refund','fee','income','expense') NOT NULL,
	`amount` decimal(20,6) NOT NULL,
	`balance` decimal(20,6) NOT NULL,
	`relatedOrderId` int,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawal_activations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`activationNo` varchar(64) NOT NULL,
	`requiredAmount` decimal(20,6) NOT NULL,
	`requiredISC` decimal(20,6) NOT NULL,
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`txHash` varchar(66),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`failureReason` text,
	CONSTRAINT `withdrawal_activations_id` PRIMARY KEY(`id`),
	CONSTRAINT `withdrawal_activations_activationNo_unique` UNIQUE(`activationNo`)
);
--> statement-breakpoint
CREATE TABLE `withdrawal_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`requestNo` varchar(64) NOT NULL,
	`amount` decimal(20,6) NOT NULL,
	`usdtValue` decimal(20,6) NOT NULL,
	`chainAddress` varchar(42) NOT NULL,
	`status` enum('pending','activated','completed','failed') NOT NULL DEFAULT 'pending',
	`requiresActivation` boolean NOT NULL DEFAULT true,
	`activationOrderId` int,
	`txHash` varchar(66),
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`activatedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `withdrawal_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `withdrawal_requests_requestNo_unique` UNIQUE(`requestNo`)
);
--> statement-breakpoint
ALTER TABLE `kyc_verifications` ADD CONSTRAINT `kyc_verifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_orders` ADD CONSTRAINT `payment_orders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_payment_stats` ADD CONSTRAINT `player_payment_stats_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `risk_assessments` ADD CONSTRAINT `risk_assessments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_records` ADD CONSTRAINT `transaction_records_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_records` ADD CONSTRAINT `transaction_records_relatedOrderId_payment_orders_id_fk` FOREIGN KEY (`relatedOrderId`) REFERENCES `payment_orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawal_activations` ADD CONSTRAINT `withdrawal_activations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawal_requests` ADD CONSTRAINT `withdrawal_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawal_requests` ADD CONSTRAINT `withdrawal_requests_activationOrderId_payment_orders_id_fk` FOREIGN KEY (`activationOrderId`) REFERENCES `payment_orders`(`id`) ON DELETE no action ON UPDATE no action;
CREATE TABLE `contract_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventName` varchar(128) NOT NULL,
	`txHash` varchar(66),
	`blockNumber` bigint,
	`fromAddress` varchar(42),
	`toAddress` varchar(42),
	`amount` varchar(78),
	`params` text,
	`status` enum('success','failed','pending') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contract_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contract_params` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paramName` varchar(128) NOT NULL,
	`paramValue` varchar(256) NOT NULL,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` varchar(64),
	CONSTRAINT `contract_params_id` PRIMARY KEY(`id`),
	CONSTRAINT `contract_params_paramName_unique` UNIQUE(`paramName`)
);
--> statement-breakpoint
CREATE TABLE `secret_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyHash` varchar(66) NOT NULL,
	`isActive` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` varchar(64),
	CONSTRAINT `secret_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`txType` enum('deposit','withdraw') NOT NULL,
	`amount` varchar(78) NOT NULL,
	`txHash` varchar(66),
	`fromAddress` varchar(42),
	`toAddress` varchar(42),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_transactions_id` PRIMARY KEY(`id`)
);

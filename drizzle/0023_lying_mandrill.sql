CREATE TABLE `launch_notification_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`source` varchar(64) NOT NULL DEFAULT 'mainnet_read_only_preview',
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_notification_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `launch_notification_subscriptions_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `launch_notification_subscriptions_active_idx` ON `launch_notification_subscriptions` (`isActive`);
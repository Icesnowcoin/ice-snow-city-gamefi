CREATE TABLE `recovery_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceType` varchar(64) NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`status` enum('success','failed','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`details` text,
	`recoveryAttempts` int NOT NULL DEFAULT 0,
	`duration` int,
	`triggeredBy` varchar(64),
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recovery_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recovery_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceType` varchar(64) NOT NULL,
	`metricType` varchar(64) NOT NULL,
	`metricValue` varchar(256) NOT NULL,
	`unit` varchar(32),
	`period` varchar(32),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recovery_metrics_id` PRIMARY KEY(`id`)
);

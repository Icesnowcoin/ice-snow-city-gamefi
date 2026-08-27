CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`userId` varchar(64) NOT NULL,
	`action` varchar(128) NOT NULL,
	`resource` varchar(128) NOT NULL,
	`resourceId` varchar(256),
	`status` enum('success','failure') NOT NULL,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);

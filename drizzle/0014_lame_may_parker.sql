CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerUserId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referralCode` varchar(64) NOT NULL,
	`status` enum('claimed','rejected') NOT NULL DEFAULT 'claimed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referred_user_unique` UNIQUE(`referredUserId`)
);
--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referrerUserId_users_id_fk` FOREIGN KEY (`referrerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referredUserId_users_id_fk` FOREIGN KEY (`referredUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `referrals_referrer_created_idx` ON `referrals` (`referrerUserId`,`createdAt`);
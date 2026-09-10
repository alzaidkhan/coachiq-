CREATE TABLE `feedback_submissions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`topic` varchar(32) NOT NULL,
	`message` text NOT NULL,
	`source` varchar(48) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_submissions_id` PRIMARY KEY(`id`)
);

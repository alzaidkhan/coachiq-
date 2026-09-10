CREATE TABLE `ai_usage_daily` (
	`bucket_date` date NOT NULL,
	`request_count` int NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_usage_daily_bucket_date` PRIMARY KEY(`bucket_date`)
);
--> statement-breakpoint
ALTER TABLE `feedback_submissions` ADD `status` varchar(16) DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `feedback_submissions` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;
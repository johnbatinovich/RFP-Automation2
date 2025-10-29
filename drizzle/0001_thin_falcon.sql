CREATE TABLE `analytics` (
	`id` varchar(64) NOT NULL,
	`metric` varchar(100) NOT NULL,
	`value` varchar(50) NOT NULL,
	`date` timestamp DEFAULT (now()),
	CONSTRAINT `analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeBase` (
	`id` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` enum('audience_data','ad_formats','pricing','case_studies') NOT NULL,
	`content` text,
	`fileUrl` text,
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `knowledgeBase_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` varchar(64) NOT NULL,
	`rfpId` varchar(64) NOT NULL,
	`content` text,
	`qualityScore` varchar(10),
	`completeness` varchar(10),
	`relevance` varchar(10),
	`clarity` varchar(10),
	`competitiveDiff` varchar(10),
	`alignment` varchar(10),
	`status` enum('draft','pending_review','approved','sent') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfpAssignments` (
	`id` varchar(64) NOT NULL,
	`rfpId` varchar(64) NOT NULL,
	`memberId` varchar(64) NOT NULL,
	`assignedAt` timestamp DEFAULT (now()),
	CONSTRAINT `rfpAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfps` (
	`id` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`company` varchar(255) NOT NULL,
	`dueDate` timestamp NOT NULL,
	`value` varchar(50),
	`status` enum('new','in_progress','under_review','completed') NOT NULL DEFAULT 'new',
	`progress` varchar(10) DEFAULT '0',
	`owner` varchar(255),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `rfps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamMembers` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(100) NOT NULL,
	`email` varchar(320),
	`status` enum('online','offline','away') NOT NULL DEFAULT 'offline',
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `teamMembers_id` PRIMARY KEY(`id`)
);

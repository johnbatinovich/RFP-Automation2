ALTER TABLE `knowledgeBase` ADD `fileType` varchar(100);--> statement-breakpoint
ALTER TABLE `knowledgeBase` ADD `fileSize` int;--> statement-breakpoint
ALTER TABLE `proposals` ADD `improvementSuggestion` text;--> statement-breakpoint
ALTER TABLE `rfps` ADD `rfpDocumentUrl` text;--> statement-breakpoint
ALTER TABLE `rfps` ADD `rfpDocumentName` varchar(255);--> statement-breakpoint
ALTER TABLE `rfps` ADD `extractedQuestions` text;
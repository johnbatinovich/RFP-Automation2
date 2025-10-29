-- Seed RFPs
INSERT INTO rfps (id, title, company, dueDate, value, status, progress, owner, createdAt, updatedAt) VALUES
('rfp-001', 'Q3 Digital Media Campaign RFP', 'MediaBuyers Agency', '2025-04-15 00:00:00', '$1.2M', 'in_progress', '72', 'John Davis', NOW(), NOW()),
('rfp-002', 'Summer Multichannel Campaign RFP', 'BrandMax Advertising', '2025-04-22 00:00:00', '$800K', 'under_review', '95', 'Sarah Johnson', NOW(), NOW()),
('rfp-003', 'Product Launch Campaign RFP', 'TechCorp', '2025-05-05 00:00:00', '$1.5M', 'new', '15', 'Michael Chen', NOW(), NOW());

-- Seed Team Members
INSERT INTO teamMembers (id, name, role, email, status, createdAt) VALUES
('member-001', 'John Doe', 'Media Director', 'john.doe@example.com', 'online', NOW()),
('member-002', 'Amanda Smith', 'Digital Strategist', 'amanda.smith@example.com', 'online', NOW()),
('member-003', 'Robert Johnson', 'Ad Operations', 'robert.johnson@example.com', 'away', NOW()),
('member-004', 'Maria Lopez', 'Sales Manager', 'maria.lopez@example.com', 'offline', NOW());

-- Seed Knowledge Base
INSERT INTO knowledgeBase (id, title, category, content, fileUrl, updatedAt) VALUES
('kb-001', 'Q2 2025 Audience Data Deck', 'audience_data', 'Comprehensive audience insights for Q2 2025', '/docs/q2-2025-audience-data.pdf', DATE_SUB(NOW(), INTERVAL 14 DAY)),
('kb-002', 'Tech Audience Profile', 'audience_data', 'Detailed profile of tech-savvy audience segments', '/docs/tech-audience-profile.pdf', DATE_SUB(NOW(), INTERVAL 30 DAY)),
('kb-003', 'Q1 2025 Viewability Report', 'case_studies', 'Viewability metrics and performance analysis', '/docs/q1-2025-viewability.pdf', DATE_SUB(NOW(), INTERVAL 60 DAY)),
('kb-004', 'Tech Product Launch Case Study', 'case_studies', 'Successful product launch campaign analysis', '/docs/tech-product-launch-case-study.pdf', DATE_SUB(NOW(), INTERVAL 90 DAY));

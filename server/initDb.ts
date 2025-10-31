import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function initDatabase() {
  console.log("Initializing database...");
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Create rfps table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rfps (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        company VARCHAR(255),
        dueDate DATETIME,
        value VARCHAR(100),
        status VARCHAR(50) DEFAULT 'new',
        progress VARCHAR(10) DEFAULT '0',
        owner VARCHAR(255),
        extractedQuestions TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created rfps table");

    // Create proposals table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS proposals (
        id VARCHAR(255) PRIMARY KEY,
        rfpId VARCHAR(255) NOT NULL,
        content TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        qualityScore INT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (rfpId) REFERENCES rfps(id)
      )
    `);
    console.log("✓ Created proposals table");

    // Create teamMembers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS teamMembers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'offline',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created teamMembers table");

    // Create knowledgeBase table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS knowledgeBase (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        category VARCHAR(100),
        content TEXT,
        fileUrl VARCHAR(500),
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created knowledgeBase table");

    // Insert sample data if tables are empty
    const [rfpsCount] = await connection.execute('SELECT COUNT(*) as count FROM rfps');
    const count = (rfpsCount as any)[0].count;

    if (count === 0) {
      console.log("Inserting sample data...");
      
      await connection.execute(`
        INSERT INTO rfps (id, title, company, dueDate, value, status, progress, owner, createdAt, updatedAt) VALUES
        ('rfp-001', 'Q3 Digital Media Campaign RFP', 'MediaBuyers Agency', '2025-04-15 00:00:00', '$1.2M', 'in_progress', '72', 'John Davis', NOW(), NOW()),
        ('rfp-002', 'Summer Multichannel Campaign RFP', 'BrandMax Advertising', '2025-04-22 00:00:00', '$800K', 'under_review', '95', 'Sarah Johnson', NOW(), NOW()),
        ('rfp-003', 'Product Launch Campaign RFP', 'TechCorp', '2025-05-05 00:00:00', '$1.5M', 'new', '15', 'Michael Chen', NOW(), NOW())
      `);
      console.log("✓ Inserted sample RFPs");

      await connection.execute(`
        INSERT INTO teamMembers (id, name, role, email, status, createdAt) VALUES
        ('member-001', 'John Doe', 'Media Director', 'john.doe@example.com', 'online', NOW()),
        ('member-002', 'Amanda Smith', 'Digital Strategist', 'amanda.smith@example.com', 'online', NOW()),
        ('member-003', 'Robert Johnson', 'Ad Operations', 'robert.johnson@example.com', 'away', NOW())
      `);
      console.log("✓ Inserted sample team members");
    }

    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

initDatabase().catch((error) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});

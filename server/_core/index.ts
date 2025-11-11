import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function initDatabase() {
  console.log("Initializing database...");
  try {
    const mysql = await import("mysql2/promise");
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      console.warn("DATABASE_URL not set, skipping database initialization");
      return;
    }

    const connection = await mysql.default.createConnection(DATABASE_URL);

    // Drop existing tables to ensure clean schema
    console.log("Dropping existing tables if they exist...");
    await connection.execute('DROP TABLE IF EXISTS rfpAssignments');
    await connection.execute('DROP TABLE IF EXISTS analytics');
    await connection.execute('DROP TABLE IF EXISTS proposals');
    await connection.execute('DROP TABLE IF EXISTS knowledgeBase');
    await connection.execute('DROP TABLE IF EXISTS teamMembers');
    await connection.execute('DROP TABLE IF EXISTS rfps');
    console.log("✓ Dropped old tables");

    // Create tables matching Drizzle schema exactly
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rfps (
        id VARCHAR(64) PRIMARY KEY,
        title TEXT NOT NULL,
        company VARCHAR(255) NOT NULL,
        dueDate TIMESTAMP NOT NULL,
        value VARCHAR(50),
        status ENUM('new', 'in_progress', 'under_review', 'completed') DEFAULT 'new' NOT NULL,
        progress VARCHAR(10) DEFAULT '0',
        owner VARCHAR(255),
        rfpDocumentUrl TEXT,
        rfpDocumentName VARCHAR(255),
        extractedQuestions TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created rfps table");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS proposals (
        id VARCHAR(64) PRIMARY KEY,
        rfpId VARCHAR(64) NOT NULL,
        content TEXT,
        qualityScore VARCHAR(10),
        completeness VARCHAR(10),
        relevance VARCHAR(10),
        clarity VARCHAR(10),
        competitiveDiff VARCHAR(10),
        alignment VARCHAR(10),
        improvementSuggestion TEXT,
        status ENUM('draft', 'pending_review', 'approved', 'sent') DEFAULT 'draft' NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created proposals table");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS teamMembers (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        email VARCHAR(320),
        status ENUM('online', 'offline', 'away') DEFAULT 'offline' NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created teamMembers table");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS knowledgeBase (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category ENUM('audience_data', 'ad_formats', 'pricing', 'case_studies') NOT NULL,
        content TEXT,
        fileUrl TEXT,
        fileType VARCHAR(100),
        fileSize INT,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created knowledgeBase table");

    // Check if sample data exists
    const [rfpsCount] = await connection.execute('SELECT COUNT(*) as count FROM rfps');
    const count = (rfpsCount as any)[0].count;

    if (count === 0) {
      console.log("Inserting sample data...");
      
      await connection.execute(`
        INSERT INTO rfps (id, title, company, dueDate, value, status, progress, owner, createdAt, updatedAt) VALUES
        ('rfp-001', 'Q3 Digital Media Campaign RFP', 'MediaBuyers Agency', '2025-04-15 12:00:00', '1200000', 'in_progress', '72', 'John Davis', NOW(), NOW()),
        ('rfp-002', 'Summer Multichannel Campaign RFP', 'BrandMax Advertising', '2025-04-22 12:00:00', '800000', 'under_review', '95', 'Sarah Johnson', NOW(), NOW()),
        ('rfp-003', 'Product Launch Campaign RFP', 'TechCorp', '2025-05-05 12:00:00', '1500000', 'new', '15', 'Michael Chen', NOW(), NOW())
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

    await connection.end();
    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Error initializing database:", error);
    // Don't throw - allow server to start even if DB init fails
  }
}

async function startServer() {
  // Initialize database first
  await initDatabase();
  
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

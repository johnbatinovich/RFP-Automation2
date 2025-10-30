# Simple Deployment Guide for RFP Automation

**For Mac Users with No Coding Background**

This guide will walk you through deploying your RFP Automation application to Railway so it's live on the internet. The entire process should take about 15-20 minutes.

---

## What You'll Need

✅ Your Railway account (you already have this)  
✅ Your OpenAI API key (you already have this)  
✅ A web browser (Chrome)  
✅ About 15-20 minutes

**Estimated Monthly Cost:** $5-20 depending on usage
- Railway Database: ~$5/month
- Railway Web Service: ~$5-15/month (scales with traffic)
- Total: ~$10-20/month for proof of concept

---

## Step 1: Log into Railway

1. Open Chrome on your Mac
2. Go to [railway.app](https://railway.app)
3. Click **Login** in the top right corner
4. Sign in with your Railway account

---

## Step 2: Create a New Project

1. Once logged in, click the **"New Project"** button (purple button in the center or top right)
2. You'll see several options - click **"Deploy from GitHub repo"**
3. If this is your first time, Railway will ask to connect to GitHub:
   - Click **"Configure GitHub App"**
   - A new window will open asking for GitHub permissions
   - Click **"Authorize Railway"**
   - You may need to enter your GitHub password

---

## Step 3: Select Your Repository

1. After connecting GitHub, you'll see a list of your repositories
2. Find and click **"RFP-Automation2"** from the list
3. Railway will start setting up your project
4. You'll see a new project dashboard appear

---

## Step 4: Add a Database

Your application needs a database to store RFP information.

1. In your Railway project dashboard, click the **"+ New"** button
2. Select **"Database"**
3. Choose **"Add MySQL"**
4. Railway will automatically create a MySQL database
5. Wait about 30 seconds for it to finish setting up (you'll see a green checkmark when ready)

---

## Step 5: Connect Database to Your Application

Railway needs to know your application should use this database.

1. Click on your **"RFP-Automation2"** service (the box with your app name)
2. Go to the **"Variables"** tab at the top
3. Click **"+ New Variable"** and then select **"Add Reference"**
4. Find **"DATABASE_URL"** in the dropdown list
5. Select it - this automatically connects your app to the database

---

## Step 6: Add Required Settings

Now we need to add some configuration settings for your application.

1. Still in the **"Variables"** tab of your RFP-Automation2 service
2. Click **"+ New Variable"** (the regular one, not "Add Reference")
3. Add these settings **one at a time**:

### Setting 1: JWT Secret
- **Variable Name:** `JWT_SECRET`
- **Value:** `rfp-automation-secret-key-change-this-in-production-2025`
- Click **"Add"**

### Setting 2: OpenAI API Key
- **Variable Name:** `OPENAI_API_KEY`
- **Value:** Your OpenAI API key (starts with `sk-...`)
- Click **"Add"**

### Setting 3: OpenAI API URL
- **Variable Name:** `OPENAI_API_URL`
- **Value:** `https://api.openai.com/v1`
- Click **"Add"**

### Setting 4: App Title
- **Variable Name:** `VITE_APP_TITLE`
- **Value:** `RFP Automation`
- Click **"Add"**

### Setting 5: Port
- **Variable Name:** `PORT`
- **Value:** `3000`
- Click **"Add"**

---

## Step 7: Deploy Your Application

1. Railway will automatically start deploying your application
2. Look for the **"Deployments"** tab at the top
3. You'll see a deployment in progress (it will show a spinning circle or "Building")
4. This takes about 3-5 minutes
5. When complete, you'll see a green checkmark and "Success"

---

## Step 8: Set Up the Database Tables

Your database is empty right now - we need to create the tables for storing RFP data.

1. Click on your **MySQL database** service (the other box in your project)
2. Go to the **"Data"** tab
3. Click **"Query"** at the top
4. Copy and paste this code into the query box:

```sql
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
);

CREATE TABLE IF NOT EXISTS proposals (
  id VARCHAR(255) PRIMARY KEY,
  rfpId VARCHAR(255) NOT NULL,
  content TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  qualityScore INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rfpId) REFERENCES rfps(id)
);

CREATE TABLE IF NOT EXISTS teamMembers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'offline',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledgeBase (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  content TEXT,
  fileUrl VARCHAR(500),
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

5. Click **"Run Query"** button
6. You should see a success message

---

## Step 9: Add Sample Data (Optional but Recommended)

To test the application, let's add some sample RFP data:

1. Still in the **"Query"** section of your database
2. Copy and paste this code:

```sql
INSERT INTO rfps (id, title, company, dueDate, value, status, progress, owner, createdAt, updatedAt) VALUES
('rfp-001', 'Q3 Digital Media Campaign RFP', 'MediaBuyers Agency', '2025-04-15 00:00:00', '$1.2M', 'in_progress', '72', 'John Davis', NOW(), NOW()),
('rfp-002', 'Summer Multichannel Campaign RFP', 'BrandMax Advertising', '2025-04-22 00:00:00', '$800K', 'under_review', '95', 'Sarah Johnson', NOW(), NOW()),
('rfp-003', 'Product Launch Campaign RFP', 'TechCorp', '2025-05-05 00:00:00', '$1.5M', 'new', '15', 'Michael Chen', NOW(), NOW());

INSERT INTO teamMembers (id, name, role, email, status, createdAt) VALUES
('member-001', 'John Doe', 'Media Director', 'john.doe@example.com', 'online', NOW()),
('member-002', 'Amanda Smith', 'Digital Strategist', 'amanda.smith@example.com', 'online', NOW()),
('member-003', 'Robert Johnson', 'Ad Operations', 'robert.johnson@example.com', 'away', NOW());
```

3. Click **"Run Query"**
4. You should see "3 rows affected" for each table

---

## Step 10: Get Your Live Website URL

1. Go back to your **RFP-Automation2** service (click on it)
2. Go to the **"Settings"** tab
3. Scroll down to find **"Domains"** section
4. Click **"Generate Domain"**
5. Railway will create a URL like: `rfp-automation2-production.up.railway.app`
6. Click on this URL to open your live application!

---

## Step 11: Test Your Application

1. Open the URL from Step 10 in a new browser tab
2. You should see the RFP Automation dashboard
3. Try these things:
   - Click **"RFPs"** in the sidebar to see the sample RFPs
   - Click on one of the RFPs to view details
   - Click **"Dashboard"** to see the overview

**🎉 Congratulations! Your application is now live!**

---

## What You Can Do Now

Your application is live and ready for a proof of concept demonstration. Here's what works:

✅ **View and manage RFPs** - Track all your RFPs in one place  
✅ **AI-powered proposal generation** - Create proposals automatically  
✅ **Team collaboration** - Assign team members to RFPs  
✅ **Analytics dashboard** - Monitor performance metrics  

---

## Setting Up Dynamics 365 Integration (Optional)

If you want to sync RFPs to Dynamics 365 Sales CRM, you'll need to set that up separately. This requires:

1. Access to a Dynamics 365 Sales environment
2. Admin permissions to create an app registration in Azure
3. About 30 minutes to configure

**For now, you can skip this** and demonstrate the core RFP automation features. When you're ready to add Dynamics 365, I can provide detailed instructions.

---

## Troubleshooting

### Problem: "Application Error" when opening the URL

**Solution:**
1. Go to Railway dashboard
2. Click on your RFP-Automation2 service
3. Go to "Deployments" tab
4. Check if the latest deployment shows "Success" (green checkmark)
5. If it shows "Failed" (red X), click on it to see the error
6. Most common issue: Missing environment variables - go back to Step 6

### Problem: Database connection error

**Solution:**
1. Make sure you completed Step 5 (connecting database to app)
2. Check that DATABASE_URL variable exists in your Variables tab
3. Try redeploying: Go to Deployments → Click three dots → "Redeploy"

### Problem: Can't see any RFPs

**Solution:**
1. Make sure you completed Step 9 (adding sample data)
2. Go back to the database Query tab and run the INSERT commands again

---

## Monthly Costs Breakdown

Here's what you'll pay on Railway:

| Service | Cost | What It Does |
|---------|------|--------------|
| MySQL Database | ~$5/month | Stores all your RFP data |
| Web Application | ~$5-15/month | Runs your application (scales with traffic) |
| **Total** | **~$10-20/month** | Full application hosting |

**Note:** Railway charges based on actual usage. For a proof of concept with light usage, expect closer to $10/month.

---

## Next Steps for Production

When you're ready to take this to production with real clients:

1. **Custom Domain** - Add your own domain name (e.g., rfp.yourcompany.com)
2. **User Authentication** - Set up proper login system
3. **Dynamics 365 Integration** - Connect to client CRM systems
4. **Backup Strategy** - Set up automated database backups
5. **Monitoring** - Add uptime monitoring and alerts

---

## Getting Help

If you run into any issues:

1. **Check Railway Logs:**
   - Click on your service
   - Go to "Deployments" tab
   - Click on the latest deployment
   - Click "View Logs" to see what's happening

2. **Common Issues:**
   - Application won't start → Check environment variables
   - Database errors → Make sure tables were created (Step 8)
   - Can't access URL → Make sure domain was generated (Step 10)

3. **Need More Help:**
   - Railway has great documentation at [docs.railway.app](https://docs.railway.app)
   - You can also reach out to Railway support through their dashboard

---

## Summary Checklist

Before sharing with clients, make sure:

- ✅ Application is accessible via the Railway URL
- ✅ You can see the dashboard and sample RFPs
- ✅ You can click into an RFP and view details
- ✅ The AI proposal generator loads (even if you don't test it fully)
- ✅ You've noted the monthly cost (~$10-20)

**You're all set!** Your RFP Automation application is live and ready for demonstrations.

---

*Last Updated: October 30, 2025*

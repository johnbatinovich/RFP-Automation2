# Dynamics 365 Sales CRM Integration Setup Guide

**Simple Guide for Non-Technical Users**

This guide will help you connect your RFP Automation application to Microsoft Dynamics 365 Sales CRM. Once connected, new RFPs will automatically create leads in your CRM, and qualified RFPs can create opportunities.

**Time Required:** 30-45 minutes  
**Prerequisites:** Admin access to both Azure Active Directory and Dynamics 365 Sales

---

## What This Integration Does

When enabled, your RFP Automation app will:

- **Automatically create leads** in Dynamics 365 when you add a new RFP
- **Create opportunities** when you mark an RFP as qualified
- **Sync RFP details** including company name, value, due date, and requirements
- **Keep data synchronized** between your app and CRM

---

## Part 1: Register Your Application in Azure

### Step 1: Access Azure Portal

1. Open Chrome and go to [portal.azure.com](https://portal.azure.com)
2. Sign in with your Microsoft work account (the same one you use for Dynamics 365)
3. You should see the Azure Portal dashboard

### Step 2: Navigate to App Registrations

1. In the search bar at the top, type **"App registrations"**
2. Click on **"App registrations"** in the results
3. Click the **"+ New registration"** button at the top

### Step 3: Register the Application

Fill in these details:

**Name:**
```
RFP Automation
```

**Supported account types:**
- Select **"Accounts in this organizational directory only"**
- (This should show your organization name)

**Redirect URI:**
- Leave this blank for now
- Click **"Register"** button at the bottom

### Step 4: Save Your Application Details

After registration, you'll see an overview page. **Write down these two values** (you'll need them later):

1. **Application (client) ID**
   - Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
   - Copy this and save it in a note

2. **Directory (tenant) ID**
   - Example: `9876fedc-ba09-8765-4321-0fedcba98765`
   - Copy this and save it in a note

---

## Part 2: Create a Client Secret

### Step 5: Generate a Secret Key

1. On the left sidebar, click **"Certificates & secrets"**
2. Click the **"+ New client secret"** button
3. In the popup:
   - **Description:** Type `RFP Automation Secret`
   - **Expires:** Select **"24 months"** (or your company's policy)
4. Click **"Add"**

### Step 6: Save the Secret Value

**⚠️ IMPORTANT:** You can only see this value once!

1. You'll see a new secret appear with a **"Value"** column
2. Click the **copy icon** next to the Value
3. **Paste this somewhere safe immediately** (like a password manager or secure note)
4. This is your **Client Secret** - you'll need it later

---

## Part 3: Set API Permissions

### Step 7: Add Dynamics 365 Permissions

1. On the left sidebar, click **"API permissions"**
2. Click **"+ Add a permission"**
3. In the panel that opens:
   - Scroll down and click **"Dynamics CRM"** (or **"Dataverse"**)
   - Click **"Delegated permissions"**
   - Check the box for **"user_impersonation"**
   - Click **"Add permissions"** at the bottom

### Step 8: Grant Admin Consent

**Note:** This step requires admin privileges. If you're not an admin, you'll need to ask your IT administrator.

1. Back on the API permissions page
2. Click the **"Grant admin consent for [Your Organization]"** button
3. Click **"Yes"** in the confirmation popup
4. You should see green checkmarks appear next to the permission

---

## Part 4: Configure Dynamics 365

### Step 9: Find Your Dynamics 365 URL

1. Open a new tab and go to your Dynamics 365 Sales
2. Look at the URL in your browser's address bar
3. It should look like: `https://yourcompany.crm.dynamics.com`
4. **Copy everything up to `.com`** and save it
   - Example: `https://yourcompany.crm.dynamics.com`

### Step 10: Create Application User (Optional but Recommended)

This step creates a dedicated user account for the RFP Automation app.

1. In Dynamics 365, click the **gear icon** (Settings) in the top right
2. Go to **"Advanced Settings"**
3. Navigate to **Settings** → **Security** → **Users**
4. Change the view dropdown to **"Application Users"**
5. Click **"+ New"**
6. Fill in:
   - **User Name:** `rfpautomation@yourcompany.com`
   - **Application ID:** Paste the Application (client) ID from Step 4
   - **Full Name:** `RFP Automation App`
7. Click **"Save"**
8. Click **"Manage Roles"**
9. Select **"Sales Manager"** or **"System Administrator"**
10. Click **"OK"**

---

## Part 5: Add Settings to Railway

Now we'll add the Dynamics 365 connection details to your Railway application.

### Step 11: Go to Railway Dashboard

1. Open [railway.app](https://railway.app) in Chrome
2. Sign in to your account
3. Click on your **RFP Automation** project
4. Click on the **"RFP-Automation2"** service

### Step 12: Add Dynamics 365 Variables

1. Go to the **"Variables"** tab
2. Click **"+ New Variable"** and add each of these:

**Variable 1: Enable Integration**
- **Name:** `ENABLE_DYNAMICS_365_INTEGRATION`
- **Value:** `true`
- Click **"Add"**

**Variable 2: Tenant ID**
- **Name:** `DYNAMICS_365_TENANT_ID`
- **Value:** Paste the Directory (tenant) ID from Step 4
- Click **"Add"**

**Variable 3: Client ID**
- **Name:** `DYNAMICS_365_CLIENT_ID`
- **Value:** Paste the Application (client) ID from Step 4
- Click **"Add"**

**Variable 4: Client Secret**
- **Name:** `DYNAMICS_365_CLIENT_SECRET`
- **Value:** Paste the secret value from Step 6
- Click **"Add"**

**Variable 5: Environment URL**
- **Name:** `DYNAMICS_365_ENVIRONMENT_URL`
- **Value:** Paste your Dynamics 365 URL from Step 9
- Click **"Add"**

**Variable 6: API Version**
- **Name:** `DYNAMICS_365_API_VERSION`
- **Value:** `v9.2`
- Click **"Add"**

**Variable 7: Auto Create Leads**
- **Name:** `AUTO_CREATE_LEADS`
- **Value:** `true`
- Click **"Add"**

### Step 13: Redeploy Your Application

1. Go to the **"Deployments"** tab
2. Click the **three dots (⋮)** on the latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes for the deployment to complete

---

## Part 6: Test the Integration

### Step 14: Test the Connection

1. Open your RFP Automation application (the Railway URL)
2. Click **"Settings"** in the left sidebar
3. Click on the **"Integrations"** tab
4. You should see **"Dynamics 365 Sales CRM"** with a green **"Enabled"** badge
5. Click the **"Test Connection"** button
6. You should see a success message

### Step 15: Test Creating a Lead

1. Go to **"RFPs"** in the sidebar
2. Click on any RFP to open the details
3. Click the **"Sync to CRM"** button (cloud icon)
4. Select **"Create as Lead"**
5. You should see a success message

### Step 16: Verify in Dynamics 365

1. Open Dynamics 365 Sales in a new tab
2. Go to **"Sales"** → **"Leads"**
3. You should see a new lead with the RFP information
4. The lead should have:
   - Subject: The RFP title
   - Company: The company name from the RFP
   - Estimated Value: The RFP value
   - Estimated Close Date: The RFP due date

---

## How to Use the Integration

### Creating Leads Automatically

When you create a new RFP in the application, it will automatically create a lead in Dynamics 365 if you have `AUTO_CREATE_LEADS=true` set.

### Creating Opportunities

1. Open an RFP that's qualified (status: "in_progress" or "under_review")
2. Click **"Sync to CRM"**
3. Select **"Create as Opportunity"**
4. The opportunity will appear in Dynamics 365 Sales

### Bulk Sync

You can sync multiple RFPs at once:
1. Go to the RFPs list
2. Select multiple RFPs (checkbox feature - coming soon)
3. Click **"Bulk Sync to CRM"**

---

## Troubleshooting

### Error: "Failed to authenticate with Dynamics 365"

**Possible causes:**
1. **Wrong Tenant ID or Client ID**
   - Go back to Azure Portal → App registrations
   - Verify the IDs match what you entered in Railway

2. **Wrong Client Secret**
   - The secret may have been copied incorrectly
   - Generate a new secret in Azure (Part 2, Step 5)
   - Update the `DYNAMICS_365_CLIENT_SECRET` in Railway

3. **Admin consent not granted**
   - Go to Azure Portal → Your app → API permissions
   - Make sure there's a green checkmark under "Status"
   - If not, ask your admin to grant consent

### Error: "Insufficient permissions"

**Solution:**
1. Check that the Application User in Dynamics 365 has the right security role
2. Go to Dynamics 365 → Settings → Security → Users
3. Find the application user
4. Make sure it has "Sales Manager" or "System Administrator" role

### Error: "Environment URL is incorrect"

**Solution:**
1. Verify your Dynamics 365 URL
2. It should be in format: `https://yourorg.crm.dynamics.com`
3. No trailing slash at the end
4. Must include `https://`

### Connection test works but leads aren't being created

**Solution:**
1. Check the Railway logs:
   - Go to Railway → Your service → Deployments
   - Click on latest deployment → View Logs
   - Look for error messages
2. Make sure `ENABLE_DYNAMICS_365_INTEGRATION=true`
3. Try manually syncing an RFP using the "Sync to CRM" button

---

## Data Mapping Reference

Here's how RFP data maps to Dynamics 365:

| RFP Field | Dynamics 365 Lead Field | Dynamics 365 Opportunity Field |
|-----------|------------------------|--------------------------------|
| Title | Subject | Name |
| Company | Company Name | - |
| Owner | First Name / Last Name | - |
| Value | Estimated Value | Estimated Revenue |
| Due Date | Estimated Close Date | Estimated Close Date |
| Requirements | Description | Description |
| Status | Lead Quality Code | Sales Stage |

---

## Security Best Practices

1. **Protect Your Client Secret**
   - Never share it in emails or chat
   - Store it securely (password manager)
   - Rotate it every 6-12 months

2. **Use Application User**
   - Don't use a personal user account
   - Create a dedicated application user (Step 10)
   - This makes auditing easier

3. **Limit Permissions**
   - Only grant the minimum required permissions
   - Review permissions quarterly
   - Remove access when no longer needed

4. **Monitor Usage**
   - Check Dynamics 365 audit logs regularly
   - Review which RFPs are being synced
   - Watch for unusual activity

---

## Multi-Tenant Setup (For SaaS)

When you have multiple clients, each with their own Dynamics 365:

### Option 1: Separate Railway Projects
- Create a separate Railway project for each client
- Each has its own environment variables
- Easiest to manage initially

### Option 2: Database Configuration
- Store Dynamics 365 credentials in your database
- Add a "tenant" table with client-specific settings
- Requires custom code changes

**Recommendation:** Start with Option 1 for your proof of concept. Move to Option 2 when you have 5+ clients.

---

## Cost Considerations

The Dynamics 365 integration itself doesn't add cost to Railway, but consider:

1. **API Rate Limits**
   - Dynamics 365 allows 6,000 API calls per 5 minutes
   - For typical usage, this is more than enough
   - No additional cost from Microsoft

2. **Railway Compute**
   - Minimal impact on Railway costs
   - API calls are lightweight
   - Expect less than $1/month additional cost

---

## Summary Checklist

Before going live with Dynamics 365 integration:

- ✅ App registered in Azure Active Directory
- ✅ Client secret created and saved securely
- ✅ API permissions granted and admin consent given
- ✅ Application user created in Dynamics 365 with proper roles
- ✅ All environment variables added to Railway
- ✅ Application redeployed successfully
- ✅ Connection test passes
- ✅ Test lead created successfully
- ✅ Lead appears in Dynamics 365 with correct data

---

## Getting Help

If you need assistance:

1. **Azure/Dynamics 365 Issues:**
   - Contact your IT administrator
   - Microsoft Support: [support.microsoft.com](https://support.microsoft.com)

2. **Integration Issues:**
   - Check Railway logs for error messages
   - Verify all environment variables are correct
   - Test connection in Settings → Integrations

3. **Questions About Setup:**
   - Refer back to this guide
   - Check the main README.md for technical details

---

**Congratulations!** Your RFP Automation application is now fully integrated with Dynamics 365 Sales CRM. New RFPs will automatically sync to your CRM, saving time and ensuring data consistency.

---

*Last Updated: October 30, 2025*

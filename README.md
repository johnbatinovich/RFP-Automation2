# RFP Automation with Dynamics 365 Integration

A comprehensive RFP (Request for Proposal) automation system for media advertising companies, featuring AI-powered document analysis, proposal generation, and seamless integration with Microsoft Dynamics 365 Sales CRM.

## Features

### Core Functionality
- **RFP Management** - Create, track, and manage RFPs throughout their lifecycle
- **AI-Powered Analysis** - Automatically extract requirements and questions from RFP documents
- **Proposal Generation** - Generate professional proposals using AI and company knowledge base
- **Quality Assessment** - Evaluate proposals across multiple dimensions with AI scoring
- **Team Collaboration** - Assign team members and track progress
- **Analytics Dashboard** - Monitor KPIs, win rates, and performance metrics

### Dynamics 365 Sales CRM Integration
- **Automatic Lead Creation** - New RFPs automatically create leads in Dynamics 365
- **Opportunity Management** - Convert qualified RFPs to opportunities in your CRM
- **Bi-directional Sync** - Keep RFP data synchronized with Dynamics 365
- **Multi-tenant Support** - Built for SaaS deployment with per-client CRM connections

## Technology Stack

- **Frontend**: React 19, TypeScript, TailwindCSS, Radix UI
- **Backend**: Node.js, Express, tRPC
- **Database**: MySQL with Drizzle ORM
- **AI**: OpenAI API with structured outputs
- **CRM Integration**: Microsoft Dynamics 365 Sales via Web API
- **Authentication**: OAuth 2.0 with MSAL
- **Deployment**: Railway (hosting), GitHub (version control)

## Getting Started

### Prerequisites

- Node.js 22.x or higher
- pnpm package manager
- MySQL database
- OpenAI API key
- (Optional) Dynamics 365 Sales environment

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd rfp-automation
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure the following:

   **Required Variables:**
   ```env
   # Database
   DATABASE_URL=mysql://user:password@host:3306/database_name
   
   # Authentication
   JWT_SECRET=your-secure-jwt-secret
   
   # OpenAI (for AI features)
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_API_URL=https://api.openai.com/v1
   
   # Application
   PORT=3000
   VITE_APP_TITLE="RFP Automation"
   ```

   **Optional - Dynamics 365 Integration:**
   ```env
   # Enable Dynamics 365 integration
   ENABLE_DYNAMICS_365_INTEGRATION=true
   
   # Azure AD App Registration details
   DYNAMICS_365_TENANT_ID=your-azure-tenant-id
   DYNAMICS_365_CLIENT_ID=your-app-client-id
   DYNAMICS_365_CLIENT_SECRET=your-app-client-secret
   
   # Dynamics 365 environment URL
   DYNAMICS_365_ENVIRONMENT_URL=https://yourorg.crm.dynamics.com
   DYNAMICS_365_API_VERSION=v9.2
   
   # Feature flags
   AUTO_CREATE_LEADS=true
   AUTO_CREATE_OPPORTUNITIES=false
   ```

4. **Initialize the database**
   ```bash
   pnpm db:push
   ```
   
   Optionally load seed data:
   ```bash
   mysql -u user -p database_name < scripts/seed-data.sql
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```
   
   The application will be available at `http://localhost:3000`

## Dynamics 365 Setup

To enable Dynamics 365 Sales CRM integration, follow these steps:

### 1. Register Application in Azure AD

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: RFP Automation
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web - `https://your-app-url.com` (or `http://localhost:3000` for development)
5. Click **Register**

### 2. Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Dynamics CRM** (or **Dataverse**)
4. Select **Delegated permissions**
5. Check **user_impersonation**
6. Click **Add permissions**
7. Click **Grant admin consent** (requires admin privileges)

### 3. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description and set expiration
4. Click **Add**
5. **Copy the secret value immediately** (you won't be able to see it again)

### 4. Configure Application User in Dynamics 365

1. Go to your Dynamics 365 environment
2. Navigate to **Settings** > **Security** > **Users**
3. Create a new **Application User**
4. Assign appropriate security roles (e.g., Sales Manager, System Administrator)

### 5. Update Environment Variables

Add the following to your `.env` file:

```env
ENABLE_DYNAMICS_365_INTEGRATION=true
DYNAMICS_365_TENANT_ID=<from Azure AD>
DYNAMICS_365_CLIENT_ID=<from App Registration>
DYNAMICS_365_CLIENT_SECRET=<from Client Secret>
DYNAMICS_365_ENVIRONMENT_URL=https://yourorg.crm.dynamics.com
```

### 6. Test Connection

1. Start the application
2. Navigate to **Settings** > **Integrations**
3. Click **Test Connection** under Dynamics 365 Sales CRM
4. Verify successful connection

## Deployment to Railway

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Manual Deployment

1. **Create Railway Account**
   - Sign up at [railway.app](https://railway.app)

2. **Create New Project**
   - Click **New Project**
   - Select **Deploy from GitHub repo**
   - Connect your GitHub account and select the repository

3. **Add MySQL Database**
   - In your project, click **New**
   - Select **Database** > **MySQL**
   - Railway will automatically provision a MySQL instance

4. **Configure Environment Variables**
   - Go to your service settings
   - Click **Variables**
   - Add all required environment variables from `.env.example`
   - Railway automatically provides `DATABASE_URL` from the MySQL service

5. **Deploy**
   - Railway will automatically build and deploy your application
   - Access your app at the provided Railway URL

### Environment Variables for Railway

Add these in Railway dashboard under **Variables**:

```
JWT_SECRET=<generate-secure-random-string>
OPENAI_API_KEY=<your-openai-key>
OPENAI_API_URL=https://api.openai.com/v1
VITE_APP_TITLE=RFP Automation
ENABLE_DYNAMICS_365_INTEGRATION=true
DYNAMICS_365_TENANT_ID=<your-tenant-id>
DYNAMICS_365_CLIENT_ID=<your-client-id>
DYNAMICS_365_CLIENT_SECRET=<your-client-secret>
DYNAMICS_365_ENVIRONMENT_URL=<your-dynamics-url>
```

## Project Structure

```
rfp-automation/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
│   └── index.html
├── server/                # Backend Node.js application
│   ├── _core/            # Core server utilities
│   │   ├── dynamics365Auth.ts    # Dynamics 365 authentication
│   │   ├── dynamics365Api.ts     # Dynamics 365 API client
│   │   ├── llm.ts                # OpenAI integration
│   │   └── trpc.ts               # tRPC configuration
│   ├── aiRouter.ts       # AI feature endpoints
│   ├── dynamics365Router.ts      # Dynamics 365 endpoints
│   ├── routers.ts        # Main API router
│   └── db.ts             # Database operations
├── drizzle/              # Database schema and migrations
│   ├── schema.ts         # Table definitions
│   └── migrations/       # SQL migration files
├── shared/               # Shared types and constants
├── scripts/              # Utility scripts
│   └── seed-data.sql     # Sample data
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── railway.json          # Railway deployment config
├── nixpacks.toml         # Nixpacks build config
└── README.md             # This file
```

## API Endpoints

### RFPs
- `POST /api/rfps.create` - Create new RFP
- `GET /api/rfps.list` - List all RFPs
- `GET /api/rfps.getById` - Get RFP by ID
- `PATCH /api/rfps.update` - Update RFP

### Proposals
- `POST /api/proposals.create` - Create proposal
- `GET /api/proposals.getByRFPId` - Get proposal for RFP
- `PATCH /api/proposals.update` - Update proposal
- `POST /api/proposals.generateResponse` - Generate AI response

### AI Operations
- `POST /api/ai.analyzeDocument` - Analyze RFP document
- `POST /api/ai.extractQuestions` - Extract questions from RFP
- `POST /api/ai.generateResponses` - Generate responses to questions
- `POST /api/ai.qualityCheck` - Assess proposal quality

### Dynamics 365
- `GET /api/dynamics365.isEnabled` - Check if integration is enabled
- `POST /api/dynamics365.testConnection` - Test CRM connection
- `POST /api/dynamics365.createLeadFromRFP` - Create lead from RFP
- `POST /api/dynamics365.createOpportunityFromRFP` - Create opportunity from RFP
- `POST /api/dynamics365.syncRFP` - Sync RFP to CRM
- `POST /api/dynamics365.bulkSync` - Bulk sync multiple RFPs

## Usage

### Creating an RFP

1. Navigate to **RFPs** page
2. Click **Create RFP**
3. Fill in the details:
   - Title
   - Company name
   - Due date
   - Estimated value
   - Owner
4. Click **Create**

### Syncing to Dynamics 365

1. Open an RFP detail page
2. Click **Sync to CRM** button
3. Choose sync option:
   - **Auto** - Creates lead for new RFPs, opportunity for others
   - **Create as Lead** - Always create as lead
   - **Create as Opportunity** - Always create as opportunity
4. Verify sync in Dynamics 365

### Generating Proposals

1. Open an RFP
2. Click **Edit Proposal**
3. Click **Extract Questions** to analyze RFP
4. Click **Generate Responses** to create AI-powered answers
5. Edit and refine the content
6. Click **Run Quality Check** to assess quality
7. Save or submit the proposal

## Multi-Tenant SaaS Deployment

This application is designed for multi-tenant SaaS deployment:

### Tenant Isolation

- Each client has their own Dynamics 365 credentials
- Store tenant-specific configuration in database
- Use tenant ID to route requests to correct CRM instance

### Scaling Considerations

1. **Database**: Use connection pooling and read replicas
2. **API Rate Limits**: Implement per-tenant rate limiting
3. **Token Caching**: Cache Dynamics 365 tokens per tenant
4. **Background Jobs**: Use queue system for bulk operations
5. **Monitoring**: Implement per-tenant usage tracking

## Troubleshooting

### Dynamics 365 Connection Issues

**Error: "Failed to authenticate with Dynamics 365"**
- Verify tenant ID, client ID, and client secret are correct
- Ensure app has proper API permissions in Azure AD
- Check that admin consent has been granted
- Verify environment URL is correct (no trailing slash)

**Error: "Insufficient permissions"**
- Check application user in Dynamics 365 has required security roles
- Verify API permissions include user_impersonation
- Ensure the app registration is not disabled

### Database Issues

**Error: "Connection refused"**
- Verify DATABASE_URL is correct
- Check MySQL server is running
- Ensure database exists and user has permissions

### Build Issues

**Error: "Module not found"**
- Run `pnpm install` to install dependencies
- Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
- Check Node.js version: `node --version` (should be 22.x)

## Contributing

This is a proprietary application. Please contact the development team for contribution guidelines.

## License

Proprietary - All rights reserved

## Support

For support and questions:
- Email: support@your-company.com
- Documentation: https://docs.your-company.com
- Issues: Create an issue in the GitHub repository

## Changelog

### Version 1.0.0 (Current)
- Initial release
- RFP management system
- AI-powered proposal generation
- Dynamics 365 Sales CRM integration
- Team collaboration features
- Analytics dashboard

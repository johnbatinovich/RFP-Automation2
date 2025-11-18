# Technical Deployment Guide

## Recent Updates

### Enhanced Error Logging & Diagnostics (Nov 17, 2025)

Added comprehensive health check system and improved error logging to diagnose AI analysis failures.

**New Files:**
- `/server/healthRouter.ts` - Health check API endpoints
- `/client/src/pages/HealthCheck.tsx` - Diagnostic UI page

**Modified Files:**
- `/server/aiRouter.ts` - Enhanced error logging with environment info
- `/server/routers.ts` - Added health router
- `/client/src/App.tsx` - Added health check route

## Quick Deployment to Railway

### 1. Commit and Push Changes

```bash
cd /home/ubuntu
git add .
git commit -m "Add health check system and enhanced error logging"
git push origin main
```

### 2. Verify Environment Variables in Railway

Go to Railway dashboard → Your project → Variables tab

**Required Variables:**
- `OPENAI_API_KEY` - Your OpenAI API key (sk-...)
- `DATABASE_URL` - Auto-configured by Railway
- `NODE_ENV` - production

**Optional Variables:**
- `OPENAI_API_BASE` - Defaults to https://api.openai.com/v1
- `JWT_SECRET` - For session management
- `VITE_APP_TITLE` - Application title

### 3. Access Health Check Page

After deployment completes:

```
https://rfp-automation2-production.up.railway.app/health
```

This page will show:
- ✅ System status
- ✅ API key configuration
- ✅ Database connection status
- ✅ OpenAI API test button

### 4. Diagnose Issues

Click "Run OpenAI Test" button to test the API connection.

**If test passes:** ✅ AI analysis should work
**If test fails:** ❌ Check the error message for details

## Common Issues and Solutions

### Issue: OpenAI API Not Configured

**Symptoms:**
- Health check shows "Not Configured" for OpenAI
- Key length shows 0 characters

**Solution:**
1. Go to Railway dashboard
2. Click on your project
3. Go to Variables tab
4. Add `OPENAI_API_KEY` variable
5. Paste your API key (starts with sk-)
6. Redeploy

### Issue: API Test Fails with 401 Unauthorized

**Symptoms:**
- Test shows "Failed"
- Error message: "401 Unauthorized"

**Solution:**
- API key is invalid or expired
- Get new key from https://platform.openai.com/api-keys
- Update `OPENAI_API_KEY` in Railway
- Redeploy

### Issue: API Test Fails with 429 Rate Limit

**Symptoms:**
- Error message: "429 Too Many Requests"

**Solution:**
- Exceeded OpenAI API quota
- Check usage at https://platform.openai.com/usage
- Add credits to OpenAI account
- Wait for rate limit reset

### Issue: Network Error

**Symptoms:**
- Error message contains "fetch failed" or "ECONNREFUSED"

**Solution:**
- Check Railway network connectivity
- Verify `OPENAI_API_BASE` is correct
- Try removing `OPENAI_API_BASE` to use default

## Health Check API Reference

### GET /api/trpc/health.check

Returns system configuration and status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T...",
  "environment": {
    "nodeEnv": "production",
    "isProduction": true
  },
  "apiKeys": {
    "openai": {
      "configured": true,
      "length": 164,
      "base": "https://api.openai.com/v1"
    }
  },
  "database": {
    "configured": true
  }
}
```

### GET /api/trpc/health.testOpenAI

Tests OpenAI API connection.

**Success Response:**
```json
{
  "success": true,
  "model": "gpt-4o-mini-2024-07-18",
  "content": "API test successful.",
  "usage": {
    "total_tokens": 33
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "LLM invoke failed: 401 Unauthorized",
  "stack": "Error: ...",
  "environment": {
    "hasOpenAIKey": false,
    "openAIKeyLength": 0,
    "openAIBase": "https://api.openai.com/v1"
  }
}
```

## Testing Locally

### 1. Set Environment Variables

```bash
export OPENAI_API_KEY="your-key-here"
export DATABASE_URL="postgresql://..."
```

### 2. Install Dependencies

```bash
cd /home/ubuntu
pnpm install
```

### 3. Build

```bash
pnpm build
```

### 4. Run

```bash
node dist/index.js
```

### 5. Test Health Check

```bash
# Check system status
curl http://localhost:5000/api/trpc/health.check

# Test OpenAI API
curl http://localhost:5000/api/trpc/health.testOpenAI
```

## Monitoring and Logs

### Railway Logs

1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments" tab
4. Click on latest deployment
5. Click "View Logs"

### Look for These Log Messages

**Success:**
```
✅ API Test Successful!
Model: gpt-4o-mini-2024-07-18
```

**Failure:**
```
❌ API Request Failed:
Status: 401
Error: {...}
```

**Environment Check:**
```
Environment check: {
  hasOpenAIKey: true,
  openAIKeyLength: 164,
  openAIBase: 'https://api.openai.com/v1',
  hasForgeKey: false
}
```

## Post-Deployment Checklist

- [ ] Health check page loads
- [ ] OpenAI API shows "Configured"
- [ ] OpenAI API test passes
- [ ] Database shows "Configured"
- [ ] Can upload RFP documents
- [ ] Can analyze RFP documents
- [ ] Can generate proposals
- [ ] Can check proposal quality
- [ ] Team collaboration works

## Rollback Procedure

If deployment fails:

1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments" tab
4. Find previous successful deployment
5. Click three dots (...)
6. Click "Redeploy"

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key (sk-...) |
| `OPENAI_API_BASE` | No | https://api.openai.com/v1 | OpenAI API endpoint |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `NODE_ENV` | No | development | Environment mode |
| `JWT_SECRET` | No | - | Session secret |
| `VITE_APP_TITLE` | No | RFP Automation | App title |
| `PORT` | No | 5000 | Server port |

*Required for OpenAI functionality

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Railway Platform                │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Web App    │───▶│  PostgreSQL  │  │
│  │  (Node.js)   │    │   Database   │  │
│  └──────┬───────┘    └──────────────┘  │
│         │                               │
│         ▼                               │
│  ┌──────────────┐                      │
│  │  OpenAI API  │                      │
│  │ (External)   │                      │
│  └──────────────┘                      │
│                                         │
└─────────────────────────────────────────┘
```

## Support

For issues:

1. Check `/health` page first
2. Review Railway logs
3. Test API key at https://platform.openai.com/playground
4. Verify environment variables
5. Check OpenAI account credits

## Next Steps

After successful deployment:

1. Test all features end-to-end
2. Add sample RFP data
3. Test AI analysis
4. Test proposal generation
5. Test quality checking
6. Monitor OpenAI API usage
7. Monitor Railway resource usage

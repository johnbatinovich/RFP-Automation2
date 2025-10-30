# Quick Start - Deploy in 15 Minutes

**Your RFP Automation is ready to deploy!**

---

## 🚀 Fast Track Deployment

### What You Need
- ✅ Railway account (you have this)
- ✅ OpenAI API key (you have this)
- ✅ 15 minutes

### Cost
**~$10-20/month** for proof of concept

---

## 📋 Deployment Steps

### 1. Create Railway Project
- Go to [railway.app](https://railway.app)
- Click **"New Project"** → **"Deploy from GitHub repo"**
- Select **"RFP-Automation2"**

### 2. Add MySQL Database
- Click **"+ New"** → **"Database"** → **"Add MySQL"**

### 3. Connect Database
- Click your app service → **"Variables"** tab
- Click **"+ New Variable"** → **"Add Reference"** → Select **"DATABASE_URL"**

### 4. Add These Settings
Click **"+ New Variable"** for each:

| Variable Name | Value |
|--------------|-------|
| `JWT_SECRET` | `rfp-automation-secret-key-2025` |
| `OPENAI_API_KEY` | Your OpenAI key (sk-...) |
| `OPENAI_API_URL` | `https://api.openai.com/v1` |
| `VITE_APP_TITLE` | `RFP Automation` |
| `PORT` | `3000` |

### 5. Wait for Deployment
- Go to **"Deployments"** tab
- Wait 3-5 minutes for green checkmark

### 6. Create Database Tables
- Click **MySQL** service → **"Data"** tab → **"Query"**
- Copy/paste from `DEPLOYMENT_GUIDE.md` Step 8
- Click **"Run Query"**

### 7. Add Sample Data
- Still in Query tab
- Copy/paste from `DEPLOYMENT_GUIDE.md` Step 9
- Click **"Run Query"**

### 8. Get Your URL
- Click your app service → **"Settings"** tab
- Scroll to **"Domains"** → Click **"Generate Domain"**
- Open the URL - **You're live!** 🎉

---

## 📚 Full Guides

- **Complete Deployment:** See `DEPLOYMENT_GUIDE.md`
- **Dynamics 365 Setup:** See `DYNAMICS365_SETUP_GUIDE.md`
- **Technical Details:** See `README.md`

---

## 🆘 Need Help?

### App won't start?
→ Check all variables from Step 4 are added

### Database error?
→ Make sure you ran the queries in Steps 6 & 7

### Can't access URL?
→ Make sure domain was generated in Step 8

---

## ✅ Success Checklist

Before showing clients:

- [ ] Can access the Railway URL
- [ ] See dashboard with sample RFPs
- [ ] Can click into an RFP
- [ ] Settings page loads
- [ ] Know your monthly cost (~$10-20)

---

**Ready to add Dynamics 365?**  
Follow `DYNAMICS365_SETUP_GUIDE.md` (30 minutes)

---

*Your GitHub Repo:* https://github.com/johnbatinovich/RFP-Automation2

# KAIROS Deployment Guide

Deploy KAIROS documentation on web. Choose one option.

## Option 1: Vercel (Recommended - 5 min)

**Best for:** Private repos, custom domains, auto-deploy

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Setup GitHub repo
git init
git add .
git commit -m "feat: KAIROS Framework v2.0"
git remote add origin https://github.com/comm-it/kairos.git
git push -u origin main

# 3. Deploy
vercel --prod
```

**When Vercel prompts you, answer:**

```
? Which existing project do you want to connect?
→ Create a new project

? What's your project's name?
→ kairos

? In which directory is your code located?
→ docs

? Want to modify these settings?
→ N (press N, don't modify)

? Automatically detected project settings
→ Y (yes, deploy with these settings)
```

**Key Points:**
- **Root Directory: `docs`** (where the documentation is)
- **Build Command:** Leave blank
- **Output Directory:** Leave blank

Vercel will serve the site from the `docs/` folder.

**Result:** Site on Vercel (kairos-xxx.vercel.app)
**Custom domain:** Yes, add kairos.dev in Vercel dashboard after deployment

---

## Option 1b: Vercel Web Import (No CLI)

If you prefer not to use CLI:

```
1. Go to vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Click "Import Git Repository"
5. Find and select: comm-it/kairos
6. Project settings appear:
   - Root Directory: docs
   - Build Command: (leave blank)
   - Output Directory: (leave blank)
7. Click "Deploy"
8. Wait 1-2 minutes
9. Site is live!
```

**Key:** Set Root Directory to `docs`

---

## Option 2: GitHub Pages (Free but LIMITED)

**Limitations:**
- Only works with PUBLIC repositories
- Free for public repos
- Private repos require GitHub Pro ($4/month)

**If your repo is PUBLIC:**

```bash
# 1. Setup repo
git init
git add .
git commit -m "feat: KAIROS Framework v2.0"
git remote add origin https://github.com/comm-it/kairos.git
git push -u origin main

# 2. Enable Pages (repo must be PUBLIC)
# In GitHub repo:
# Settings → Pages
# Source: Deploy from a branch
# Branch: main
# Folder: /docs
# Click Save
```

**Cost:** Free (only for public repos)
**Result:** Site on GitHub Pages (comm-it.github.io/kairos)
**Custom domain:** Yes (add in Pages settings)
**Works with:** Public repos ONLY

---

## Option 3: Netlify (Free + Flexible)

**Best for:** Any repo type, custom domains

```bash
# 1. Setup repo
git init
git add .
git commit -m "feat: KAIROS Framework v2.0"
git remote add origin https://github.com/comm-it/kairos.git
git push -u origin main

# 2. Connect to Netlify
# - Go to netlify.com
# - Click "Add new site"
# - Select "Import an existing project"
# - Choose GitHub
# - Select your kairos repository
```

**When Netlify asks about build settings:**
- Base directory: docs
- Build command: (leave blank)
- Publish directory: (leave blank)
- Click Deploy

**Cost:** Free
**Result:** Site on Netlify (with custom domain support)
**Custom domain:** Yes
**Works with:** Public AND private repos

---

## Comparison Table

| Option | Cost | Time | Private Repos | Custom Domain |
|--------|------|------|---------------|---------------|
| **Vercel** | Free | 5 min | ✅ Yes | ✅ Yes |
| **GitHub Pages** | Free* | 10 min | ❌ No (needs Pro) | ✅ Yes |
| **Netlify** | Free | 10 min | ✅ Yes | ✅ Yes |

*GitHub Pages is free only for public repos

---

## Which Should I Choose?

**If repo is PUBLIC:**
→ Use GitHub Pages (simplest)

**If repo is PRIVATE:**
→ Use Vercel (recommended) or Netlify

**Want fastest/simplest overall:**
→ Use Vercel

---

## Step-by-Step: Vercel CLI

```bash
# 1. Install Node.js (if not installed)
# Download from nodejs.org

# 2. Install Vercel CLI
npm install -g vercel

# 3. Extract and navigate to kairos folder
unzip kairos-framework-v2.0.zip
cd kairos

# 4. Create GitHub repo
git init
git add .
git commit -m "feat: KAIROS Framework v2.0"

# 5. Create repo on GitHub (private or public)
# Get URL: https://github.com/comm-it/kairos.git

# 6. Connect to GitHub
git remote add origin https://github.com/comm-it/kairos.git
git branch -M main
git push -u origin main

# 7. Deploy with Vercel
vercel --prod

# 8. When prompted:
#    Root directory: docs
#    Build: (leave blank)
#    Output: (leave blank)
#    Deploy: Y

# 9. Wait 1-2 minutes
# Your site is live at: kairos-xxx.vercel.app
```

---

## Step-by-Step: GitHub Pages (Public Repos Only)

```
1. Extract ZIP
   unzip kairos-framework-v2.0.zip
   cd kairos

2. Create PUBLIC repo on GitHub

3. Push code:
   git init
   git add .
   git commit -m "feat: KAIROS v2.0"
   git remote add origin https://github.com/comm-it/kairos.git
   git push -u origin main

4. In GitHub repo, go to Settings
5. Click "Pages"
6. Set:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /docs
7. Click Save
8. Wait 1-2 minutes
9. Your site is at: comm-it.github.io/kairos
```

---

## Step-by-Step: Netlify

```
1. Extract ZIP
   unzip kairos-framework-v2.0.zip
   cd kairos

2. Create repo on GitHub (public or private)

3. Push code:
   git init
   git add .
   git commit -m "feat: KAIROS v2.0"
   git remote add origin https://github.com/comm-it/kairos.git
   git push -u origin main

4. Go to netlify.com

5. Click "Add new site"

6. Select "Import an existing project"

7. Choose GitHub

8. Select your kairos repo

9. When asked for settings:
   - Base directory: docs
   - Build command: (leave blank)
   - Publish directory: (leave blank)

10. Click Deploy

11. Wait 1-2 minutes

12. Your site is live!
```

---

## Key Settings Summary

| Platform | Root/Base Directory | Build Command | Output Directory |
|----------|-------------------|----------------|------------------|
| **Vercel** | `docs` | (blank) | (blank) |
| **GitHub Pages** | /docs (in settings) | N/A | N/A |
| **Netlify** | `docs` | (blank) | (blank) |

---

## After Deployment

1. Visit your deployed site
2. Verify documentation loads (should show KAIROS-FRAMEWORK-DOCUMENTATION.md)
3. Add custom domain (optional):
   - Vercel: Settings → Domains
   - GitHub Pages: Settings → Pages → Custom domain
   - Netlify: Domain Settings
4. Start using KAIROS! 🚀

---

## Troubleshooting

**Vercel - "404 Not Found"**
→ Check Root Directory is set to `docs`
→ Verify docs/KAIROS-FRAMEWORK-DOCUMENTATION.md exists

**GitHub Pages - "Site not deploying"**
→ Repo MUST be PUBLIC
→ Folder in Pages settings MUST be /docs

**Netlify - "Page not found"**
→ Check Base directory is `docs`
→ Verify docs/ folder exists with markdown files

---

## File Structure in ZIP

The ZIP contains this structure, ready to deploy:

```
kairos/
├─ README.md                  (Project overview)
├─ DEPLOYMENT.md              (This file)
├─ agents/                    (7 subagent files)
│  ├─ orchestrator.md
│  ├─ pm-agent.md
│  ├─ architect-agent.md
│  ├─ implementer-agent.md
│  ├─ code-reviewer.md
│  ├─ test-verifier.md
│  └─ release-planner.md
└─ docs/
   └─ KAIROS-FRAMEWORK-DOCUMENTATION.md  (Full documentation)
```

When deploying to Vercel/Netlify:
- **Set Root Directory to: `docs`**
- Vercel will serve from `docs/` folder
- Documentation will be at root of your site


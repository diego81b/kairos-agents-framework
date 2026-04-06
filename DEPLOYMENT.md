# KAIROS Deployment Guide

Deploy KAIROS documentation on web. Choose one option.

## Option 1: Vercel (Recommended - 5 min)

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

# Answer prompts:
# - Project name: kairos
# - Framework: Other
```

**Result:** Site on Vercel (kairos-xxx.vercel.app)
**Custom domain:** Add kairos.dev in Vercel dashboard

---

## Option 2: GitHub Pages (Free - 10 min)

```bash
# 1. Setup repo
git init
git add .
git commit -m "feat: KAIROS Framework v2.0"
git remote add origin https://github.com/comm-it/kairos.git
git push -u origin main

# 2. Enable Pages
# In GitHub repo:
# Settings → Pages
# Source: main branch
# Folder: /docs
```

**Result:** Site on GitHub Pages (comm-it.github.io/kairos)

---

## Option 3: Netlify (Free - 10 min)

```bash
# 1. Setup repo
git init
git add .
git commit -m "feat: KAIROS Framework v2.0"
git remote add origin https://github.com/comm-it/kairos.git
git push -u origin main

# 2. Connect to Netlify
# - Go to netlify.com
# - Click "Connect a repository"
# - Select your repo
# - Set publish directory: ./docs
```

**Result:** Site on Netlify (with custom domain support)

---

## Which Option?

- **Vercel:** Best all-around, custom domain, fast
- **GitHub Pages:** Simplest, free, good for docs
- **Netlify:** Alternative, custom domain support

---

## Verification

After deployment:

```bash
# Check if site loads
curl https://your-domain.com

# Verify documentation shows
# Visit in browser
# Check docs/KAIROS-FRAMEWORK-DOCUMENTATION.md loads
```

---

## Troubleshooting

**Site not loading?**
- Check repo is public
- Verify domain/DNS settings
- Check deployment logs

**Documentation not visible?**
- Verify docs/ folder exists in repo
- Check docs/KAIROS-FRAMEWORK-DOCUMENTATION.md file

---

## Summary

1. Create GitHub repo
2. Choose deployment option (Vercel recommended)
3. Deploy (5-10 minutes)
4. Visit site
5. Done! ✅

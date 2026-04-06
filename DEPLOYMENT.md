# KAIROS Deployment Guide

KAIROS documentation is a **VitePress site**. Every deployment platform must run the build step first.

```
Build command:    npm run docs:build
Output directory: docs/.vitepress/dist
Node version:     20
```

`vercel.json` and `netlify.toml` at the repo root already encode these settings — no manual configuration needed on either platform.

---

## Local Development

```bash
npm install
npm run docs:dev       # dev server at http://localhost:5173
npm run docs:build     # production build → docs/.vitepress/dist
npm run docs:preview   # preview the production build locally
```

---

## Option 1: Vercel (Recommended — 5 min)

**Best for:** Private repos, custom domains, auto-deploy on push

`vercel.json` is already present with the correct settings.

### Via CLI

```bash
npm install -g vercel
vercel --prod
```

Vercel reads `vercel.json` automatically — accept all defaults when prompted.

### Via Web (No CLI)

```
1. Go to vercel.com → New Project
2. Import your GitHub repository
3. Vercel detects vercel.json and pre-fills all settings:
   - Build Command:      npm run docs:build
   - Output Directory:   docs/.vitepress/dist
   - Install Command:    npm install
4. Click Deploy
```

**Result:** Live at `kairos-xxx.vercel.app`
**Auto-deploy:** Yes — every push to `main` triggers a new deployment
**Custom domain:** Vercel Dashboard → Settings → Domains

---

## Option 2: Netlify (Free + Flexible)

**Best for:** Any repo type, flexible redirects, form handling

`netlify.toml` is already present with the correct settings.

### Via Web

```
1. Go to netlify.com → Add new site → Import an existing project
2. Choose GitHub → Select your kairos repository
3. Netlify detects netlify.toml and pre-fills all settings:
   - Build command:   npm run docs:build
   - Publish dir:     docs/.vitepress/dist
   - Node version:    20
4. Click Deploy site
```

**Result:** Live at `kairos-xxx.netlify.app`
**Auto-deploy:** Yes — every push to `main`
**Custom domain:** Netlify Dashboard → Domain settings

---

## Option 3: GitHub Pages (Free, Public Repos)

GitHub Pages does not run build commands natively, so deployment uses a GitHub Actions workflow.

### Setup

Create the file `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

Then enable Pages in the repo:

```
GitHub Repo → Settings → Pages
Source: GitHub Actions (not "Deploy from a branch")
```

**Result:** Live at `username.github.io/kairos`
**Limitation:** Public repos only (private repos require GitHub Pro)
**Auto-deploy:** Yes — on every push to `main`

---

## Comparison

| Platform | Cost | Setup | Private Repos | Auto-Deploy | Config file |
|----------|------|-------|---------------|-------------|-------------|
| **Vercel** | Free | 5 min | ✅ Yes | ✅ Yes | `vercel.json` |
| **Netlify** | Free | 5 min | ✅ Yes | ✅ Yes | `netlify.toml` |
| **GitHub Pages** | Free | 10 min | ❌ No* | ✅ Yes | `.github/workflows/deploy.yml` |

*Free only for public repositories. Private repos need GitHub Pro ($4/month).

---

## Which to Choose

| Situation | Recommendation |
|-----------|----------------|
| Quickest start, private repo | **Vercel** |
| Already using Netlify ecosystem | **Netlify** |
| Repo is public, no extra accounts | **GitHub Pages** |

---

## Troubleshooting

**Build fails — "vitepress not found"**
→ Make sure the build runs `npm install` before `npm run docs:build`
→ On Vercel/Netlify this is automatic; on manual servers run `npm ci` first

**404 on all pages after deploy**
→ Vercel/Netlify: confirm the output directory is `docs/.vitepress/dist`, not `docs/`
→ GitHub Pages: confirm the workflow uploads from `docs/.vitepress/dist`

**Agents pages return 404 (`/agents/orchestrator` etc.)**
→ VitePress generates clean URLs — the platform must serve `index.html` for unknown paths
→ Vercel and Netlify handle this automatically
→ GitHub Pages: add a `404.html` redirect or use hash-based routing if issues persist

**CSS/JS not loading (blank white page)**
→ Check `base` option in `docs/.vitepress/config.js`:
  - Vercel/Netlify (root domain): no `base` needed (default `/`)
  - GitHub Pages subdirectory (e.g. `username.github.io/kairos`): add `base: '/kairos/'`

---

## Repository Structure

```
kairos/
├── agents/                    ← 7 subagent definitions (served as /agents/*)
│   ├── orchestrator.md
│   ├── pm-agent.md
│   ├── architect-agent.md
│   ├── implementer-agent.md
│   ├── code-reviewer.md
│   ├── test-verifier.md
│   └── release-planner.md
├── docs/
│   ├── .vitepress/
│   │   ├── config.js          ← VitePress config (srcDir: '..')
│   │   └── dist/              ← Build output (gitignored)
│   ├── index.md               ← Home page
│   ├── overview.md
│   ├── agents.md
│   ├── setup.md
│   ├── workflow.md
│   ├── metrics.md
│   ├── roadmap.md
│   └── faq.md
├── package.json               ← npm scripts (docs:dev, docs:build, docs:preview)
├── vercel.json                ← Vercel build config (pre-configured)
└── netlify.toml               ← Netlify build config (pre-configured)
```

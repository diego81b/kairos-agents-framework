# KAIROS Framework v2.0

**"The Right Moment for Development"**

Intelligent multi-agent SDLC orchestration by Comm.it

## What's Included

- **agents/** - 7 specialized subagent definitions
- **docs/** - Complete documentation + converter scripts
- **DEPLOYMENT.md** - How to deploy (4 options)

## Quick Start

1. Copy `agents/` to your project
2. Use in Claude Code: "Help me add X feature with KAIROS"
3. All 7 agents orchestrate automatically

## Generating the Website (Windows, Mac, Linux)

### Windows (PowerShell):

```powershell
cd docs
.\convert.ps1
```

### Mac/Linux (Python 3):

```bash
cd docs
python3 convert.py
```

This converts `KAIROS-FRAMEWORK-DOCUMENTATION.md` to `index.html`

### Deploy to web:

```bash
git add .
git commit -m "feat: Generate HTML from markdown"
git push origin main
```

## Deployment Options

See `DEPLOYMENT.md` for complete instructions:

1. **Vercel** (Recommended) - Fast, professional, any repo type
2. **GitHub Pages** - Simple, free for public repos
3. **Netlify** - Flexible, free, any repo type
4. **Gitbook** - Beautiful interactive docs, auto-sync from GitHub

## Files

- `agents/` - 7 subagent markdown files
- `docs/KAIROS-FRAMEWORK-DOCUMENTATION.md` - Complete docs (5000+ lines)
- `docs/SUMMARY.md` - Table of contents for Gitbook
- `docs/convert.ps1` - PowerShell converter (Windows)
- `docs/convert.py` - Python converter (Mac/Linux)
- `docs/index.html` - Generated website
- `DEPLOYMENT.md` - Deployment instructions (4 options)

## Workflow

1. **Edit markdown** → `docs/KAIROS-FRAMEWORK-DOCUMENTATION.md`
2. **Generate HTML** → Run converter (Windows: `.\convert.ps1`, Mac/Linux: `python3 convert.py`)
3. **Test locally** → Open `docs/index.html` in browser
4. **Deploy** → Git push (all platforms auto-deploy)

**Bonus:** Gitbook auto-syncs from GitHub - your docs are always up-to-date

## License

AGPL-3.0

---

Built with intelligence, timing, and excellence. 🚀

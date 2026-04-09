# KAIROS Framework v2.0

**"The Right Moment for Development"**

Intelligent multi-agent SDLC orchestration by Comm.it

## What's Included

- **agents/** - 8 core agent definitions + 5 optional Team Mode specialists
- **docs/** - Complete documentation site (VitePress)
- **CHANGELOG.md** - Version history

## Quick Start

1. Copy `agents/` to your project
2. Use in Claude Code: "Help me add X feature with KAIROS"
3. The Orchestrator coordinates the pipeline automatically

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

- `agents/` - Core agents + `teammates/` folder (Team Mode specialists)
- `docs/` - VitePress documentation site
- `CHANGELOG.md` - Version history
- `internal/` - Internal guides (cost analysis, routing logic, provider specifics)

## Workflow

1. **Edit docs** → modify files in `docs/`
2. **Preview locally** → `npm run docs:dev`
3. **Build** → `npm run docs:build`
4. **Deploy** → Git push (Vercel/Netlify auto-deploy)

## Implementation Modes

| Mode | Cost | Works on | When to use |
| --- | --- | --- | --- |
| Single Agent (default) | ~$0.068/feature | Everywhere | All features |
| Team Mode (optional) | ~$0.242/feature | Claude Code only | Critical systems, explicit request |

Team Mode activates a Lead + 4 parallel specialists (Tests, Backend, Frontend, Database). The Orchestrator always shows a cost warning before enabling it.

## License

AGPL-3.0

---

Built with intelligence, timing, and excellence. 🚀

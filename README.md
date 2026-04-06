# KAIROS Framework v2.0

**"The Right Moment for Development"**

Intelligent multi-agent SDLC orchestration by Comm.it

## What's Included

- **agents/** - 7 specialized subagent definitions
- **docs/** - Complete documentation + converter script
- **DEPLOYMENT.md** - How to deploy on web

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

### Then deploy:

```bash
git add .
git commit -m "feat: Generate HTML from markdown"
git push origin main
```

Vercel will serve `docs/index.html` automatically.

## Files

- `agents/` - 7 subagent markdown files
  - orchestrator.md
  - pm-agent.md
  - architect-agent.md
  - implementer-agent.md
  - code-reviewer.md
  - test-verifier.md
  - release-planner.md
- `docs/KAIROS-FRAMEWORK-DOCUMENTATION.md` - Complete documentation (5000+ lines)
- `docs/convert.ps1` - PowerShell converter (for Windows)
- `docs/convert.py` - Python converter (for Mac/Linux)
- `docs/index.html` - Generated website (created by converter)
- `DEPLOYMENT.md` - Deployment instructions

## Workflow

1. **Edit documentation** → Modify `docs/KAIROS-FRAMEWORK-DOCUMENTATION.md`
2. **Generate HTML** → Run converter:
   - Windows: `.\convert.ps1`
   - Mac/Linux: `python3 convert.py`
3. **Test locally** → Open `docs/index.html` in browser
4. **Deploy** → Git push (Vercel/Netlify auto-deploys)

## Deployment

See `DEPLOYMENT.md` for step-by-step instructions for:
- Vercel (recommended)
- GitHub Pages (public repos only)
- Netlify

**Key settings:**
- Root Directory: `docs`
- Build Command: (leave blank)
- Output Directory: (leave blank)

## License

AGPL-3.0

---

Built with intelligence, timing, and excellence. 🚀

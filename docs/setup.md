# Setup by Tool

KAIROS works with all major AI coding tools. Pick the one that fits your workflow.

| Tool | Best for | Cost |
|------|----------|------|
| Claude Code | Fullstack, complex reasoning | Free / $20/mo |
| Cursor IDE | Native IDE experience | $20/mo |
| GitHub Copilot | VS Code / JetBrains integration | $10/mo |
| Amazon CodeWhisperer | AWS-heavy projects | Free / $19/mo |
| JetBrains IDEs | Enterprise development | IDE + $10/mo |
| VS Code (generic) | Lightweight, extensible | $10/mo |

---

### Claude (Claude.ai + Claude Code)

**Best for:** Fullstack development, complex reasoning

```
1. Open Claude Code at claude.ai
2. Upload agents/ folder
3. Ask: "Help me add [feature] using KAIROS"
4. Claude orchestrates all 7 agents
5. Get code + tests + quality report
```

**Cost:** Free or $20/month (Pro)

---

### Cursor IDE

**Best for:** Native IDE experience, real-time coding

```
1. Install Cursor from cursor.com
2. Copy agents/ to .cursor/agents/
3. Press Ctrl+K (or Cmd+K on Mac)
4. Type: "@agents Add [feature] with KAIROS"
5. Cursor generates code inline
```

**Cost:** $20/month (Cursor Pro)

---

### GitHub Copilot (VS Code / JetBrains)

**Best for:** Lightweight, VS Code integration

```
1. Install GitHub Copilot extension
2. Copy agents/ to .github/agents/
3. In editor press Ctrl+I (Cmd+I Mac)
4. Type: "Using KAIROS, add [feature]"
5. Copilot suggests code
```

**Cost:** $10/month

---

### Amazon CodeWhisperer

**Best for:** AWS-heavy projects

```
1. Install CodeWhisperer extension
2. Authenticate with AWS
3. Copy agents/ to project
4. Press Alt+C to activate
5. Type: "KAIROS: Add [feature]"
6. CodeWhisperer generates code
```

**Cost:** Free tier or $19/month (Pro)

---

### JetBrains IDEs (IntelliJ, PyCharm, etc)

**Best for:** Enterprise development, refactoring

```
1. Install GitHub Copilot or CodeWhisperer plugin
2. Copy agents/ to .idea/agents/
3. Press Cmd+J (Mac) or Ctrl+Alt+J (Windows)
4. Type: "KAIROS framework: add [feature]"
5. IDE suggests code improvements
```

**Cost:** IDE license + Copilot $10/month

---

### VS Code (Generic Setup)

**Best for:** Lightweight, extensible

```
1. Install GitHub Copilot extension
2. Copy agents/ to .vscode/agents/
3. Create .vscode/settings.json for KAIROS
4. Press Ctrl+I to activate
5. Type KAIROS prompts
```

**Cost:** $10/month (Copilot)

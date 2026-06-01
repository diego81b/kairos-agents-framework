# Phase 0 — Discovery

> **Status:** Complete. Findings verified from official Claude Code and MCP documentation.
> Stop here for review before Phase 1.

---

## Plugin Anatomy

### Manifest

File: `.claude-plugin/plugin.json` — optional but recommended.

**Required field (if manifest present):**

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Kebab-case, no spaces; used for namespacing |

**Standard optional fields:**

| Field | Type | Notes |
|-------|------|-------|
| `displayName` | string | Human-readable name (v2.1.143+) |
| `version` | string | Semver; falls back to git commit SHA if omitted |
| `description` | string | Brief explanation |
| `author` | object | `{name, email}` |
| `homepage` | string | Documentation URL |
| `repository` | string | Source code URL |
| `license` | string | SPDX identifier |
| `keywords` | array | Discovery tags |
| `defaultEnabled` | boolean | Install state (v2.1.154+, default: true) |

**Component path overrides** (replaces auto-discovery defaults):

```
skills, commands, agents, hooks, mcpServers, lspServers,
outputStyles, userConfig, channels, dependencies,
experimental.themes, experimental.monitors
```

Claude Code ignores unrecognized top-level fields, so a single `plugin.json` can safely coexist with npm/VS Code metadata.

---

### Folder Layout

Standard layout (auto-discovered; no manifest required):

```
plugin-root/
├── .claude-plugin/
│   └── plugin.json          # Optional manifest
├── agents/                  # Subagent .md files
├── skills/                  # Skill directories
│   └── skill-name/
│       └── SKILL.md         # Required per skill
├── commands/                # Flat markdown skills (alternative to skills/)
├── hooks/
│   └── hooks.json
├── monitors/
│   └── monitors.json
├── bin/                     # Executables added to Bash PATH
├── settings.json            # Default plugin settings
├── .mcp.json                # MCP server definitions
└── .lsp.json                # LSP server definitions
```

**Critical constraints:**
- `.claude-plugin/` is only for the manifest; all other dirs live at plugin root.
- `CLAUDE.md` at plugin root is **not** loaded as context — use agents/skills for documentation.
- Default locations are auto-discovered; fields in `plugin.json` replace defaults (they don't extend them).

---

### Where a Plugin Lives

Plugins are distributed via **marketplaces** — git repositories containing `.claude-plugin/marketplace.json`.

**Marketplace file structure:**

```json
{
  "name": "my-marketplace",
  "owner": { "name": "...", "email": "..." },
  "plugins": [
    {
      "name": "kairos",
      "source": { "source": "github", "repo": "owner/repo" }
    }
  ]
}
```

**Supported source types:**

| Type | Example |
|------|---------|
| Relative path (git marketplace only) | `"./plugins/kairos"` |
| GitHub shorthand | `{"source": "github", "repo": "owner/repo", "ref": "v3.0.0"}` |
| Git URL | `{"source": "url", "url": "https://..."}` |
| Git subdirectory | `{"source": "git-subdir", "url": "...", "path": "tools/kairos"}` |
| npm package | `{"source": "npm", "package": "@org/kairos", "version": "^3.0.0"}` |

---

### End-User Installation Steps

```bash
# 1. Add the marketplace
/plugin marketplace add owner/marketplace-repo    # GitHub shorthand
# OR
/plugin marketplace add https://marketplace.example.com/marketplace.json

# 2. Install the plugin
/plugin install kairos@my-marketplace

# 3. Verify
/plugin list
/plugin details kairos@my-marketplace
```

**Management:**

```bash
/plugin marketplace list      # All connected marketplaces
/plugin marketplace update    # Refresh all
/plugin enable kairos@...     # Enable (if defaultEnabled: false)
/plugin disable kairos@...
```

---

### Does Anything "Run" at Install?

**No.** Install is purely file-based:

- Claude Code downloads/clones the plugin to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`
- No build step, no `npm install`, no arbitrary scripts execute
- Hooks fire during sessions (not at install)
- MCP and LSP servers spawn at session init (not at install)
- Monitors start at session init (not at install)

Plugins can declare `userConfig` to prompt users for API tokens/endpoints at enable time — but this is UI-driven input, not code execution.

---

## MCP Server Setup

### Language/SDK Options

**Tier 1 — fully featured, actively maintained:**

| Language | SDK |
|----------|-----|
| TypeScript | `@modelcontextprotocol/sdk` |
| Python | `mcp` (PyPI) |
| C# | NuGet package |
| Go | Go module |

**Tier 2 — feature-complete, community-maintained:** Java, Rust

**Tier 3 — experimental:** Swift, Ruby, PHP

All tiers support the same feature set: tools, resources, prompts, local and remote transports, protocol compliance.

---

### Transport Choices

**stdio (local):**
- Client spawns the MCP server as a subprocess
- Server reads JSON-RPC from stdin, writes to stdout, logs to stderr
- Messages are newline-delimited; no embedded newlines
- Best for: local tools, direct filesystem access, development

**Streamable HTTP (remote, current standard — replaces deprecated HTTP+SSE from Nov 2024):**
- Server is an independent process; handles multiple concurrent connections
- Requests: HTTP POST to the server endpoint
- Responses: single JSON or SSE stream
- Session management: optional `MCP-Session-Id` header; SSE reconnect via `Last-Event-ID`
- Security: servers must validate `Origin` header (return 403 on mismatch) to prevent DNS rebinding
- Local HTTP servers must bind to `127.0.0.1`, not `0.0.0.0`
- Best for: cloud-hosted, shared, multi-client, authentication workflows

**WebSocket:** persistent bidirectional; specialist use only; less supported than HTTP.

---

### Local (stdio) — User Config

**CLI:**
```bash
claude mcp add --transport stdio <name> -- <command> [args...]

# Example
claude mcp add --transport stdio --env API_KEY=abc my-server -- npx -y my-mcp-server
```

**`.mcp.json` (project-scoped):**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "/path/to/server",
      "args": ["--config", "/path/to/config.json"],
      "env": { "API_KEY": "value" }
    }
  }
}
```

Claude Code sets `CLAUDE_PROJECT_DIR` in the server's environment; servers can use it to resolve project-relative paths.

---

### Remote (HTTP) — User Config

**CLI:**
```bash
claude mcp add --transport http <name> <url>

# With auth header
claude mcp add --transport http <name> <url> --header "Authorization: Bearer <token>"
```

**`.mcp.json`:**
```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      },
      "timeout": 30000
    }
  }
}
```

Environment variable expansion in `.mcp.json`: `${VAR}` and `${VAR:-default}` are supported.

OAuth 2.0 is supported for remote servers: user authenticates with `/mcp`, tokens stored and refreshed automatically.

---

### Where an MCP Server Lives

**Local (stdio):**
- Distribution: npm package (`npx`), pip package, compiled binary, or git clone
- Nothing hosted; the server process runs on each user's machine
- Per-user setup: install the package, add one config block

**Remote (HTTP):**
- Server is always-on hosted process: Railway, Render, Cloudflare Workers, custom VPS
- Operational requirements:
  - Validate `Origin` header on every connection (DNS rebinding prevention — mandatory)
  - Implement authentication (Bearer token, OAuth, `headersHelper` script)
  - Handle concurrent connections (multiple clients POST independently)
  - Include `MCP-Protocol-Version: 2025-11-25` in responses
- Distribution: push to hosting platform; give users the URL and the config block

---

## Summary: "Where Does It Live?"

| Artifact | Location | Must something run? | How team gets it |
|----------|----------|---------------------|-----------------|
| Claude Code plugin | git repo + marketplace manifest | No | `/plugin marketplace add` → `/plugin install` |
| MCP server (local) | npm/pip package on each machine | Yes — locally per user | install package → add config block |
| MCP server (remote) | hosted process at URL | Yes — always-on | add client config pointing at URL |

---

## Open Questions for Phase 1

1. **KAIROS `agents/` → plugin `agents/`** — the paths match by default. No manifest override needed; the directory just moves. Verify the subagent `.md` frontmatter (tools, model, description) is still honored inside a plugin context.
2. **`contract-checklist.md` → plugin skill** — it is a shared reference, not a slash-command. It maps to a skill directory (`skills/contract-checklist/SKILL.md`). Confirm the slash-command name format: `plugin-name:skill-name`.
3. **`CLAUDE.md` (`.claude/CLAUDE.md`)** — the project-level contributor instructions. A `CLAUDE.md` at plugin root is not loaded. The right slot is unclear: it could become an agent, a skill, or simply rely on the plugin's `agents/` being loaded. Needs a decision before Phase 1.2.
4. **Marketplace repo** — does KAIROS publish its own marketplace manifest, or does it rely on an existing marketplace? A self-hosted marketplace in the same GitHub repo is the simplest path.
5. **`defaultEnabled: false`** — worth considering if KAIROS agents should be opt-in to avoid polluting users who install but don't want all agents active.

---

> **Next step:** Phase 1 — map KAIROS onto the plugin structure above, then build. See `distribution-roadmap.md` for the full checklist.

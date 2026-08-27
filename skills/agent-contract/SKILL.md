---
description: Shared missing-input error format used by every phase agent's own Input Validation section, parameterized by the agent's own name.
---

# Agent Contract

The closing error-format block of an agent's own `## Input Validation` section — every phase agent still writes its own required-inputs table above it; only this fixed closing block moves here.

## Missing-Input Error Format

Invoked with one parameter the calling agent states inline: `{agent-name}` (the same slug as that agent's own frontmatter `name:`, e.g. `pm-agent`).

Error format:
> 🚨 **AGENT ERROR — {agent-name}**  
> **Missing:** `[field]`  
> **Why it matters:** [brief reason]  
> **Action required:** [what must be provided]  
> ⛔ This agent cannot continue until the missing input is supplied.

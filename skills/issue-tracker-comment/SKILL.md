---
description: Shared jira/glab/bitbucket comment-posting commands for the optional "post this phase's output to the issue tracker" step every phase agent offers, parameterized by output file and comment title.
---

# Issue Tracker Comment

Shared reference for every phase agent's own "Issue Tracker Comment (optional)" step, invoked with two parameters the calling agent states inline: `{output_file}` (the `.kairos/<feature_folder>/` file to post) and `{title}` (the Markdown heading used as the comment's own title, e.g. `## Code Review`).

If the user provides an issue reference (Jira `PROJ-42`, GitLab/Bitbucket `#42`), post `{output_file}` as a comment on that issue once the human approves it at the phase's own HITL gate.

## Plain body

Most agents post the file with no extra heading — the tracker comment's own context (which pipeline run, which phase) is already clear from the issue thread.

**Jira** (`jira-cli`):
```bash
jira issue comment add PROJ-42 "$(cat .kairos/<feature_folder>/{output_file})"
```

**GitLab** (`glab`):
```bash
glab issue note <issue-id> --body "$(cat .kairos/<feature_folder>/{output_file})"
```

## Title-prefixed body

`pm-agent`, `architect-agent`'s implementer counterparts (`implementer-tdd-agent`, `implementer-coder-agent`), and `impact-assessment-agent` prefix `{title}` before the file content instead:

**Jira** (`jira-cli`):
```bash
jira issue comment add PROJ-42 "{title}\n\n$(cat .kairos/<feature_folder>/{output_file})"
```

**GitLab** (`glab`):
```bash
glab issue note <issue-id> --body "{title}\n\n$(cat .kairos/<feature_folder>/{output_file})"
```

## Bitbucket (REST API)

Same shape for every agent regardless of plain/title-prefixed above:

```bash
curl -X POST "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/issues/<id>/comments" \
  -u "${BITBUCKET_USER}:${BITBUCKET_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"content\":{\"raw\":\"{title}\"}}"
```

## No-Bash agents

`context-extractor-agent` and `documentation-agent` have no `Bash` tool (narrowed in v6.7.0 to match their stated contract). They cannot run the commands above themselves — extract `{output_file}`'s relevant section as the comment body and hand it, plus the matching command, to the user or orchestrator to run.

## Read-only agents

`security-reviewer-agent` and `impact-assessment-agent` have no `Write`/`Edit`/`Bash` at all (`tools: Read, Grep, Glob, AskUserQuestion`) — instruct the orchestrator to post on their behalf rather than running the command directly, same as their own Write-to-Project step.

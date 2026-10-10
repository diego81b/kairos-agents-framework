#!/usr/bin/env node
// KAIROS usage report: which model answered, and how many tokens each dispatched agent used.
//
// Measured from the host's own subagent transcripts (Claude Code), never reported by an agent
// about itself. Claude Code documents where the transcripts live but not their format, so every
// read here is defensive and a file it does not understand is skipped, not fatal.
//
//   node usage.mjs                         latest session of this project, all its agents
//   node usage.mjs --feature <folder>      every session, only the agents dispatched for that feature
//   node usage.mjs --session <id>          one session
//   node usage.mjs --feature <folder> --write <file>
//                                          write the report to <file> (rewritten whole each time)
//   node usage.mjs --since <iso-date-time> only agent calls that started at or after it (one run of an issue)
//   node usage.mjs --json                  machine-readable output
//
// Layout read: ~/.claude/projects/<project>/<sessionId>.jsonl            (the primary session)
//              ~/.claude/projects/<project>/<sessionId>/subagents/agent-<id>.jsonl + .meta.json

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const value = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const feature = value('feature')
const sessionArg = value('session')
const asJson = flag('json')
const writeTo = value('write')
// A date-time with no zone is read as UTC, the zone the transcripts use.
const sinceRaw = value('since')
const since = sinceRaw ? Date.parse(/(Z|[+-]\d\d:?\d\d)$/.test(sinceRaw) ? sinceRaw : `${sinceRaw}Z`) : null

const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude')
const projectsDir = path.join(configDir, 'projects')
// Claude Code names a project directory after its path with every non-alphanumeric character as '-'.
const wanted = process.cwd().replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()

const safeReaddir = (dir) => {
  try { return fs.readdirSync(dir, { withFileTypes: true }) } catch { return [] }
}

// Windows drive letters differ in case between sessions ('C--varie-kairos' and 'c--varie-kairos').
const projectDirs = safeReaddir(projectsDir)
  .filter((e) => e.isDirectory() && e.name.toLowerCase() === wanted)
  .map((e) => path.join(projectsDir, e.name))

if (projectDirs.length === 0) {
  console.log(`No Claude Code transcripts found for ${process.cwd()} under ${projectsDir}.`)
  process.exit(0)
}

const sessions = []
for (const dir of projectDirs) {
  for (const e of safeReaddir(dir)) {
    if (!e.isDirectory()) continue
    const subDir = path.join(dir, e.name, 'subagents')
    const main = path.join(dir, `${e.name}.jsonl`)
    let mtime = 0
    try { mtime = fs.statSync(fs.existsSync(main) ? main : path.join(dir, e.name)).mtimeMs } catch { /* keep 0 */ }
    sessions.push({ id: e.name, dir: path.join(dir, e.name), subDir, main: fs.existsSync(main) ? main : null, mtime })
  }
}
sessions.sort((a, b) => b.mtime - a.mtime)

let chosen
if (sessionArg) chosen = sessions.filter((s) => s.id === sessionArg)
else if (feature) chosen = sessions
else chosen = sessions.slice(0, 1)

// Read one transcript: models by turn count, usage per distinct response, first/last timestamp, first user text.
function readTranscript(file) {
  const byResponse = new Map()
  const models = new Map()
  let first = null
  let last = null
  let firstUser = ''
  let text
  try { text = fs.readFileSync(file, 'utf8') } catch { return null }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    let o
    try { o = JSON.parse(line) } catch { continue }
    if (o.timestamp) {
      const t = Date.parse(o.timestamp)
      if (!Number.isNaN(t)) {
        if (first === null || t < first) first = t
        if (last === null || t > last) last = t
      }
    }
    const m = o.message
    if (!m || typeof m !== 'object') continue
    if (m.role === 'user' && !firstUser) {
      firstUser = typeof m.content === 'string'
        ? m.content
        : Array.isArray(m.content) ? m.content.map((c) => (typeof c?.text === 'string' ? c.text : '')).join('\n') : ''
    }
    if (m.role === 'assistant' && m.usage) {
      // A response is written once per content block, each line repeating its usage: count it once.
      const key = m.id || o.uuid || `${file}:${byResponse.size}`
      const u = m.usage
      const prev = byResponse.get(key) || { input: 0, output: 0, cacheWrite: 0, cacheRead: 0, model: null }
      byResponse.set(key, {
        input: Math.max(prev.input, u.input_tokens || 0),
        output: Math.max(prev.output, u.output_tokens || 0),
        cacheWrite: Math.max(prev.cacheWrite, u.cache_creation_input_tokens || 0),
        cacheRead: Math.max(prev.cacheRead, u.cache_read_input_tokens || 0),
        model: m.model || prev.model,
      })
    }
  }
  const total = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 }
  for (const r of byResponse.values()) {
    total.input += r.input
    total.output += r.output
    total.cacheWrite += r.cacheWrite
    total.cacheRead += r.cacheRead
    if (r.model && r.model !== '<synthetic>') models.set(r.model, (models.get(r.model) || 0) + 1)
  }
  return { total, models, turns: byResponse.size, first, last, firstUser }
}

// What the model should have been: the `models` files first, in the order the orchestrator reads them
// (project .kairos-cfg/models, then .kairos/.models, then ~/.kairos-cfg/models), then the agent's own
// `model:` frontmatter. The first file naming an agent wins; an alias outside the four is ignored.
const MODEL_FILES = [
  { file: path.join(process.cwd(), '.kairos-cfg', 'models'), source: '.kairos-cfg/models' },
  { file: path.join(process.cwd(), '.kairos', '.models'), source: '.kairos/.models' },
  { file: path.join(os.homedir(), '.kairos-cfg', 'models'), source: '~/.kairos-cfg/models' }
]
const ALIASES = new Set(['opus', 'sonnet', 'haiku', 'fable'])
function readModelsFiles() {
  const map = new Map()
  for (const { file, source } of MODEL_FILES) {
    let text
    try { text = fs.readFileSync(file, 'utf8') } catch { continue }
    for (const raw of text.split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const m = /^([\w:-]+)\s*:\s*(\w+)$/.exec(line)
      if (m && ALIASES.has(m[2].toLowerCase()) && !map.has(m[1])) map.set(m[1], { alias: m[2].toLowerCase(), source })
    }
  }
  return map
}
const overrides = readModelsFiles()
const agentsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'agents')
function expectedAlias(agentType) {
  const name = agentType.replace(/^kairos:(team:)?/, '')
  if (overrides.has(name)) return overrides.get(name)
  try {
    const front = fs.readFileSync(path.join(agentsDir, `${name}.md`), 'utf8').split('---')[1] || ''
    const m = /^model:\s*(\S+)/m.exec(front)
    if (m) return { alias: m[1].toLowerCase(), source: 'frontmatter' }
  } catch { /* agent file not next to the script */ }
  return null
}
const family = (modelId) => (/(opus|sonnet|haiku|fable)/i.exec(modelId || '') || [])[1]?.toLowerCase() || null

const rows = []
for (const s of chosen) {
  if (!feature && s.main) {
    const t = readTranscript(s.main)
    // Wall-clock time of the primary session includes every wait for a human, so it is not reported.
    if (t && t.turns) rows.push({ session: s.id, agent: 'primary session', feature: null, ...summarize(t, null), seconds: null })
  }
  for (const e of safeReaddir(s.subDir)) {
    if (!e.isFile() || !/^agent-.*\.jsonl$/.test(e.name)) continue
    const file = path.join(s.subDir, e.name)
    let meta = {}
    try { meta = JSON.parse(fs.readFileSync(file.replace(/\.jsonl$/, '.meta.json'), 'utf8')) } catch { /* meta is optional */ }
    const agentType = meta.agentType || meta.agent_type || 'unknown'
    if (!agentType.startsWith('kairos:')) continue
    const t = readTranscript(file)
    if (!t || !t.turns) continue
    const fm = /feature[ _]folder:\s*`?([^\s`]+)/i.exec(t.firstUser)
    const featureFolder = fm ? fm[1] : null
    if (feature && featureFolder !== feature) continue
    if (since && !Number.isNaN(since) && t.first !== null && t.first < since) continue
    rows.push({ session: s.id, agent: agentType, description: meta.description || '', feature: featureFolder, ...summarize(t, agentType) })
  }
}

function summarize(t, agentType) {
  const ranked = [...t.models.entries()].sort((a, b) => b[1] - a[1])
  const model = ranked.length ? ranked.map(([m]) => m).join(' + ') : 'unknown'
  const exp = agentType ? expectedAlias(agentType) : null
  let verdict = ''
  if (exp && exp.alias !== 'inherit' && ranked.length) {
    verdict = ranked.every(([m]) => family(m) === exp.alias) ? 'ok' : `expected ${exp.alias} (${exp.source})`
  }
  return {
    model, verdict, turns: t.turns, ...t.total,
    start: t.first, seconds: t.first !== null && t.last !== null ? Math.round((t.last - t.first) / 1000) : null,
  }
}

rows.sort((a, b) => (a.start || 0) - (b.start || 0))

if (asJson) {
  console.log(JSON.stringify(rows, null, 2))
  process.exit(0)
}
const n = (x) => x.toLocaleString('en-US')
const dur = (s) => (s === null ? '-' : s >= 60 ? `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s` : `${s}s`)
const out = []

if (rows.length === 0) {
  out.push(feature
    ? `No KAIROS subagent transcripts found for feature folder "${feature}" in this project.`
    : 'No KAIROS subagent transcripts found in the latest session of this project.')
  // Nothing measured: never leave an empty report file behind.
  console.log(out[0])
  process.exit(0)
}

out.push('| # | Agent | Model | Check | Turns | Input | Output | Cache write | Cache read | Time |')
out.push('|---|-------|-------|-------|-------|-------|--------|-------------|------------|------|')
const sum = { turns: 0, input: 0, output: 0, cacheWrite: 0, cacheRead: 0 }
rows.forEach((r, i) => {
  for (const k of Object.keys(sum)) sum[k] += r[k]
  const check = r.verdict === 'ok' ? 'ok' : r.verdict ? `⚠ ${r.verdict}` : '-'
  const label = `${r.agent.replace(/^kairos:/, '')}${r.description ? ` (${r.description.replace(/\|/g, '/')})` : ''}`
  out.push(`| ${i + 1} | ${label} | ${r.model} | ${check} | ${r.turns} | ${n(r.input)} | ${n(r.output)} | ${n(r.cacheWrite)} | ${n(r.cacheRead)} | ${dur(r.seconds)} |`)
})
out.push(`| | **Total** | | | ${sum.turns} | ${n(sum.input)} | ${n(sum.output)} | ${n(sum.cacheWrite)} | ${n(sum.cacheRead)} | |`)
out.push('')
out.push('One row per agent call. Tokens are counted once per response and kept apart because they are billed differently: cache reads are the cheapest, cache writes and output the dearest.')
if (feature) out.push("The orchestrator's own turns are not attributed to a feature; run without --feature for the primary session.")

if (writeTo) {
  const header = [
    `# Usage — ${feature || 'latest session'}`,
    '',
    `Measured from the session transcripts by \`scripts/usage.mjs\`, not reported by any agent. Rewritten whole after every agent call; generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC. No agent reads this file.`,
    '',
  ]
  try {
    fs.mkdirSync(path.dirname(writeTo), { recursive: true })
    fs.writeFileSync(writeTo, header.concat(out).join('\n') + '\n', 'utf8')
    console.log(`Usage written to ${writeTo} (${rows.length} agent call${rows.length === 1 ? '' : 's'}).`)
  } catch (err) {
    console.log(`Could not write ${writeTo}: ${err.message}`)
  }
} else {
  console.log(out.join('\n'))
}

import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { version } = require('../../package.json')

export default withMermaid(defineConfig({
  srcDir: '..',
  srcExclude: [
    '**/node_modules/**',
    'docs/.vitepress/**',
    'README.md',
    'CHANGELOG.md',
    'DEPLOYMENT.md',
    'LICENSE',
    'netlify.toml',
    'vercel.json',
    'package.json',
    'START-HERE-SIMPLE.txt',
    'docs/index.html',
    'docs/convert.ps1',
    'docs/convert.py',
    'docs/SUMMARY.md',
    'docs/KAIROS-FRAMEWORK-DOCUMENTATION.md'
  ],

  rewrites: {
    'docs/:slug*': ':slug*'
  },

  title: 'KAIROS Framework',
  description: 'Intelligent multi-agent SDLC orchestration by Comm.it',
  lang: 'en-US',

  head: [
    ['meta', { name: 'theme-color', content: '#003D7A' }],
    ['meta', { property: 'og:title', content: 'KAIROS Framework v2.0' }],
    ['meta', { property: 'og:description', content: 'The Right Moment for Development - 7-agent AI orchestration' }]
  ],

  themeConfig: {
    nav: [
      { text: 'Overview', link: '/overview' },
      {
        text: 'Agents',
        items: [
          { text: 'All Agents', link: '/agents' },
          { text: 'Agent Files (copy)', link: '/agent-files' }
        ]
      },
      {
        text: 'Setup',
        items: [
          { text: 'Setup Overview', link: '/setup/' },
          { text: 'Claude Code', link: '/setup/claude-code' },
          { text: 'Cursor IDE', link: '/setup/cursor' },
          { text: 'VS Code', link: '/setup/vscode' },
          { text: 'JetBrains', link: '/setup/jetbrains' },
          { text: 'OpenAI Codex CLI', link: '/setup/codex' },
          { text: 'Pipeline Templates', link: '/setup/templates' }
        ]
      },
      { text: 'Workflow', link: '/workflow' },
      {
        text: `v${version}`,
        items: [
          { text: 'Roadmap', link: '/roadmap' },
          { text: 'Changelog', link: '/changelog' }
        ]
      }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'What is KAIROS?', link: '/overview' }
        ]
      },
      {
        text: 'Setup',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/setup/' },
          { text: 'Claude Code', link: '/setup/claude-code' },
          { text: 'Cursor IDE', link: '/setup/cursor' },
          { text: 'VS Code', link: '/setup/vscode' },
          { text: 'JetBrains', link: '/setup/jetbrains' },
          { text: 'OpenAI Codex CLI', link: '/setup/codex' },
          { text: 'Pipeline Templates', link: '/setup/templates' }
        ]
      },
      {
        text: 'Core Agents',
        collapsed: false,
        items: [
          { text: 'All Agents Overview', link: '/agents' },
          {
            text: 'Agent Files (copy)',
            link: '/agent-files',
            collapsed: true,
            items: [
              { text: 'Context Extractor', link: '/agents/context-extractor-agent' },
              { text: 'Orchestrator', link: '/agents/orchestrator-agent' },
              { text: 'PM Agent', link: '/agents/pm-agent' },
              { text: 'Architect Agent', link: '/agents/architect-agent' },
              { text: 'Implementer Agent', link: '/agents/implementer-agent' },
              { text: 'Code Reviewer', link: '/agents/code-reviewer-agent' },
              { text: 'Test Verifier', link: '/agents/test-verifier-agent' },
              { text: 'Release Planner', link: '/agents/release-planner-agent' }
            ]
          },
          { text: 'Context Extractor', link: '/agents/context-extractor-agent' },
          { text: 'Orchestrator', link: '/agents/orchestrator-agent' },
          { text: 'PM Agent', link: '/agents/pm-agent' },
          { text: 'Architect Agent', link: '/agents/architect-agent' },
          { text: 'Implementer Agent', link: '/agents/implementer-agent' },
          { text: 'Code Reviewer', link: '/agents/code-reviewer-agent' },
          { text: 'Test Verifier', link: '/agents/test-verifier-agent' },
          { text: 'Release Planner', link: '/agents/release-planner-agent' }
        ]
      },
      {
        text: 'Team Mode (optional)',
        collapsed: true,
        items: [
          {
            text: 'Team Files (copy)',
            link: '/agent-files#implementer-lead-team-mode',
            collapsed: true,
            items: [
              { text: 'Implementer Lead', link: '/agents/team/implementer-lead-agent' },
              { text: 'Teammate Tests', link: '/agents/team/teammate-tests-agent' },
              { text: 'Teammate Backend', link: '/agents/team/teammate-backend-agent' },
              { text: 'Teammate Frontend', link: '/agents/team/teammate-frontend-agent' },
              { text: 'Teammate Database', link: '/agents/team/teammate-database-agent' }
            ]
          },
          { text: 'Implementer Lead', link: '/agents/team/implementer-lead-agent' },
          { text: 'Teammate Tests', link: '/agents/team/teammate-tests-agent' },
          { text: 'Teammate Backend', link: '/agents/team/teammate-backend-agent' },
          { text: 'Teammate Frontend', link: '/agents/team/teammate-frontend-agent' },
          { text: 'Teammate Database', link: '/agents/team/teammate-database-agent' }
        ]
      },
      {
        text: 'Development',
        items: [
          { text: 'Workflow', link: '/workflow' },
          { text: 'Metrics', link: '/metrics' }
        ]
      },
      {
        text: 'Project',
        items: [
          { text: 'Roadmap', link: '/roadmap' },
          { text: 'Changelog', link: '/changelog' },
          { text: 'FAQ', link: '/faq' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/diego81b/kairos-agents-framework' }
    ],

    footer: {
      message: `KAIROS Framework v${version} — Released under the AGPL-3.0 License.`,
      copyright: 'Copyright © 2026 Comm.it - Florence, Italy'
    },

    editLink: {
      pattern: 'https://github.com/diego81b/kairos-agents-framework/edit/main/:path',
      text: 'Edit this page on GitHub'
    },

    search: {
      provider: 'local'
    }
  },

  mermaid: {},
  mermaidPlugin: {
    class: 'mermaid my-class'
  }
}))

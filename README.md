<div align="center">

# SDD Kit for Claude Code

**The spec is the contract. Code is a consequence of it.**

Ten skills and three sub-agents that turn a raw idea into verified, reviewed code: explicit artifacts, human approval gates, and a `.status` file that is the single source of truth for what is approved.

[![License: MIT](https://img.shields.io/badge/license-MIT-B3A896.svg)](LICENSE)
[![CI](https://github.com/felipefontoura/claude-sdd-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/felipefontoura/claude-sdd-kit/actions/workflows/ci.yml)
[![Claude Code plugin](https://img.shields.io/badge/Claude_Code-plugin-D97757.svg)](https://code.claude.com/docs/en/plugins)
[![Agent Skills](https://img.shields.io/badge/Agent_Skills-compatible-4A6B8A.svg)](https://agentskills.io)

[Install](#install) · [Quickstart](#quickstart) · [Skills](#skills) · [Sub-agents](#sub-agents) · [Rules](#the-rules-the-kit-enforces) · [Privacy](#data-handling-and-privacy) · [The book](#the-book-behind-the-kit) · [Contributing](CONTRIBUTING.md)

</div>

```text
IDEA → PLAN → REQUIREMENTS → DESIGN → TASKS → EXEC → REVIEW
```

AI can accelerate development, but it can also accelerate ambiguity. This kit enforces a simple discipline: explore before planning, define **what and why** before **how**, break the work into verifiable tasks, implement only after you approve, and review the delivery against the approved artifacts.

It is the companion kit to the book [**Spec-Driven Development: The Definitive Guide to Building Software with AI Agents**](https://github.com/felipefontoura/spec-driven-development-book), and the Claude Code edition of [`pi-sdd-kit`](https://github.com/felipefontoura/pi-sdd-kit). Built by [Felipe Fontoura](https://felipefontoura.com/?utm_source=github&utm_medium=referral&utm_campaign=claude-sdd-kit), who used Spec-Driven Development to ship a [13-app crypto fintech solo in 70 days](https://felipefontoura.com/articles/spec-driven-development-case-study/?utm_source=github&utm_medium=referral&utm_campaign=claude-sdd-kit).

## Install

**In Claude Code** (2.1.275 or later), one step:

```text
/plugin install sdd-kit --marketplace felipefontoura/claude-sdd-kit
```

Or from your shell (2.1.292 or later):

```bash
claude plugin install sdd-kit --marketplace felipefontoura/claude-sdd-kit
```

Or in two steps, which works on older versions:

```text
/plugin marketplace add felipefontoura/claude-sdd-kit
/plugin install sdd-kit@felipefontoura
```

If the skills do not show up, run `/reload-plugins`. Type `/sdd-kit:` to list them: Claude Code namespaces every plugin skill with the plugin name, so the commands are `/sdd-kit:init`, `/sdd-kit:prd`, `/sdd-kit:spec`, and so on. That namespace is also why the short names never collide with Claude Code's own `/init`, `/review` or `/status`.

**For a whole team**, install at project scope. Commit the `.claude/settings.json` it writes, and each teammate runs the same command once:

```bash
claude plugin install sdd-kit@felipefontoura --scope project
```

**Update and remove** (shell, any directory):

```bash
claude plugin marketplace update felipefontoura      # refresh the listing
claude plugin update sdd-kit@felipefontoura              # install the new version
claude plugin uninstall sdd-kit@felipefontoura
```

Third-party marketplaces do not auto-update by default; you can switch it on in `/plugin`, under **Marketplaces**.

Using the [Pi coding agent](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)? Use [`pi-sdd-kit`](https://github.com/felipefontoura/pi-sdd-kit) instead: the same method as a Pi package.

## Quickstart

```text
/sdd-kit:init        # once per project: creates the .ai/ workspace
/sdd-kit:steering    # product, tech-stack, conventions, principles
/sdd-kit:prd         # requirements.md  → you approve
/sdd-kit:spec        # design.md        → you approve
/sdd-kit:tasks       # tasks.md + readiness check → you approve
/sdd-kit:exec        # implement one approved task, with verification
/sdd-kit:review      # verify against the approved artifacts
/sdd-kit:status      # where am I? what is the next safe step?
```

For a small, well-bounded change, the short path is `/sdd-kit:init`, `/sdd-kit:prd`, `/sdd-kit:spec`, `/sdd-kit:tasks`, `/sdd-kit:exec`, `/sdd-kit:review`. For a medium project with several features, add `/sdd-kit:steering`, `/sdd-kit:idea` and `/sdd-kit:plan` up front.

Every command lives under the `sdd-kit:` namespace. Approval is a human act: you edit the `.status` file, not Claude. A draft never unlocks the next gate.

## Skills

| Command | Phase | What it does |
|---------|-------|--------------|
| `/sdd-kit:init` | — | Creates or adopts the `.ai/` workspace (steering + sdd). Explicit command: it never runs unprompted. |
| `/sdd-kit:steering` | — | Creates and updates durable project context: product, tech-stack, conventions, principles |
| `/sdd-kit:idea` | IDEA | Explores a raw idea before you commit to it |
| `/sdd-kit:plan` | PLAN | Product plan: features, phases, dependencies, MVP boundary |
| `/sdd-kit:prd` | REQUIREMENTS | `requirements.md`: the WHAT and WHY, in EARS, with negative scope and guided decisions |
| `/sdd-kit:spec` | DESIGN | `design.md`: the HOW, with a requirements-to-design mapping table |
| `/sdd-kit:tasks` | TASKS | `tasks.md` plus the implementation readiness check |
| `/sdd-kit:exec` | IMPLEMENTATION | Implements **one** approved task, with fresh verification evidence |
| `/sdd-kit:review` | REVIEW | `review.md`: verification against requirements, design, tasks and code |
| `/sdd-kit:status` | — | Read-only dashboard: state, blockers, next safe action |

## Sub-agents

Three narrow agents in `agents/`, each with one job and one constraint. Claude Code delegates to them by their description, or you can ask for one by name.

| Agent | Job | Constraint |
|-------|-----|------------|
| `architect` | Produces requirements and design from an approved idea | Never writes code |
| `implementer` | Implements one approved task, code plus tests | Stops on ambiguity instead of guessing; refuses to start before `tasks:approved` |
| `reviewer` | Reviews against the spec in a fresh context | Reports gaps against what was approved; never implements fixes |

## The rules the kit enforces

- The feature number comes from the filesystem (`max + 1`), never from memory.
- `.status` is the single source of truth. A file existing is not approval.
- A draft never unlocks a gate. Only explicit human approval does.
- No code before `tasks:approved`.
- No completion claim without fresh verification evidence.
- Artifacts are written in the language of your conversation. Identifiers (status values, IDs, paths, commands) stay canonical in English.

## How it compares to Spec Kit, OpenSpec and Kiro

[GitHub Spec Kit](https://github.com/github/spec-kit), [OpenSpec](https://github.com/Fission-AI/OpenSpec) and AWS Kiro popularized Spec-Driven Development, and all three are excellent. This kit makes a few deliberately different choices, tuned for one person or a small team working across many sessions:

- **Steering as durable project memory.** Product, stack, conventions and principles live in `.ai/steering/`, apart from per-feature specs, so every session reloads the same project memory instead of re-deriving it.
- **`.status` is the only gate.** One line per feature decides what is approved. A harder guarantee than "the file is there, so it must be done."
- **EARS by default.** Requirements are unambiguous enough for an agent to execute without guessing.
- **Clarification and readiness checks are embedded, not extra phases.** Guided decisions live inside REQUIREMENTS; the readiness check lives inside TASKS. Fewer commands, same rigor.
- **Plain Markdown, installed as a plugin.** No CLI to run, no generated scaffolding to maintain: skills you can read and modify.

If you want an IDE-integrated, enterprise-scale experience, reach for Kiro or Spec Kit. If you want a transparent, file-based, gate-enforcing workflow that lives inside Claude Code, this is that.

## Workspace layout

Skills write into your project under `.ai/`:

```text
.ai/
  steering/          product.md · tech-stack.md · conventions.md · principles.md
  sdd/
    INDEX.md · PLAN.md · WORKFLOW.md
    handoff/sdd-brief.md
    ideas/001-feature-idea.md
    specs/NNN-feature-name/
      .status · requirements.md · design.md · tasks.md · review.md
```

Status values, in order:

```text
idea:exploring · idea:captured
plan:draft · plan:approved
requirements:draft · requirements:approved
design:draft · design:approved
tasks:draft · tasks:approved
implementation:in-progress · implementation:done
review:done
```

## Templates

`templates/` holds the copy-paste versions of every artifact the skills produce: requirements, design, tasks, review, ADR, handoff, steering files. They are examples for humans; the skills carry compact internal copies and do not depend on this folder. See [`templates/README.md`](templates/README.md).

## Data handling and privacy

This plugin is plain Markdown. It contains no hooks, no MCP servers, no scripts, and no executables, and it makes no network requests of its own.

- **What it reads and writes:** the skills read and write files under `.ai/` in your project, and `/sdd-kit:exec` edits the source files of the task you approved. Nothing is written outside the project.
- **What it runs:** the `implementer` and `reviewer` agents have the `Bash` tool so they can run your project's own verification commands (lint, tests, build). They run only what your project defines, under Claude Code's normal permission prompts.
- **What it sends:** nothing, beyond what Claude Code itself sends to Anthropic as part of your session.
- **Personal data:** none collected or stored by the plugin.

## Contributing

Issues and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md); security reports go through [SECURITY.md](SECURITY.md). Release history is in [CHANGELOG.md](CHANGELOG.md).

## The book behind the kit

This kit is the practice half of [**Spec-Driven Development: The Definitive Guide to Building Software with AI Agents**](https://github.com/felipefontoura/spec-driven-development-book). The book is the method: why specs beat vibe coding, EARS requirements, approval gates, and a full TaskFlow Pro build from requirements to production. The kit is the same method as commands you can run.

It is free and open source. [Download the PDF or EPUB](https://felipefontoura.com/get/sdd-book/?utm_source=github&utm_medium=referral&utm_campaign=claude-sdd-kit), or read it on GitHub. If you only want a taste first:

- [What Is Spec-Driven Development?](https://felipefontoura.com/articles/what-is-spec-driven-development/?utm_source=github&utm_medium=referral&utm_campaign=claude-sdd-kit): the method, the four pillars, and when to skip it
- [How to write a spec an AI can build from](https://felipefontoura.com/articles/how-to-write-a-spec/?utm_source=github&utm_medium=referral&utm_campaign=claude-sdd-kit): the EARS format and copy-paste templates

## Acknowledgements

The quality bar for the skills (technical rigor, explicit gates, verification discipline) was inspired by the [Compozy skills](https://github.com/compozy/compozy/tree/main/skills).

## License

[MIT](LICENSE) © Felipe Fontoura

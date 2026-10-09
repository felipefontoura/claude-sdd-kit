# AGENTS.md

This repository is `claude-sdd-kit`: the Claude Code plugin (`sdd`) that ships the Spec-Driven Development skills, sub-agents and templates that accompany the book [Spec-Driven Development](https://github.com/felipefontoura/spec-driven-development-book). It is the Claude Code edition of [`pi-sdd-kit`](https://github.com/felipefontoura/pi-sdd-kit); the skill content is the same.

## Layout

```text
.claude-plugin/
  plugin.json          # plugin manifest (name `sdd`, version, privacy/support URLs)
  marketplace.json     # marketplace `sdd-kit`, so the repo is installable by itself
shared/references/     # SOURCE of the shared rules (edit here, never in the copies)
  sdd-practical.md     # shared SDD rules, gates, status values, language policy
  templates.md         # compact internal templates loaded by the skills
skills/
  init/SKILL.md    # each skill also has references/: generated copies, see below
  steering/SKILL.md
  idea/SKILL.md
  plan/SKILL.md
  prd/SKILL.md
  spec/SKILL.md
  tasks/SKILL.md
  exec/SKILL.md
  review/SKILL.md
  status/SKILL.md
agents/                # architect, implementer, reviewer
templates/             # user-facing, copy-paste templates
.ci/verify.mjs         # the test suite (`npm test`)
```

Everything a user installs is in `skills/`, `agents/` and `templates/`. `shared/` is the source the skills' `references/` copies are generated from; the rest is repo tooling.

## Self-contained skills — the generated `references/` folders

The Agent Skills spec says a skill references its files by a path relative to **its own root**, and installers such as `npx skills add` and skills.sh copy one skill folder at a time. A skill that reaches into `../_shared/` works only when the whole tree is present, which is the first version of this repo's mistake.

So each skill carries its own `references/` with the files it cites, and those are **generated copies**:

```bash
# edit the source…
$EDITOR shared/references/sdd-practical.md
# …then regenerate every skill's copy
npm run sync
```

Never edit `skills/*/references/*` by hand. `npm test` fails if a copy differs from `shared/references/`, if a skill cites a file it does not hold, or if a `SKILL.md` points outside its own folder.

## Primary workflow

```text
IDEA → PLAN → REQUIREMENTS → DESIGN → TASKS → EXEC → REVIEW
```

The skills are named for the phase they run: `prd` writes `requirements.md`, `spec` writes `design.md`.

## Command naming — read before renaming anything

The plugin is named `sdd`, the skills have short names (`init`, `prd`, `spec`...), and Claude Code namespaces plugin skills by plugin name, so the commands are `/sdd:init`, `/sdd:prd`, `/sdd:spec`. This was checked on Claude Code 2.1.296: the session's `slash_commands` lists exactly `sdd:init`, `sdd:prd`..., and the agents as `sdd:architect`, `sdd:implementer`, `sdd:reviewer`.

**This only works because the skills are shipped as a plugin.** The namespace is what keeps `init`, `plan`, `review` and `status` from colliding with Claude Code's own commands. Tested headless on 2.1.296: the same skills dropped loose into a project's `.claude/skills/` make `/init` and `/status` run the skill instead of the built-in. So:

- Distribute through the plugin only. Do not document `npx skills add`, skills.sh or a manual copy into `.claude/skills/`; a loose install would shadow built-ins.
- Skill directory names must equal the `name:` and must not carry an `sdd-` prefix. The namespace already says it.
- In prose, always write the full command, `/sdd:prd`, never the bare skill name, so it reads right wherever it is copied.

`npm test` fails on a `/sdd-<skill>` command (the old flat form) and on any `/sdd:<x>` that is not a skill.

If a loose-install channel is ever wanted, build it as a separate artifact with an `sdd-` prefix (a generated tree), rather than reusing these names. That is a deliberate decision, not a drive-by edit.

Do not reintroduce Pi's `/skill:` prefix.

## Skill rules

- Each skill is `skills/<name>/SKILL.md` and `name` must equal `<name>` exactly.
- Quote `description` with single quotes; an unquoted description containing `:` breaks the YAML.
- The description says when to use the skill and when not to; Claude uses it to decide on invocation.
- Frontmatter keys are limited to the [Agent Skills spec](https://agentskills.io/specification): `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. `npm test` enforces it.
- Keep `SKILL.md` under 500 lines. Move depth into `shared/references/` and cite it as `references/<file>.md`, relative to the skill root.
- Never use `../` in a `SKILL.md`. Keep `shared/references/sdd-practical.md` the single source of the workflow rules: change it first, run `npm run sync`, then update the affected skills and templates.

## Template policy

Two layers, kept in step:

1. `shared/references/templates.md`: compact internal reference loaded by the skills (copied into each skill by `npm run sync`).
2. `templates/*.md`: user-facing, richer, instructional copies.

When you add an artifact type, update both layers and document it in `templates/README.md` and `README.md`.

## Language policy

Repository source, README, skills, templates and docs are **EN-US**. At runtime the skills answer in the user's chat language and write project artifacts in it too, while paths, file names, status values, commands, code symbols and stable IDs stay canonical.

## Artifact structure the skills expect

```text
.ai/
  strategy/handoff/strategy-brief.md   # optional upstream input
  steering/product.md · tech-stack.md · conventions.md · principles.md
  sdd/
    INDEX.md · WORKFLOW.md · PLAN.md
    handoff/sdd-brief.md
    ideas/001-feature-idea.md
    specs/001-feature-name/.status · requirements.md · design.md · tasks.md · review.md · decisions.md
```

Do not revert this to `.sdd/`. Valid `.status` values are listed in `shared/references/sdd-practical.md`.

## Plugin directory constraints

The plugin is built to pass Anthropic's directory checks. Keep it that way:

- Text files only (plus PNG, JPEG, GIF, WebP, SVG and fonts). No `.pdf`, `.zip`, `.ico`, or binaries.
- Each non-image file under 256 KiB; at most 512 files; no symlinks, submodules or Git LFS.
- No hooks, MCP servers, scripts, `bin/` or package launchers without a deliberate decision: each one changes the privacy section of the README and triggers manual review.
- No secrets, ever.
- Bump `version` in `plugin.json`, `marketplace.json` and `package.json` together for every release; `npm test` checks they agree and that `CHANGELOG.md` has the entry.

## Links back to the site

Every link from this repo to `felipefontoura.com` must carry:

```text
?utm_source=github&utm_medium=referral&utm_campaign=claude-sdd-kit
```

Lowercase, exactly these values, and end the path with `/` before the `?`. Links to other GitHub repos or third-party docs stay clean. `npm test` checks this.

## Validation

```bash
npm test           # structure, frontmatter, cross-references, UTM, plugin limits
npm run lint       # markdownlint
npm run validate:skills   # skills-ref, the agentskills.io reference validator
npm run sync       # regenerate skills/*/references from shared/references
claude plugin validate .   # Claude Code's own manifest check (needs the CLI)
```

Run all three after structural changes.

## Testing locally in Claude Code

```bash
claude --plugin-dir /absolute/path/to/claude-sdd-kit
```

Then run `/sdd:status` in an empty directory: it should report a missing `.ai/` workspace and `Next feature ID: 001`.

## Editing guidelines for AI agents

- Prefer targeted edits over rewrites.
- Keep the README command list, `templates/README.md` and the skill names synchronized.
- When changing workflow rules, update `sdd-practical.md` first, then skills and templates.
- Never hand-edit `.status` semantics in one place only.

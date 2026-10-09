# Contributing to SDD Kit

Thanks for helping improve the kit. This guide gets you productive fast. The deeper rules for the repository live in [AGENTS.md](AGENTS.md); read it before a structural change.

## The golden rule

**The skills are the product, and the book is the method.** The pipeline is `IDEA → PLAN → REQUIREMENTS → DESIGN → TASKS → EXEC → REVIEW`, `.status` is the only gate, and the feature number comes from the filesystem. If you change one of those, the [book](https://github.com/felipefontoura/spec-driven-development-book) and the sibling [`pi-sdd-kit`](https://github.com/felipefontoura/pi-sdd-kit) must change with it. Open an issue first for anything that touches the workflow rules.

## Setup

You only need **Node 20 or later**. There are no dependencies to install.

```bash
git clone https://github.com/felipefontoura/claude-sdd-kit.git
cd claude-sdd-kit
npm test            # structure, frontmatter, cross-references, plugin limits
npm run lint        # markdownlint (fetched on demand via npx)
npm run validate:skills   # the agentskills.io reference validator, on every skill
```

To try your change inside Claude Code without installing anything:

```bash
claude --plugin-dir /absolute/path/to/claude-sdd-kit
```

Then run `/sdd-kit:status` in an empty directory. It should report a missing `.ai/` workspace.

## What `npm test` enforces

- **Manifests**: `plugin.json` and `marketplace.json` parse, the plugin name is valid, and the version is the same in `plugin.json`, `marketplace.json`, `package.json` and `CHANGELOG.md`.
- **Agent Skills spec**: every `skills/*/SKILL.md` has `name` equal to its directory, a `description` of 1 to 1024 characters, only allowed frontmatter keys, and a body under 500 lines.
- **Agents**: each `agents/*.md` has `name`, `description` and `tools`.
- **Cross-references**: every `/sdd-kit:<skill>` command mentioned anywhere points at a skill that exists, and the old `/sdd-<skill>` form is rejected, no `/skill:` prefix has crept back in, and each skill is self-contained: it cites only files in its own `references/`, byte-identical to `shared/references/`.
- **Plugin directory limits**: no symlinks, no system files, no unexpected binaries, every text file under 256 KiB, at most 512 files.
- **Site links**: every link to `felipefontoura.com` carries the repo's UTM suffix.

CI runs the same suite on Linux, macOS and Windows, plus markdownlint, `claude plugin validate`, and the [`skills-ref`](https://agentskills.io/specification#validation) reference validator for the Agent Skills spec.

## Adding or changing a skill

1. Create `skills/<name>/SKILL.md`. The command becomes `/sdd-kit:<name>`. The `name` must equal the directory. Quote the `description` with single quotes.
2. Say in the description when to use the skill **and** when not to.
3. Put deep material in `shared/references/`, cite it as `references/<file>.md`, and run `npm run sync`. Never edit `skills/*/references/` by hand: those are generated copies.
4. Update the command list in `README.md` and `templates/README.md`.
5. Run `npm test`.

Do not add an `sdd-` prefix to a skill directory, and do not document loose installs: the plugin namespace is what keeps short names like `init` and `status` from shadowing Claude Code's own commands. See "Command naming" in [AGENTS.md](AGENTS.md).

## Releasing

1. Move the `[Unreleased]` entries in `CHANGELOG.md` under a new `## [x.y.z] — YYYY-MM-DD` heading.
2. Bump `version` in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and `package.json`.
3. `npm test` and `claude plugin validate .`
4. Merge to `main`, then tag `vx.y.z`.

Claude Code and the plugin directory pick up a new version only when `version` changes.

## Commits and pull requests

- Keep commits atomic, in the imperative mood: "Add X", "Fix Y".
- Open a PR against `main`; CI must be green.
- Describe **what** changed and **why**, and link any related issue.

By contributing, you agree that your contributions are licensed under the project's [LICENSE](LICENSE) and that you will follow the [Code of Conduct](CODE_OF_CONDUCT.md).

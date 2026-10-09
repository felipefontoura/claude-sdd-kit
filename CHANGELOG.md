# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-10-09

### Added

- Claude Code plugin `sdd-kit` with a self-hosted marketplace `felipefontoura`, installable with
  `/plugin install sdd-kit --marketplace felipefontoura/claude-sdd-kit`.
- Ten skills, invoked as `/sdd-kit:init`, `/sdd-kit:steering`, `/sdd-kit:idea`, `/sdd-kit:plan`, `/sdd-kit:prd`,
  `/sdd-kit:spec`, `/sdd-kit:tasks`, `/sdd-kit:exec`, `/sdd-kit:review`, `/sdd-kit:status`.
- Three sub-agents: `architect`, `implementer`, `reviewer`.
- Copy-paste artifact templates in `templates/`.
- Self-contained skills: each carries its own `references/`, generated from `shared/references/`
  by `npm run sync`, so a skill installed on its own (`npx skills add`) still finds its rules.
- `npm test` suite: manifests, Agent Skills spec conformance, cross-references, plugin directory
  limits, UTM links. CI on Linux, macOS and Windows, plus markdownlint, `claude plugin validate`
  and the `skills-ref` reference validator from agentskills.io.

### Notes

- The skill content is the same as [`pi-sdd-kit`](https://github.com/felipefontoura/pi-sdd-kit)
  0.1.2, with the skills renamed for the plugin namespace (`/sdd-kit:prd` instead of `/skill:sdd-prd`) and the sub-agents.

[Unreleased]: https://github.com/felipefontoura/claude-sdd-kit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/felipefontoura/claude-sdd-kit/releases/tag/v0.1.0

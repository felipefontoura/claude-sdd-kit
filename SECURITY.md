# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report vulnerabilities privately through GitHub's [private security advisory](https://github.com/felipefontoura/claude-sdd-kit/security/advisories/new) feature, or via [felipefontoura.com/contact](https://felipefontoura.com/contact/?utm_source=github&utm_medium=referral&utm_campaign=claude-sdd-kit) (subject: `claude-sdd-kit security`). We aim to acknowledge within 72 hours and to provide a remediation timeline after triage.

Please include a description, reproduction steps, the affected version, and the impact.

## Supported versions

Security fixes target the latest released version. Earlier versions are not maintained.

## Scope and things to know

SDD Kit is a set of Markdown skills, sub-agent definitions and templates. A few properties matter for a security review:

- **No code ships in the plugin.** There are no hooks, MCP servers, scripts, executables or package launchers, and the plugin makes no network requests of its own.
- **The skills write files.** They create and edit files under `.ai/` in the user's project, and `/sdd:exec` edits the source files of the task the user approved.
- **Two sub-agents can run shell commands.** `implementer` and `reviewer` have the `Bash` tool so they can run the project's own verification commands. They run under Claude Code's normal permission prompts.
- **No secrets are read or stored** by the kit, and none must be committed to this repository.

The highest-severity classes are anything that could make a skill or agent **write outside the project**, **run a command the user did not approve**, **exfiltrate project content**, or **bypass an approval gate** (for example, a prompt-injection path that makes `/sdd:exec` start before `tasks:approved`). Reports in those classes get priority.

#!/usr/bin/env node
// claude-sdd-kit — the test suite. Zero dependencies, runs on Node >= 20 on every OS.
//
// It enforces what the plugin directory and the Agent Skills spec require, plus the
// invariants this kit promises (command names, cross-references, version agreement).
// Run: `npm test`.

import { readFileSync, readdirSync, lstatSync, existsSync } from "node:fs";
import { join, relative, sep, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { citedReferences, sharedFiles } from "./sync-references.mjs";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const UTM = "utm_source=github&utm_medium=referral&utm_campaign=claude-sdd-kit";

const failures = [];
let checks = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) failures.push(msg);
};
const rel = (p) => relative(ROOT, p).split(sep).join("/");
const read = (p) => readFileSync(p, "utf8");
const json = (p) => {
  try {
    return JSON.parse(read(p));
  } catch (e) {
    failures.push(`${rel(p)}: invalid JSON (${e.message})`);
    return null;
  }
};

// ---------------------------------------------------------------- file walk
const SKIP_DIRS = new Set([".git", "node_modules"]);
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = lstatSync(p);
    if (st.isSymbolicLink()) {
      failures.push(`${rel(p)}: symbolic links are not allowed (the plugin directory refuses them)`);
      continue;
    }
    if (st.isDirectory()) walk(p);
    else files.push({ path: p, size: st.size });
  }
})(ROOT);

// ---------------------------------------------------------------- plugin directory limits
const TEXT_EXT = new Set([".md", ".json", ".jsonc", ".yml", ".yaml", ".mjs", ".js", ".txt", ".svg", ".gitkeep", ""]);
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const SYSTEM_FILES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);
const WINDOWS_DEVICE = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

ok(files.length <= 512, `the plugin has ${files.length} files; the directory holds a plugin above 512 for review`);
const seenLower = new Map();
for (const { path, size } of files) {
  const r = rel(path);
  const name = basename(path);
  const ext = extname(path).toLowerCase();
  ok(!SYSTEM_FILES.has(name), `${r}: system file; delete it`);
  ok(!r.includes("__MACOSX"), `${r}: __MACOSX entry; delete it`);
  ok(!/[:<>"|?*]/.test(r) && !/[. ]$/.test(name), `${r}: name is not valid on Windows`);
  ok(!WINDOWS_DEVICE.test(name), `${r}: name is a Windows device name`);
  const lower = r.toLowerCase();
  ok(!seenLower.has(lower), `${r}: differs only by case from ${seenLower.get(lower)}`);
  seenLower.set(lower, r);
  if (IMAGE_EXT.has(ext)) continue;
  ok(TEXT_EXT.has(ext), `${r}: binary or unknown file type (${ext || "none"}); the directory holds these for review`);
  ok(size < 256 * 1024, `${r}: ${size} bytes; non-image files must stay under 256 KiB`);
}

// ---------------------------------------------------------------- frontmatter
function frontmatter(text) {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const data = {};
  let lastKey = null;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) {
      lastKey = kv[1];
      data[lastKey] = kv[2];
    } else if (lastKey && /^\s+\S/.test(line)) {
      data[lastKey] += " " + line.trim();
    }
  }
  for (const k of Object.keys(data)) {
    let v = data[k].trim();
    if (/^'.*'$/.test(v)) v = v.slice(1, -1).replace(/''/g, "'");
    else if (/^".*"$/.test(v)) v = v.slice(1, -1);
    data[k] = v;
  }
  return { data, raw: m[1], body: m[2] };
}

// ---------------------------------------------------------------- manifests + versions
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const plugin = json(join(ROOT, ".claude-plugin/plugin.json"));
const market = json(join(ROOT, ".claude-plugin/marketplace.json"));
const pkg = json(join(ROOT, "package.json"));

if (plugin) {
  ok(/^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/.test(plugin.name ?? ""), `plugin.json: name "${plugin.name}" must be lowercase letters, digits, hyphens, up to 64`);
  for (const f of ["displayName", "description", "author", "version", "license", "homepage", "repository"]) {
    ok(plugin[f] !== undefined, `plugin.json: missing "${f}"`);
  }
  ok(SEMVER.test(plugin.version ?? ""), `plugin.json: version "${plugin.version}" is not semver`);
  ok(!("hooks" in plugin) && !("mcpServers" in plugin), "plugin.json: this plugin ships no hooks or MCP servers; the README privacy section says so");
}
if (market) {
  ok(Array.isArray(market.plugins) && market.plugins.length === 1, "marketplace.json: expected exactly one plugin");
  const entry = market.plugins?.[0];
  ok(entry?.name === plugin?.name, `marketplace.json: plugin name "${entry?.name}" must equal plugin.json name "${plugin?.name}"`);
  ok(entry?.version === plugin?.version, `marketplace.json: version "${entry?.version}" must equal plugin.json version "${plugin?.version}"`);
}
if (pkg) {
  ok(pkg.version === plugin?.version, `package.json: version "${pkg.version}" must equal plugin.json version "${plugin?.version}"`);
  ok(pkg.private === true, "package.json: must stay private; this repo's product is the plugin, not an npm package");
}
const changelog = existsSync(join(ROOT, "CHANGELOG.md")) ? read(join(ROOT, "CHANGELOG.md")) : "";
ok(plugin && new RegExp(`^## \\[${plugin.version.replace(/\./g, "\\.")}\\] — \\d{4}-\\d{2}-\\d{2}$`, "m").test(changelog), `CHANGELOG.md: no "## [${plugin?.version}] — YYYY-MM-DD" entry for the current version`);

// ---------------------------------------------------------------- icon (directory listing)
// The directory listing wants a PNG under 2 MB, found by its default location (no "icon" field in the manifest). This only looks at the file list the walk above
// already built: the script never opens the image. The portal checks the dimensions.
{
  const png = files.filter((f) => rel(f.path).startsWith(".claude-plugin/") && /\.png$/i.test(f.path));
  ok(png.length === 1, `.claude-plugin/ should hold exactly one PNG icon; found ${png.length}`);
  ok(png.every((f) => f.size < 2 * 1024 * 1024), "the plugin icon must stay under 2 MB");
}

// ---------------------------------------------------------------- skills (Agent Skills spec)
const SKILLS_DIR = join(ROOT, "skills");
const SKILL_KEYS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
const skillDirs = readdirSync(SKILLS_DIR).filter((n) => lstatSync(join(SKILLS_DIR, n)).isDirectory());
const EXPECTED_SKILLS = ["exec", "idea", "init", "plan", "prd", "review", "spec", "status", "steering", "tasks"];
ok(JSON.stringify([...skillDirs].sort()) === JSON.stringify(EXPECTED_SKILLS), `skills/: expected ${EXPECTED_SKILLS.join(", ")}; found ${skillDirs.sort().join(", ")}`);

for (const dir of skillDirs) {
  const file = join(SKILLS_DIR, dir, "SKILL.md");
  if (!existsSync(file)) {
    failures.push(`skills/${dir}: missing SKILL.md`);
    continue;
  }
  const fm = frontmatter(read(file));
  if (!fm) {
    failures.push(`skills/${dir}/SKILL.md: missing or unparsable frontmatter`);
    continue;
  }
  const { data, raw, body } = fm;
  ok(data.name === dir, `skills/${dir}/SKILL.md: name "${data.name}" must equal the directory name`);
  ok(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.name ?? "") && (data.name ?? "").length <= 64, `skills/${dir}/SKILL.md: name is not valid (lowercase, hyphens, <= 64)`);
  ok(typeof data.description === "string" && data.description.length >= 1 && data.description.length <= 1024, `skills/${dir}/SKILL.md: description must be 1-1024 characters (got ${data.description?.length ?? 0})`);
  ok(/^description:\s*'/.test(raw.split("\n").find((l) => l.startsWith("description:")) ?? ""), `skills/${dir}/SKILL.md: quote the description with single quotes (a colon inside breaks the YAML)`);
  for (const k of Object.keys(data)) ok(SKILL_KEYS.has(k), `skills/${dir}/SKILL.md: unknown frontmatter key "${k}" (Agent Skills spec)`);
  ok(body.split("\n").length < 500, `skills/${dir}/SKILL.md: body is ${body.split("\n").length} lines; keep it under 500`);
}

// ---------------------------------------------------------------- agents
const AGENTS_DIR = join(ROOT, "agents");
const agentFiles = readdirSync(AGENTS_DIR).filter((n) => n.endsWith(".md"));
ok(JSON.stringify(agentFiles.sort()) === JSON.stringify(["architect.md", "implementer.md", "reviewer.md"]), `agents/: expected architect, implementer, reviewer; found ${agentFiles.join(", ")}`);
for (const f of agentFiles) {
  const fm = frontmatter(read(join(AGENTS_DIR, f)));
  if (!fm) {
    failures.push(`agents/${f}: missing or unparsable frontmatter`);
    continue;
  }
  ok(fm.data.name === basename(f, ".md"), `agents/${f}: name "${fm.data.name}" must equal the file name`);
  ok(Boolean(fm.data.description) && fm.data.description.length <= 1024, `agents/${f}: description missing or over 1024 characters`);
  ok(Boolean(fm.data.tools), `agents/${f}: declare "tools" explicitly (least privilege)`);
  for (const forbidden of ["hooks", "mcpServers", "permissionMode"]) {
    ok(!(forbidden in fm.data), `agents/${f}: plugin agents cannot set "${forbidden}"`);
  }
}
const reviewerTools = frontmatter(read(join(AGENTS_DIR, "reviewer.md")))?.data.tools ?? "";
ok(!/\b(Write|Edit)\b/.test(reviewerTools), "agents/reviewer.md: the reviewer must not have Write or Edit (it reports; it does not fix)");
const architectTools = frontmatter(read(join(AGENTS_DIR, "architect.md")))?.data.tools ?? "";
ok(!/\bBash\b/.test(architectTools), "agents/architect.md: the architect must not have Bash (it never writes or runs code)");

// ---------------------------------------------------------------- self-contained skills
// The Agent Skills spec references files relative to the skill root, and installers copy one
// skill folder at a time. So no SKILL.md may reach outside its folder, and every file it cites
// must sit in its own references/, byte-identical to the single source in shared/references/.
const SHARED_DIR = join(ROOT, "shared", "references");
const shared = sharedFiles();
ok(shared.length > 0, "shared/references/: no source files");
for (const dir of skillDirs) {
  const skillDir = join(SKILLS_DIR, dir);
  const text = read(join(skillDir, "SKILL.md"));
  ok(!/(^|[\s`(])\.\.\//.test(text), `skills/${dir}/SKILL.md: references a path outside the skill folder ("../"); keep the skill self-contained`);
  ok(!text.includes("_shared"), `skills/${dir}/SKILL.md: still mentions _shared`);
  const cited = citedReferences(text);
  const refsDir = join(skillDir, "references");
  const present = existsSync(refsDir) ? readdirSync(refsDir).sort() : [];
  ok(JSON.stringify(present) === JSON.stringify(cited), `skills/${dir}/references: has [${present}] but SKILL.md cites [${cited}]; run npm run sync`);
  for (const f of cited) {
    const copy = join(refsDir, f);
    const src = join(SHARED_DIR, f);
    ok(existsSync(src), `skills/${dir}/SKILL.md cites references/${f}, missing from shared/references/`);
    if (existsSync(copy) && existsSync(src)) {
      ok(readFileSync(copy).equals(readFileSync(src)), `skills/${dir}/references/${f}: differs from shared/references/${f}; edit the source and run npm run sync`);
    }
  }
}
for (const f of shared) {
  ok(skillDirs.some((d) => citedReferences(read(join(SKILLS_DIR, d, "SKILL.md"))).includes(f)), `shared/references/${f}: no skill cites it`);
}

// ---------------------------------------------------------------- cross-references
const mdFiles = files.filter((f) => f.path.endsWith(".md") && !rel(f.path).startsWith(".github/") && basename(f.path) !== "CHANGELOG.md");
const CMD = /(?<=^|[\s`(\["'“])\/sdd-kit:([a-z]+)\b/gm;
const STALE_CMD = /(?<=^|[\s`(\["'“])\/sdd[-:](init|steering|idea|plan|prd|spec|tasks|exec|review|status)\b/m;
const skillSet = new Set(skillDirs);
for (const { path } of mdFiles) {
  const text = read(path);
  const r = rel(path);
  for (const m of text.matchAll(CMD)) {
    ok(skillSet.has(m[1]), `${r}: "/sdd-kit:${m[1]}" does not match any skill`);
  }
  ok(!/\/skill:sdd-/.test(text), `${r}: found Pi's "/skill:sdd-" prefix; this plugin uses "/sdd-kit:<skill>"`);
  ok(!STALE_CMD.test(text), `${r}: found a "/sdd-<skill>" command; the plugin commands are "/sdd-kit:<skill>"`);
}

// every skill is documented in the README table and the templates README
const readme = read(join(ROOT, "README.md"));
const tplReadme = read(join(ROOT, "templates", "README.md"));
for (const s of skillDirs) {
  ok(readme.includes(`\`/sdd-kit:${s}\``), `README.md: skill /sdd-kit:${s} is not in the skills table`);
}
ok(/plugin\.json/.test(read(join(ROOT, "AGENTS.md"))), "AGENTS.md: must describe the plugin manifest");
ok(readme.split(/\s+/).length >= 40, "README.md: at least 40 words are required by the plugin directory");
ok(tplReadme.length > 0, "templates/README.md: missing");
ok(/\/plugin install sdd-kit/.test(readme), "README.md: must contain the marketplace install line");

// ---------------------------------------------------------------- site links carry the UTM suffix
for (const { path } of files) {
  if (!/\.(md|json|ya?ml)$/.test(path)) continue;
  const text = read(path);
  for (const m of text.matchAll(/https?:\/\/(?:www\.)?felipefontoura\.com[^\s)"'>\]`]*/g)) {
    const url = m[0].replace(/[.,;]+$/, "");
    ok(url.includes(UTM), `${rel(path)}: link to felipefontoura.com without the repo UTM suffix: ${url}`);
    ok(/\/\?utm_/.test(url), `${rel(path)}: end the path with "/" before "?" so the host does not redirect: ${url}`);
  }
}

// ---------------------------------------------------------------- required repo files
for (const f of ["LICENSE", "README.md", "CHANGELOG.md", "CONTRIBUTING.md", "SECURITY.md", "CODE_OF_CONDUCT.md", "AGENTS.md", ".claude/CLAUDE.md", ".github/workflows/ci.yml"]) {
  ok(existsSync(join(ROOT, f)), `${f}: missing`);
}

// ---------------------------------------------------------------- report
if (failures.length) {
  console.error(`\nFAIL — ${failures.length} problem(s) across ${checks} checks:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error("");
  process.exit(1);
}
console.log(`OK — ${checks} checks passed (${skillDirs.length} skills, ${agentFiles.length} agents, ${files.length} files).`);

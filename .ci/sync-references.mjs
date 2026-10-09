#!/usr/bin/env node
// Copies the shared reference files into every skill that cites them.
//
// The Agent Skills spec wants a skill to be self-contained: files are referenced by a path
// relative to the skill's own root. Installers such as `npx skills add` copy a skill's folder
// and nothing else, so a skill that reaches out to `../_shared/` breaks there. Instead, the
// single source of truth lives in `shared/references/`, and this script materializes the
// copies each skill needs under `skills/<name>/references/`.
//
// Edit `shared/references/*.md`, then run `npm run sync`. `npm test` fails if a copy drifts.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const SHARED = join(ROOT, "shared", "references");
const SKILLS = join(ROOT, "skills");

/** The reference files a skill cites, e.g. `references/sdd-practical.md` in its SKILL.md. */
export function citedReferences(skillMd) {
  return [...new Set([...skillMd.matchAll(/(?<![\w./-])references\/([\w.-]+\.md)/g)].map((m) => m[1]))].sort();
}

export const sharedFiles = () => readdirSync(SHARED).filter((f) => f.endsWith(".md")).sort();

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let written = 0;
  for (const name of readdirSync(SKILLS).filter((n) => !n.startsWith(".")).sort()) {
    const dir = join(SKILLS, name);
    const cited = citedReferences(readFileSync(join(dir, "SKILL.md"), "utf8"));
    const target = join(dir, "references");
    rmSync(target, { recursive: true, force: true });
    if (!cited.length) continue;
    mkdirSync(target);
    for (const f of cited) {
      if (!existsSync(join(SHARED, f))) {
        console.error(`skills/${name}/SKILL.md cites references/${f}, which is not in shared/references/`);
        process.exit(1);
      }
      writeFileSync(join(target, f), readFileSync(join(SHARED, f)));
      written++;
    }
  }
  console.log(`synced ${written} reference files into skills/*/references/`);
}

#!/usr/bin/env node
/**
 * Guards against the em dash (U+2014) creeping back into shipped source.
 * Runs as part of `npm run lint`, not just as a one-off pass, so a future
 * component, generated file, or pasted-in copy that reintroduces one fails
 * the standard check the same way a type error would, instead of relying
 * on someone noticing it in review. `.mjs` (rather than `.js` + require)
 * so it satisfies the project's own `no-require-imports` lint rule.
 */
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(scriptsDir, "..", "src");
const EXTENSIONS = new Set([".ts", ".tsx", ".css"]);
const EM_DASH = "—";

const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!EXTENSIONS.has(extname(entry.name))) continue;

    const lines = readFileSync(full, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (line.includes(EM_DASH)) {
        offenders.push(`${relative(process.cwd(), full)}:${i + 1}`);
      }
    });
  }
}

walk(ROOT);

if (offenders.length > 0) {
  console.error("\nEm dash found in source. Use a hyphen instead:\n");
  for (const line of offenders) console.error(`  ${line}`);
  console.error("");
  process.exit(1);
}

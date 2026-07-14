/**
 * Amplify static-deploy post-build fixup.
 *
 * TanStack Start SPA mode prerenders the app shell as `dist/client/_shell.html`.
 * Amplify serves `index.html` as the root document, so we publish the shell under
 * that name. The shell is rendered during the *server* build pass, whose asset
 * hashes can differ from the *client* build (notably the global Tailwind stylesheet),
 * leaving `<link>`/`<script>` refs that 404 in the static client artifact. We rewrite
 * any reference whose target file is missing to the real file emitted in
 * `dist/client/assets`, matched by name prefix + extension.
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = join(root, "dist", "client");
const shellPath = join(clientDir, "_shell.html");
const indexPath = join(clientDir, "index.html");
const assetsDir = join(clientDir, "assets");

async function main() {
  if (!existsSync(shellPath)) {
    throw new Error(`Missing ${shellPath} — did the SPA build (AMPLIFY=1) run?`);
  }

  let html = await readFile(shellPath, "utf8");
  const assets = await readdir(assetsDir);

  // e.g. "global-BmCchgrn.css" -> base "global", ext "css"
  const parse = (file) => {
    const m = file.match(/^(.*)-[A-Za-z0-9_-]+\.([a-z0-9]+)$/);
    return m ? { base: m[1], ext: m[2] } : null;
  };

  const rewrites = [];
  html = html.replace(/\/assets\/([A-Za-z0-9._-]+\.(?:js|css))/g, (full, file) => {
    if (existsSync(join(assetsDir, file))) return full; // already correct
    const want = parse(file);
    if (!want) return full;
    const candidates = assets.filter((a) => {
      const got = parse(a);
      return got && got.base === want.base && got.ext === want.ext;
    });
    if (candidates.length !== 1) {
      console.warn(
        `WARN  ${file} missing; ${candidates.length} candidates for ${want.base}.${want.ext} — left unchanged`,
      );
      return full;
    }
    rewrites.push(`${file} -> ${candidates[0]}`);
    return `/assets/${candidates[0]}`;
  });

  await writeFile(indexPath, html);
  console.log(`Wrote ${indexPath}`);
  if (rewrites.length) {
    console.log("Rewrote stale asset refs:");
    for (const r of rewrites) console.log(`  ${r}`);
  } else {
    console.log("No stale asset refs found.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

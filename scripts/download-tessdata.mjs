import { mkdir, writeFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "tessdata");
const outFile = join(outDir, "eng.traineddata");
const url =
  "https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata";

async function main() {
  try {
    const existing = await stat(outFile);
    if (existing.size > 1_000_000) {
      console.log(`OK  eng.traineddata already present (${(existing.size / 1e6).toFixed(1)} MB)`);
      return;
    }
  } catch {
    // missing — download below
  }

  console.log("Downloading eng.traineddata for offline OCR…");
  await mkdir(outDir, { recursive: true });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outFile, buffer);
  console.log(`Saved ${outFile} (${(buffer.length / 1e6).toFixed(1)} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

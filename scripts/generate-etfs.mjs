import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseEtfMarkdown } from "./etf-parser.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(rootDir, "etf.md");
const outputPath = join(rootDir, "src", "data", "etfs.json");

const markdown = await readFile(sourcePath, "utf8");
const etfs = parseEtfMarkdown(markdown);

await writeFile(outputPath, `${JSON.stringify(etfs, null, 2)}\n`, "utf8");

console.log(`Generated ${etfs.length} ETFs at ${outputPath}`);

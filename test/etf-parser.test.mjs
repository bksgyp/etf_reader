import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseCodes } from "../api/etf-prices.js";
import { ETF_HEADERS, parseEtfMarkdown } from "../scripts/etf-parser.mjs";

test("parses the ETF markdown table", async () => {
  const markdown = await readFile(new URL("../etf.md", import.meta.url), "utf8");
  const etfs = parseEtfMarkdown(markdown);

  assert.equal(ETF_HEADERS.length, 17);
  assert.equal(etfs.length, 1107);
  assert.equal(Object.keys(etfs[0]).length, 17);
  assert.equal(etfs[0]["단축코드"], "495710");
});

test("rejects rows with missing columns", () => {
  const markdown = [
    `| ${ETF_HEADERS.join(" | ")} |`,
    `| ${ETF_HEADERS.map(() => "---").join(" | ")} |`,
    "| KR7000000000 | 000000 |",
  ].join("\n");

  assert.throws(() => parseEtfMarkdown(markdown), /expected 17/i);
});

test("parses numeric and alphanumeric ETF short codes", () => {
  assert.deepEqual(parseCodes("495710,0120J0, 0001p0, invalid"), ["495710", "0120J0", "0001P0"]);
});

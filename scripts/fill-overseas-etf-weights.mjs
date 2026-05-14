import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const ETF_JSON_PATH = path.join(ROOT_DIR, "src", "data", "etfs.json");
const HOLDINGS_JSON_PATH = path.join(ROOT_DIR, "src", "data", "etf_holdings.json");
const PROGRESS_JSON_PATH = path.join(ROOT_DIR, "src", "data", "etf_holdings.progress.json");
const PUBLIC_JSON_PATH = path.join(ROOT_DIR, "public", "data", "etf_holdings.json");
const K_ETF_API_BASE = "https://www.k-etf.com/api/v0";

const targetDate = process.argv.find((arg) => arg.startsWith("--date="))?.slice("--date=".length);
const sleepMs = Number(process.argv.find((arg) => arg.startsWith("--sleep="))?.slice("--sleep=".length) ?? 150);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const writeJson = (filePath, payload) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
};

const normalizeName = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/&/g, " AND ")
    .replace(/[^0-9A-Z가-힣]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

const looseName = (value) =>
  normalizeName(value)
    .replace(/\b(CLASS|CL|SHS|ORD|ADR|ADS|REG|THE|PLC|SA|NV|AG|SE|LTD|INC|CORP|CO|GROUP|HOLDINGS|HOLDING|CORPORATION)\b/g, " ")
    .replace(/\b[A-Z]\b/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const compactDate = (value) => String(value).replaceAll("-", "");

const pickDate = (dates) => {
  if (!targetDate) {
    return dates[0];
  }

  return dates.find((date) => compactDate(date) <= targetDate) ?? dates[0];
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
};

const fetchWeights = async (etfCode) => {
  const dates = await fetchJson(`${K_ETF_API_BASE}/holds/latest?code=XKRX-EF-${etfCode}`);
  if (!Array.isArray(dates) || dates.length === 0) {
    return { date: null, holdings: [] };
  }

  const date = pickDate(dates);
  const data = await fetchJson(`${K_ETF_API_BASE}/holds/top20holds/indates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dates: [compactDate(date)],
      code: etfCode,
      market: "XKRX",
    }),
  });

  return { date, holdings: Array.isArray(data?.[date]) ? data[date] : [] };
};

const buildHoldingIndex = (holdings) => {
  const exact = new Map();
  const loose = new Map();

  holdings.forEach((holding, index) => {
    const exactKey = normalizeName(holding.componentName);
    const looseKey = looseName(holding.componentName);

    if (!exact.has(exactKey)) exact.set(exactKey, []);
    if (!loose.has(looseKey)) loose.set(looseKey, []);
    exact.get(exactKey).push(index);
    loose.get(looseKey).push(index);
  });

  return { exact, loose, used: new Set() };
};

const findMatch = (sourceName, holdings, index) => {
  const names = sourceName === "대한민국 원" ? ["원화현금", sourceName] : [sourceName];
  const keys = names.flatMap((name) => [
    ["exact", normalizeName(name)],
    ["loose", looseName(name)],
  ]);

  for (const [type, key] of keys) {
    const candidates = index[type].get(key) ?? [];
    const match = candidates.find((candidate) => !index.used.has(candidate));
    if (match !== undefined) {
      index.used.add(match);
      return holdings[match];
    }
  }

  return null;
};

const etfs = readJson(ETF_JSON_PATH);
const payload = readJson(HOLDINGS_JSON_PATH);
const overseasCodes = new Set(etfs.filter((etf) => etf["기초시장분류"] === "해외").map((etf) => etf["단축코드"]));

const stats = {
  overseasEtfs: 0,
  fetchedEtfs: 0,
  updatedRows: 0,
  unmatchedRows: 0,
  zeroRatioRows: 0,
  failedEtfs: [],
};

for (const [position, etf] of payload.etfs.entries()) {
  if (!overseasCodes.has(etf.etfCode)) continue;

  stats.overseasEtfs += 1;
  delete etf.weightSource;

  try {
    const source = await fetchWeights(etf.etfCode);
    if (source.holdings.length === 0) {
      stats.unmatchedRows += 1;
      console.log(`[${position + 1}/${payload.etfs.length}] ${etf.etfCode} ${etf.etfName}: no K-ETF holdings`);
      continue;
    }

    const index = buildHoldingIndex(etf.holdings);
    let updated = 0;
    let unmatched = 0;
    let zeroRatio = 0;

    for (const sourceHolding of source.holdings) {
      const ratio = Number(sourceHolding.ratio);
      if (!Number.isFinite(ratio) || ratio <= 0) {
        zeroRatio += 1;
        continue;
      }

      const target = findMatch(sourceHolding.name, etf.holdings, index);
      if (!target) {
        unmatched += 1;
        continue;
      }

      target.weight = Number(ratio.toFixed(6));
      updated += 1;
    }

    if (updated > 0) {
      etf.weightSource = {
        name: "k-etf",
        date: source.date,
        scope: "top20holds",
      };
    }

    stats.fetchedEtfs += 1;
    stats.updatedRows += updated;
    stats.unmatchedRows += unmatched;
    stats.zeroRatioRows += zeroRatio;
    console.log(
      `[${position + 1}/${payload.etfs.length}] ${etf.etfCode} ${etf.etfName}: updated ${updated}, unmatched ${unmatched}, zero ratio ${zeroRatio}`,
    );
  } catch (error) {
    stats.failedEtfs.push({
      etfCode: etf.etfCode,
      etfName: etf.etfName,
      error: error.message,
    });
    console.log(`[${position + 1}/${payload.etfs.length}] ${etf.etfCode} ${etf.etfName}: failed ${error.message}`);
  }

  await sleep(sleepMs);
}

payload.overseasWeightEnrichment = {
  source: "https://www.k-etf.com/api/v0/holds/top20holds/indates",
  updatedAt: new Date().toISOString(),
  ...stats,
};

writeJson(HOLDINGS_JSON_PATH, payload);
writeJson(PROGRESS_JSON_PATH, payload);
writeJson(PUBLIC_JSON_PATH, payload);

console.log(JSON.stringify(stats, null, 2));

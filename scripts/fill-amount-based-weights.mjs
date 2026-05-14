import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const ETF_JSON_PATH = path.join(ROOT_DIR, "src", "data", "etfs.json");
const HOLDINGS_JSON_PATH = path.join(ROOT_DIR, "src", "data", "etf_holdings.json");
const PROGRESS_JSON_PATH = path.join(ROOT_DIR, "src", "data", "etf_holdings.progress.json");
const PUBLIC_JSON_PATH = path.join(ROOT_DIR, "public", "data", "etf_holdings.json");
const DRY_RUN = process.argv.includes("--dry-run");
const MIN_CALIBRATION_ROWS = 3;
const MAX_TOTAL_WEIGHT = 105;

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const writeJson = (filePath, payload) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
};

const median = (values) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const toNumber = (value) => Number(value) || 0;

const inferDenominator = (holdings, market) => {
  const amountRows = holdings.filter((holding) => toNumber(holding.amount) > 0);
  const weightedAmountRows = amountRows.filter((holding) => toNumber(holding.weight) > 0);

  if (weightedAmountRows.length >= MIN_CALIBRATION_ROWS) {
    return {
      denominator: median(weightedAmountRows.map((holding) => (toNumber(holding.amount) * 100) / toNumber(holding.weight))),
      source: "amount-weight-calibration",
    };
  }

  if (market === "국내") {
    return {
      denominator: amountRows.reduce((sum, holding) => sum + toNumber(holding.amount), 0),
      source: "domestic-amount-sum",
    };
  }

  return { denominator: null, source: null };
};

const etfs = readJson(ETF_JSON_PATH);
const payload = readJson(HOLDINGS_JSON_PATH);
const metaByCode = new Map(etfs.map((etf) => [etf["단축코드"], etf]));

const stats = {
  dryRun: DRY_RUN,
  updatedEtfs: 0,
  updatedRows: 0,
  updatedBondRows: 0,
  skippedRowsByTotalWeightCap: 0,
  bySource: {},
  byMarket: {},
};

for (const etf of payload.etfs) {
  const meta = metaByCode.get(etf.etfCode) ?? {};
  const market = meta["기초시장분류"] ?? "unknown";
  const currentWeightSum = etf.holdings.reduce((sum, holding) => sum + toNumber(holding.weight), 0);
  const fillableRows = etf.holdings.filter((holding) => toNumber(holding.amount) > 0 && toNumber(holding.weight) === 0);

  if (fillableRows.length === 0) continue;

  const { denominator, source } = inferDenominator(etf.holdings, market);
  if (!denominator || denominator <= 0) continue;

  const candidates = fillableRows
    .map((holding) => ({
      holding,
      weight: Number(((toNumber(holding.amount) / denominator) * 100).toFixed(6)),
    }))
    .filter((candidate) => candidate.weight > 0);

  if (candidates.length === 0) continue;

  const candidateWeightSum = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  if (market !== "국내" && currentWeightSum + candidateWeightSum > MAX_TOTAL_WEIGHT) {
    stats.skippedRowsByTotalWeightCap += candidates.length;
    continue;
  }

  for (const candidate of candidates) {
    if (!DRY_RUN) {
      candidate.holding.weight = candidate.weight;
    }

    stats.updatedRows += 1;
    if (candidate.holding.componentAssetType === "채권") {
      stats.updatedBondRows += 1;
    }
  }

  stats.updatedEtfs += 1;
  stats.bySource[source] = (stats.bySource[source] ?? 0) + candidates.length;
  stats.byMarket[market] = (stats.byMarket[market] ?? 0) + candidates.length;

  if (!DRY_RUN) {
    etf.amountWeightSource = {
      name: source,
      scope: market === "국내" ? "domestic-positive-amount-rows" : "calibrated-positive-amount-rows",
    };
  }
}

payload.amountWeightEnrichment = {
  updatedAt: new Date().toISOString(),
  method:
    "Fill missing positive-amount weights from valuation amount. Domestic ETFs use amount sum when no weighted amount rows exist; other markets require amount/weight calibration.",
  ...stats,
};

if (!DRY_RUN) {
  writeJson(HOLDINGS_JSON_PATH, payload);
  writeJson(PROGRESS_JSON_PATH, payload);
  writeJson(PUBLIC_JSON_PATH, payload);
}

console.log(JSON.stringify(stats, null, 2));

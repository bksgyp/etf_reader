const KRX_ETF_DAILY_URL = "https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toKstDate(date) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

function formatBasDd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function previousMarketDates(limit) {
  const dates = [];
  let cursor = toKstDate(new Date());

  while (dates.length < limit) {
    const day = cursor.getDay();

    if (day !== 0 && day !== 6) {
      dates.push(formatBasDd(cursor));
    }

    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
  }

  return dates;
}

function normalizePriceRow(row) {
  return {
    basDd: row.BAS_DD,
    code: row.ISU_SRT_CD || row.ISU_CD,
    name: row.ISU_NM,
    close: row.TDD_CLSPRC,
    change: row.CMPPREVDD_PRC,
    changeRate: row.FLUC_RT,
    nav: row.NAV,
    open: row.TDD_OPNPRC,
    high: row.TDD_HGPRC,
    low: row.TDD_LWPRC,
    volume: row.ACC_TRDVOL,
    tradingValue: row.ACC_TRDVAL,
    marketCap: row.MKTCAP,
    netAssets: row.INVSTASST_NETASST_TOTAMT,
  };
}

function priceKeys(row) {
  return [row.ISU_SRT_CD, row.ISU_CD].filter(Boolean);
}

async function fetchEtfPrices(apiKey, basDd) {
  const url = new URL(KRX_ETF_DAILY_URL);
  url.searchParams.set("basDd", basDd);

  const response = await fetch(url, {
    headers: {
      AUTH_KEY: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`KRX API request failed: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.OutBlock_1) ? data.OutBlock_1 : [];
}

export default async function handler(request, response) {
  const apiKey = process.env.KRX_API_KEY;

  if (!apiKey) {
    response.status(500).json({ error: "KRX_API_KEY is not configured." });
    return;
  }

  const requestedBasDd = typeof request.query.basDd === "string" ? request.query.basDd : "";
  const dates = /^\d{8}$/.test(requestedBasDd) ? [requestedBasDd] : previousMarketDates(10);

  try {
    for (const basDd of dates) {
      const rows = await fetchEtfPrices(apiKey, basDd);
      const tradableRows = rows.filter((row) => row.TDD_CLSPRC && row.TDD_CLSPRC !== "-");

      if (tradableRows.length > 0) {
        const prices = Object.fromEntries(
          tradableRows.flatMap((row) => priceKeys(row).map((key) => [key, normalizePriceRow(row)])),
        );

        response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        response.status(200).json({
          basDd,
          count: tradableRows.length,
          prices,
        });
        return;
      }
    }

    response.status(404).json({ error: "No ETF price data found.", checkedDates: dates });
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : "KRX API request failed." });
  }
}

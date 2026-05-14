const KIS_PROD_DOMAIN = "https://openapi.koreainvestment.com:9443";
const KIS_VTS_DOMAIN = "https://openapivts.koreainvestment.com:29443";
const MAX_CODES = 20;
const PRICE_REQUEST_DELAY_MS = 350;

function getKisDomain() {
  return process.env.KIS_ENV === "vts" ? KIS_VTS_DOMAIN : KIS_PROD_DOMAIN;
}

function parseCodes(value) {
  if (typeof value !== "string") {
    return [];
  }

  return [...new Set(value.split(",").map((code) => code.trim()).filter((code) => /^\d{6}$/.test(code)))].slice(
    0,
    MAX_CODES,
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getAccessToken(domain, appKey, appSecret) {
  const response = await fetch(`${domain}/oauth2/tokenP`, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: appKey,
      appsecret: appSecret,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.msg1 || data?.error_description || `KIS token request failed: ${response.status}`);
  }

  return data.access_token;
}

function normalizePrice(code, output) {
  return {
    basDd: "",
    code,
    name: output.bstp_kor_isnm || "",
    close: output.stck_prpr || "",
    change: output.prdy_vrss || "",
    changeRate: output.prdy_ctrt || "",
    nav: "",
    open: output.stck_oprc || "",
    high: output.stck_hgpr || "",
    low: output.stck_lwpr || "",
    volume: output.acml_vol || "",
    tradingValue: output.acml_tr_pbmn || "",
    marketCap: output.hts_avls || "",
    netAssets: "",
  };
}

async function fetchPrice(domain, token, appKey, appSecret, code) {
  const url = new URL(`${domain}/uapi/domestic-stock/v1/quotations/inquire-price`);
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
  url.searchParams.set("FID_INPUT_ISCD", code);

  const response = await fetch(url, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      authorization: `Bearer ${token}`,
      appkey: appKey,
      appsecret: appSecret,
      tr_id: "FHKST01010100",
      custtype: "P",
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.rt_cd !== "0") {
    throw new Error(data?.msg1 || `KIS price request failed for ${code}: ${response.status}`);
  }

  return normalizePrice(code, data.output || {});
}

export default async function handler(request, response) {
  const appKey = process.env.KIS_APP_KEY?.trim();
  const appSecret = process.env.KIS_APP_SECRET?.trim();
  const codes = parseCodes(request.query.codes);

  if (!appKey || !appSecret) {
    response.status(500).json({ error: "KIS_APP_KEY and KIS_APP_SECRET are not configured." });
    return;
  }

  if (codes.length === 0) {
    response.status(400).json({ error: "codes query parameter is required." });
    return;
  }

  try {
    const domain = getKisDomain();
    const token = await getAccessToken(domain, appKey, appSecret);
    const rows = [];
    const failures = [];

    for (const code of codes) {
      try {
        rows.push(await fetchPrice(domain, token, appKey, appSecret, code));
      } catch (error) {
        failures.push({
          code,
          error: error instanceof Error ? error.message : "KIS price request failed.",
        });
      }

      if (code !== codes.at(-1)) {
        await wait(PRICE_REQUEST_DELAY_MS);
      }
    }

    const prices = Object.fromEntries(rows.map((row) => [row.code, row]));

    response.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=45");
    response.status(200).json({
      basDd: "",
      count: rows.length,
      failures,
      prices,
    });
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : "KIS API request failed." });
  }
}

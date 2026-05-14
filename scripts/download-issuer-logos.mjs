import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

const outputDir = new URL("../src/assets/issuer-logos/", import.meta.url);
const manifestFile = new URL("../src/assets/issuer-logos/manifest.json", import.meta.url);
const issuers = [
  { name: "교보악사자산운용", slug: "kyobo-axa", homepage: "https://www.kyoboaxa-im.co.kr/" },
  { name: "대신자산운용", slug: "daishin", homepage: "https://asset.daishin.com/" },
  { name: "더제이자산운용", slug: "thej", homepage: "https://www.thejasset.com/" },
  { name: "디비자산운용", slug: "db", homepage: "https://www.db-asset.co.kr/" },
  { name: "마이다스에셋", slug: "midas", homepage: "https://www.midasasset.com/" },
  { name: "미래에셋자산운용", slug: "miraeasset", homepage: "https://www.tigeretf.com/" },
  { name: "브이아이자산운용", slug: "vi", homepage: "https://www.viamc.kr/" },
  { name: "비엔케이자산운용", slug: "bnk", homepage: "https://www.bnkasset.co.kr/" },
  { name: "삼성액티브자산운용", slug: "samsung-active", homepage: "https://www.samsungactive.co.kr/" },
  { name: "삼성자산운용", slug: "samsung", homepage: "https://www.kodex.com/" },
  { name: "신한자산운용", slug: "shinhan", homepage: "https://www.soletf.com/" },
  { name: "아이비케이자산운용", slug: "ibk", homepage: "https://www.ibkasset.com/" },
  { name: "아이엠에셋자산운용", slug: "im", homepage: "https://www.im-fund.com/" },
  { name: "에셋플러스자산운용", slug: "assetplus", homepage: "https://www.assetplus.co.kr/" },
  { name: "엔에이치아문디자산운용", slug: "nh-amundi", homepage: "https://www.hanaroetf.com/" },
  { name: "우리자산운용", slug: "woori", homepage: "https://www.wooriam.kr/" },
  { name: "유리에셋", slug: "yurie", homepage: "https://www.yurieasset.co.kr/" },
  { name: "케이비자산운용", slug: "kb", homepage: "https://www.k-etf.com/" },
  { name: "케이씨지아이자산운용", slug: "kcgi", homepage: "https://kcgiam.com/" },
  { name: "키움투자자산운용", slug: "kiwoom", homepage: "https://www.kiwoometf.com/" },
  { name: "타임폴리오자산운용", slug: "timefolio", homepage: "https://www.timefolio.co.kr/" },
  { name: "트러스톤자산운용", slug: "truston", homepage: "https://www.trustonasset.com/" },
  { name: "하나자산운용", slug: "hana", homepage: "https://www.1qetf.com/" },
  { name: "한국투자밸류자산운용", slug: "korea-value", homepage: "https://vam.koreainvestment.com/" },
  { name: "한국투자신탁운용", slug: "korea-investment", homepage: "https://www.aceetf.co.kr/" },
  { name: "한화자산운용", slug: "hanwha", homepage: "https://www.plusetf.co.kr/" },
  { name: "현대자산운용", slug: "hyundai", homepage: "https://www.hyundaiam.com/" },
  { name: "흥국자산운용", slug: "heungkuk", homepage: "https://www.hkfund.co.kr/" },
];

function resolveUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return "";
  }
}

function extensionFromResponse(url, contentType) {
  const urlExt = extname(new URL(url).pathname).toLowerCase();

  if ([".svg", ".png", ".jpg", ".jpeg", ".webp", ".ico"].includes(urlExt)) {
    return urlExt;
  }

  if (contentType.includes("svg")) {
    return ".svg";
  }

  if (contentType.includes("png")) {
    return ".png";
  }

  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    return ".jpg";
  }

  if (contentType.includes("webp")) {
    return ".webp";
  }

  if (contentType.includes("icon")) {
    return ".ico";
  }

  return urlExt || ".img";
}

const manualCandidates = {
  "nh-amundi": ["https://www.hanaroetf.com/assets/etf/global/images/txt/h1_hanaroETF01.png"],
};

function scoreCandidate(url, context = "") {
  const text = `${decodeURIComponent(url)} ${context}`.toLowerCase();
  let score = 0;

  if (text.includes("logo")) score += 80;
  if (text.includes("로고")) score += 80;
  if (text.includes("ci")) score += 35;
  if (text.includes("brand")) score += 25;
  if (text.includes("symbol")) score += 20;
  if (text.includes("h1_")) score += 20;
  if (text.includes("header")) score += 15;
  if (text.includes("footer")) score += 8;
  if (text.endsWith(".svg")) score += 12;
  if (text.endsWith(".png")) score += 8;
  if (text.includes("favicon")) score -= 30;
  if (text.includes("apple-touch-icon")) score -= 25;
  if (text.includes("loading")) score -= 100;
  if (text.includes("live-text")) score -= 100;
  if (text.includes("fund-type")) score -= 100;

  return score;
}

function extractAssetCandidates(source, baseUrl) {
  const candidates = [];
  const add = (value, context = "") => {
    const resolved = resolveUrl(value.replaceAll("&amp;", "&"), baseUrl);

    if (resolved) {
      candidates.push({
        url: resolved,
        score: scoreCandidate(resolved, context),
      });
    }
  };

  for (const match of source.matchAll(/<img\b([^>]*)>/gi)) {
    const attributes = match[1];
    const src = attributes.match(/\b(?:src|data-src)=["']([^"']+)["']/i)?.[1];

    if (src) {
      add(src, attributes);
    }
  }

  for (const match of source.matchAll(/<source\b([^>]*)srcset=["']([^"']+)["'][^>]*>/gi)) {
    add(match[2].split(",")[0].trim().split(/\s+/)[0], match[1]);
  }

  for (const match of source.matchAll(/<meta\b([^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*)content=["']([^"']+)["'][^>]*>/gi)) {
    add(match[2], match[1]);
  }

  for (const match of source.matchAll(/<link\b([^>]*rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]*)href=["']([^"']+)["'][^>]*>/gi)) {
    add(match[2], match[1]);
  }

  for (const match of source.matchAll(/["'(]([^"'()]*?(?:logo|로고|ci|brand|symbol|h1_)[^"'()]*?\.(?:svg|png|jpe?g|webp|ico)(?:[?#][^"'()]*)?)["')]/gi)) {
    add(match[1]);
  }

  return candidates.filter(({ url }) => /\.(svg|png|jpe?g|webp|ico)(?:[?#].*)?$/i.test(url));
}

async function extractCandidates(html, baseUrl) {
  const linkedAssets = [];

  for (const match of html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    linkedAssets.push(resolveUrl(match[1], baseUrl));
  }

  for (const match of html.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const href = resolveUrl(match[1], baseUrl);

    if (/\.(?:css|js)(?:[?#].*)?$/i.test(href)) {
      linkedAssets.push(href);
    }
  }

  const candidates = extractAssetCandidates(html, baseUrl);

  for (const assetUrl of [...new Set(linkedAssets)]) {
    try {
      const response = await fetch(assetUrl);

      if (response.ok) {
        candidates.push(...extractAssetCandidates(await response.text(), assetUrl));
      }
    } catch {
      // Ignore linked assets that block direct fetches.
    }
  }

  const bestByUrl = new Map();

  for (const candidate of candidates) {
    const current = bestByUrl.get(candidate.url);

    if (!current || candidate.score > current.score) {
      bestByUrl.set(candidate.url, candidate);
    }
  }

  return [...bestByUrl.values()]
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((candidate) => candidate.url);
}

async function downloadIssuerLogo(issuer) {
  const homepageResponse = await fetch(issuer.homepage, {
    headers: {
      "user-agent": "Mozilla/5.0 etf-reader-logo-downloader",
    },
  });

  if (!homepageResponse.ok) {
    throw new Error(`homepage ${homepageResponse.status}`);
  }

  const html = await homepageResponse.text();
  const candidates = [...(manualCandidates[issuer.slug] ?? []), ...(await extractCandidates(html, homepageResponse.url))];

  for (const candidate of candidates) {
    const response = await fetch(candidate, {
      headers: {
        "user-agent": "Mozilla/5.0 etf-reader-logo-downloader",
        referer: homepageResponse.url,
      },
    });

    if (!response.ok) {
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const body = Buffer.from(await response.arrayBuffer());
    const ext = extensionFromResponse(candidate, contentType);
    const filename = `${issuer.slug}${ext}`;
    const path = join(outputDir.pathname, filename);

    await writeFile(path, body);

    return {
      ...issuer,
      file: filename,
      source: candidate,
      contentType,
      bytes: body.length,
    };
  }

  throw new Error(`no logo candidate from ${basename(new URL(issuer.homepage).hostname)}`);
}

await mkdir(outputDir, { recursive: true });

const issuerSlugs = new Set(issuers.map((issuer) => issuer.slug));

for (const file of await readdir(outputDir)) {
  const slug = file.replace(/\.(?:svg|png|jpe?g|webp|ico|img|json)$/i, "");

  if (issuerSlugs.has(slug)) {
    await unlink(new URL(file, outputDir));
  }
}

const results = [];

for (const issuer of issuers) {
  try {
    const result = await downloadIssuerLogo(issuer);
    results.push({ status: "downloaded", ...result });
    console.log(`downloaded ${issuer.name}: ${result.file}`);
  } catch (error) {
    results.push({
      status: "failed",
      name: issuer.name,
      slug: issuer.slug,
      homepage: issuer.homepage,
      error: error instanceof Error ? error.message : "unknown error",
    });
    console.log(`failed ${issuer.name}: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

await writeFile(manifestFile, `${JSON.stringify(results, null, 2)}\n`, "utf8");

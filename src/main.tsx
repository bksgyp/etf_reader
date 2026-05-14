import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { RefreshCw, Search } from "lucide-react";
import etfs from "./data/etfs.json";
import type { Etf, EtfPrice, EtfPriceResponse } from "./types";
import "./styles.css";

const typedEtfs = etfs as Etf[];
const searchFields: Array<keyof Etf> = [
  "단축코드",
  "한글종목명",
  "한글종목약명",
  "영문종목명",
  "기초지수명",
  "운용사",
];
const pageSize = 20;
const nameCollator = new Intl.Collator("ko-KR", { numeric: true, sensitivity: "base" });

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function matchesQuery(etf: Etf, query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return true;
  }

  return searchFields.some((field) => normalize(etf[field]).includes(normalizedQuery));
}

function formatFee(fee: string) {
  const value = Number(fee);
  return Number.isFinite(value) ? `${value.toFixed(3)}%` : fee;
}

function formatNumber(value: string) {
  const number = Number(value.replaceAll(",", ""));
  return Number.isFinite(number) ? number.toLocaleString("ko-KR") : value;
}

function formatBasDd(value: string) {
  if (!/^\d{8}$/.test(value)) {
    return value;
  }

  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

function changeClassName(value: string) {
  const number = Number(value.replaceAll(",", ""));

  if (number > 0) {
    return "positive";
  }

  if (number < 0) {
    return "negative";
  }

  return "";
}

function findPrice(etf: Etf, prices: Record<string, EtfPrice>) {
  return prices[etf.단축코드] ?? prices[etf.표준코드];
}

function sortByKoreanName(left: Etf, right: Etf) {
  return nameCollator.compare(left.한글종목약명, right.한글종목약명);
}

function App() {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [priceData, setPriceData] = useState<EtfPriceResponse | null>(null);
  const [priceError, setPriceError] = useState("");
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const results = useMemo(() => typedEtfs.filter((etf) => matchesQuery(etf, query)).sort(sortByKoreanName), [query]);
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const visibleResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return results.slice(startIndex, startIndex + pageSize);
  }, [currentPage, results]);
  const visibleCodes = useMemo(() => visibleResults.map((etf) => etf.단축코드).join(","), [visibleResults]);
  const firstResultNumber = results.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResultNumber = Math.min(currentPage * pageSize, results.length);

  async function loadPrices(codes: string) {
    if (!codes) {
      setPriceData(null);
      return;
    }

    setIsLoadingPrices(true);
    setPriceError("");

    try {
      const response = await fetch(`/api/etf-prices?codes=${encodeURIComponent(codes)}`);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "ETF 가격 정보를 불러오지 못했습니다.");
      }

      setPriceData((await response.json()) as EtfPriceResponse);
    } catch (error) {
      setPriceError(error instanceof Error ? error.message : "ETF 가격 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoadingPrices(false);
    }
  }

  useEffect(() => {
    void loadPrices(visibleCodes);
  }, [visibleCodes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main className="app">
      <section className="toolbar" aria-label="ETF 검색">
        <div>
          <h1>대한민국 ETF 검색</h1>
          <p>
            {typedEtfs.length.toLocaleString("ko-KR")}개 ETF를 코드, 이름, 지수, 운용사로 검색합니다.
            {priceData?.basDd ? ` 시세 기준일은 ${formatBasDd(priceData.basDd)}입니다.` : ""}
          </p>
        </div>
        <label className="searchBox">
          <Search aria-hidden="true" size={20} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: S&P500, 삼성, 379780, RISE"
            aria-label="ETF 검색어"
          />
        </label>
      </section>

      <section className="resultBar" aria-live="polite">
        <div className="resultHeader">
          <strong>{results.length.toLocaleString("ko-KR")}</strong>
          <span>
            개 검색 결과
            {results.length > 0
              ? ` (${firstResultNumber.toLocaleString("ko-KR")}-${lastResultNumber.toLocaleString("ko-KR")}번째 표시)`
              : ""}
          </span>
        </div>
        <button
          className="refreshButton"
          type="button"
          onClick={() => loadPrices(visibleCodes)}
          disabled={isLoadingPrices}
        >
          <RefreshCw aria-hidden="true" size={16} className={isLoadingPrices ? "spinning" : ""} />
          시세 갱신
        </button>
      </section>

      <nav className="pagination" aria-label="검색 결과 페이지">
        <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
          이전
        </button>
        <span>
          {currentPage.toLocaleString("ko-KR")} / {totalPages.toLocaleString("ko-KR")}
        </span>
        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          disabled={currentPage === totalPages}
        >
          다음
        </button>
      </nav>

      {priceError ? <p className="notice">{priceError}</p> : null}

      <section className="tableWrap" aria-label="ETF 검색 결과">
        <table>
          <thead>
            <tr>
              <th>종목</th>
              <th>코드</th>
              <th>운용사</th>
              <th>종가</th>
              <th>등락률</th>
              <th>NAV</th>
              <th>거래량</th>
              <th>시장</th>
              <th>자산</th>
              <th>총보수</th>
              <th>과세유형</th>
            </tr>
          </thead>
          <tbody>
            {visibleResults.map((etf) => {
              const price = priceData ? findPrice(etf, priceData.prices) : undefined;
              const changeTone = price ? changeClassName(price.change) : "";

              return (
                <tr key={etf.표준코드}>
                  <td>
                    <span className="name">{etf.한글종목약명}</span>
                    <span className="fullName">{etf.기초지수명}</span>
                  </td>
                  <td className="code">{etf.단축코드}</td>
                  <td>{etf.운용사}</td>
                  <td className="numeric">{price ? formatNumber(price.close) : "-"}</td>
                  <td className={`numeric ${changeTone}`}>
                    {price ? `${formatNumber(price.change)} / ${price.changeRate}%` : "-"}
                  </td>
                  <td className="numeric">{price?.nav ? formatNumber(price.nav) : "-"}</td>
                  <td className="numeric">{price ? formatNumber(price.volume) : "-"}</td>
                  <td>{etf.기초시장분류}</td>
                  <td>{etf.기초자산분류}</td>
                  <td>{formatFee(etf.총보수)}</td>
                  <td>{etf.과세유형}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {results.length === 0 ? <p className="empty">검색 결과가 없습니다.</p> : null}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

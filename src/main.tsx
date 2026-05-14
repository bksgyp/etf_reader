import { StrictMode, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { createRoot } from "react-dom/client";
import { Search, X } from "lucide-react";
import etfs from "./data/etfs.json";
import type { Etf, EtfPrice, EtfPriceResponse } from "./types";
import "./styles.css";

const typedEtfs = etfs as Etf[];
const searchCategories = {
  market: { label: "시장", fields: ["기초시장분류"] },
  issuer: { label: "운용사", fields: ["운용사"] },
  name: { label: "종목명", fields: ["단축코드", "한글종목명", "한글종목약명", "영문종목명"] },
} satisfies Record<string, { label: string; fields: Array<keyof Etf> }>;
type SearchCategory = keyof typeof searchCategories;
const pageSize = 20;
const nameCollator = new Intl.Collator("ko-KR", { numeric: true, sensitivity: "base" });

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function matchesQuery(etf: Etf, query: string, category: SearchCategory) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return true;
  }

  return searchCategories[category].fields.some((field) => normalize(etf[field]).includes(normalizedQuery));
}

function formatFee(fee: string) {
  const value = Number(fee);
  return Number.isFinite(value) ? `${value.toFixed(3)}%` : fee;
}

function formatNumber(value: string) {
  const number = Number(value.replaceAll(",", ""));
  return Number.isFinite(number) ? number.toLocaleString("ko-KR") : value;
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

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [1, "start-ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "start-ellipsis", currentPage - 1, currentPage, currentPage + 1, "end-ellipsis", totalPages] as const;
}

function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, etf: Etf, openPriceModal: (etf: Etf) => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openPriceModal(etf);
  }
}

function App() {
  const [query, setQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<SearchCategory>("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [prices, setPrices] = useState<Record<string, EtfPrice>>({});
  const [priceError, setPriceError] = useState("");
  const [loadingCode, setLoadingCode] = useState("");
  const [selectedEtf, setSelectedEtf] = useState<Etf | null>(null);
  const selectedPrice = selectedEtf ? findPrice(selectedEtf, prices) : undefined;
  const selectedChangeTone = selectedPrice ? changeClassName(selectedPrice.change) : "";
  const isSelectedLoading = selectedEtf ? loadingCode === selectedEtf.단축코드 : false;
  const searchPlaceholder =
    searchCategory === "market" ? "예: 국내, 해외" : searchCategory === "issuer" ? "예: 삼성, 미래에셋" : "예: S&P500, 379780, RISE";
  const results = useMemo(
    () => typedEtfs.filter((etf) => matchesQuery(etf, query, searchCategory)).sort(sortByKoreanName),
    [query, searchCategory],
  );
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const visibleResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return results.slice(startIndex, startIndex + pageSize);
  }, [currentPage, results]);
  const firstResultNumber = results.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResultNumber = Math.min(currentPage * pageSize, results.length);
  const paginationItems = getPaginationItems(currentPage, totalPages);

  async function loadPrice(etf: Etf) {
    if (prices[etf.단축코드] || prices[etf.표준코드]) {
      return;
    }

    setLoadingCode(etf.단축코드);
    setPriceError("");

    try {
      const response = await fetch(`/api/etf-prices?codes=${encodeURIComponent(etf.단축코드)}`);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "ETF 가격 정보를 불러오지 못했습니다.");
      }

      const data = (await response.json()) as EtfPriceResponse;
      setPrices((currentPrices) => ({ ...currentPrices, ...data.prices }));

      if (data.failures?.length) {
        setPriceError(`${etf.한글종목약명} 시세를 불러오지 못했습니다.`);
      }
    } catch (error) {
      setPriceError(error instanceof Error ? error.message : "ETF 가격 정보를 불러오지 못했습니다.");
    } finally {
      setLoadingCode("");
    }
  }

  function openPriceModal(etf: Etf) {
    setPriceError("");
    setSelectedEtf(etf);
    void loadPrice(etf);
  }

  function closePriceModal() {
    setSelectedEtf(null);
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [query, searchCategory]);

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
          <p>{typedEtfs.length.toLocaleString("ko-KR")}개 ETF를 시장, 운용사, 종목명으로 검색합니다.</p>
        </div>
        <div className="searchControls">
          <label className="categorySelect" aria-label="검색 기준">
            <select
              value={searchCategory}
              onChange={(event) => setSearchCategory(event.target.value as SearchCategory)}
            >
              {Object.entries(searchCategories).map(([key, category]) => (
                <option key={key} value={key}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="searchBox">
            <Search aria-hidden="true" size={20} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={`${searchCategories[searchCategory].label} 검색어`}
            />
          </label>
        </div>
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
      </section>

      <section className="tableWrap" aria-label="ETF 검색 결과">
        <table>
          <thead>
            <tr>
              <th>종목</th>
              <th>코드</th>
              <th>운용사</th>
              <th>시장</th>
              <th>자산</th>
              <th>총보수</th>
              <th>과세유형</th>
            </tr>
          </thead>
          <tbody>
            {visibleResults.map((etf) => {
              return (
                <tr
                  key={etf.표준코드}
                  className="clickableRow"
                  tabIndex={0}
                  role="button"
                  onClick={() => openPriceModal(etf)}
                  onKeyDown={(event) => handleRowKeyDown(event, etf, openPriceModal)}
                >
                  <td>
                    <span className="nameCell">
                      <span className="name">{etf.한글종목약명}</span>
                      <span className="fullName">{etf.기초지수명}</span>
                    </span>
                  </td>
                  <td className="code">{etf.단축코드}</td>
                  <td>{etf.운용사}</td>
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

      <nav className="pagination" aria-label="검색 결과 페이지">
        <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
          이전
        </button>
        <div className="pageNumbers">
          {paginationItems.map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                className={item === currentPage ? "activePage" : ""}
                type="button"
                onClick={() => setCurrentPage(item)}
                aria-current={item === currentPage ? "page" : undefined}
              >
                {item.toLocaleString("ko-KR")}
              </button>
            ) : (
              <span key={item} aria-hidden="true">
                ...
              </span>
            ),
          )}
        </div>
        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          disabled={currentPage === totalPages}
        >
          다음
        </button>
      </nav>

      {selectedEtf ? (
        <div className="modalOverlay" role="presentation" onClick={closePriceModal}>
          <section
            className="priceModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="priceModalTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modalHeader">
              <div>
                <h2 id="priceModalTitle">{selectedEtf.한글종목약명}</h2>
                <p>
                  {selectedEtf.단축코드} · {selectedEtf.운용사}
                </p>
              </div>
              <button className="iconButton" type="button" onClick={closePriceModal} aria-label="모달 닫기">
                <X aria-hidden="true" size={20} />
              </button>
            </header>

            {isSelectedLoading ? <p className="modalState">시세를 불러오는 중입니다.</p> : null}
            {!isSelectedLoading && priceError ? <p className="notice">{priceError}</p> : null}

            <dl className="infoGrid">
              <div>
                <dt>종목</dt>
                <dd>{selectedEtf.한글종목약명}</dd>
              </div>
              <div>
                <dt>코드</dt>
                <dd>{selectedEtf.단축코드}</dd>
              </div>
              <div>
                <dt>운용사</dt>
                <dd>{selectedEtf.운용사}</dd>
              </div>
              <div>
                <dt>보수</dt>
                <dd>{formatFee(selectedEtf.총보수)}</dd>
              </div>
            </dl>

            <dl className="priceGrid">
              <div>
                <dt>시세</dt>
                <dd>{selectedPrice ? "조회 완료" : "-"}</dd>
              </div>
              <div>
                <dt>종가</dt>
                <dd>{selectedPrice ? formatNumber(selectedPrice.close) : "-"}</dd>
              </div>
              <div>
                <dt>등락률</dt>
                <dd className={selectedChangeTone}>
                  {selectedPrice ? `${formatNumber(selectedPrice.change)} / ${selectedPrice.changeRate}%` : "-"}
                </dd>
              </div>
              <div>
                <dt>NAV</dt>
                <dd>{selectedPrice?.nav ? formatNumber(selectedPrice.nav) : "-"}</dd>
              </div>
              <div>
                <dt>거래량</dt>
                <dd>{selectedPrice ? formatNumber(selectedPrice.volume) : "-"}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

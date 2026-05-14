import { StrictMode, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Filter, RefreshCw, Search, X } from "lucide-react";
import etfs from "./data/etfs.json";
import type { Etf, EtfHolding, EtfHoldingPayload, EtfPrice } from "./types";
import "./styles.css";
import samsungLogo from "./assets/issuer-logos/samsung.svg";
import samsungActiveLogo from "./assets/issuer-logos/samsung-active.svg";
import shinhanLogo from "./assets/issuer-logos/shinhan.svg";
import kbLogo from "./assets/issuer-logos/kb.svg";
import koreaInvestmentLogo from "./assets/issuer-logos/korea-investment.svg";
import hanwhaLogo from "./assets/issuer-logos/hanwha.svg";
import hanaLogo from "./assets/issuer-logos/hana.svg";
import ibkLogo from "./assets/issuer-logos/ibk.svg";
import thejLogo from "./assets/issuer-logos/thej.svg";
import daishinLogo from "./assets/issuer-logos/daishin.png";
import dbLogo from "./assets/issuer-logos/db.png";
import midasLogo from "./assets/issuer-logos/midas.png";
import bnkLogo from "./assets/issuer-logos/bnk.jpg";
import nhAmundiLogo from "./assets/issuer-logos/nh-amundi.png";
import wooriLogo from "./assets/issuer-logos/woori.png";
import kcgiLogo from "./assets/issuer-logos/kcgi.png";
import timefolioLogo from "./assets/issuer-logos/timefolio.png";
import koreaValueLogo from "./assets/issuer-logos/korea-value.png";
import hyundaiLogo from "./assets/issuer-logos/hyundai.png";

const typedEtfs = etfs as Etf[];
const searchCategories = {
  market: { label: "시장", fields: ["기초시장분류"] },
  issuer: { label: "운용사", fields: ["운용사"] },
  name: {
    label: "종목명",
    fields: ["단축코드", "한글종목명", "한글종목약명", "영문종목명"],
  },
  holding: { label: "구성종목", fields: [] },
} satisfies Record<string, { label: string; fields: Array<keyof Etf> }>;
type SearchCategory = keyof typeof searchCategories;
const tableColumns = [
  { key: "name", label: "종목" },
  { key: "code", label: "코드" },
  { key: "issuer", label: "운용사" },
  { key: "market", label: "시장" },
  { key: "asset", label: "자산" },
  { key: "fee", label: "총보수" },
  { key: "tax", label: "과세유형" },
] as const;
type TableColumnKey = (typeof tableColumns)[number]["key"];
type ColumnFilters = Record<TableColumnKey | "holding", string>;
const filterKeys = [
  ...tableColumns.map((column) => column.key),
  "holding",
] as Array<keyof ColumnFilters>;
const pageSize = 20;
const holdingPageSize = 10;
const nameCollator = new Intl.Collator("ko-KR", {
  numeric: true,
  sensitivity: "base",
});
const emptyColumnFilters = Object.fromEntries(
  filterKeys.map((key) => [key, ""]),
) as ColumnFilters;
const dummyPrice: EtfPrice = {
  basDd: "20260514",
  code: "",
  name: "",
  close: "10000",
  change: "0",
  changeRate: "0.00",
  nav: "10000",
  open: "10000",
  high: "10000",
  low: "10000",
  volume: "0",
  tradingValue: "0",
  marketCap: "0",
  netAssets: "0",
};
const chartColors = [
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#bfdbfe",
];
const issuerLogoMap: Record<string, string> = {
  삼성자산운용: samsungLogo,
  삼성액티브자산운용: samsungActiveLogo,
  신한자산운용: shinhanLogo,
  케이비자산운용: kbLogo,
  한국투자신탁운용: koreaInvestmentLogo,
  한화자산운용: hanwhaLogo,
  하나자산운용: hanaLogo,
  아이비케이자산운용: ibkLogo,
  더제이자산운용: thejLogo,
  대신자산운용: daishinLogo,
  디비자산운용: dbLogo,
  마이다스에셋: midasLogo,
  비엔케이자산운용: bnkLogo,
  엔에이치아문디자산운용: nhAmundiLogo,
  우리자산운용: wooriLogo,
  케이씨지아이자산운용: kcgiLogo,
  타임폴리오자산운용: timefolioLogo,
  한국투자밸류자산운용: koreaValueLogo,
  현대자산운용: hyundaiLogo,
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function getEtfHoldings(
  etf: Etf,
  holdingsByEtfCode: Record<string, EtfHolding[]>,
) {
  return holdingsByEtfCode[etf.단축코드] ?? [];
}

function formatHolding(holding: EtfHolding) {
  return holding.componentName
    ? `${holding.componentName} ${holding.componentCode}`
    : holding.componentCode;
}

function getMatchingHoldings(
  etf: Etf,
  query: string,
  holdingsByEtfCode: Record<string, EtfHolding[]>,
) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  return getEtfHoldings(etf, holdingsByEtfCode).filter((holding) =>
    normalize(formatHolding(holding)).includes(normalizedQuery),
  );
}

function matchesHoldingQuery(
  etf: Etf,
  query: string,
  holdingsByEtfCode: Record<string, EtfHolding[]>,
) {
  return (
    !normalize(query) ||
    getMatchingHoldings(etf, query, holdingsByEtfCode).length > 0
  );
}

function matchesQuery(
  etf: Etf,
  query: string,
  category: SearchCategory,
  holdingsByEtfCode: Record<string, EtfHolding[]>,
) {
  if (category === "holding") {
    return matchesHoldingQuery(etf, query, holdingsByEtfCode);
  }

  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return true;
  }

  return searchCategories[category].fields.some((field) =>
    normalize(etf[field]).includes(normalizedQuery),
  );
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

function formatWeight(value: number | null) {
  return value === null ? "-" : `${value.toFixed(2)}%`;
}

function getHoldingWeight(holding: EtfHolding) {
  return holding.weight ?? 0;
}

function sortHoldingsByWeight(left: EtfHolding, right: EtfHolding) {
  return getHoldingWeight(right) - getHoldingWeight(left);
}

function getPieSegments(holdings: EtfHolding[]) {
  const weightedHoldings = holdings
    .filter((holding) => getHoldingWeight(holding) > 0)
    .slice(0, 5);
  const totalWeight = holdings.reduce(
    (sum, holding) => sum + getHoldingWeight(holding),
    0,
  );
  const scale = totalWeight > 0 ? Math.min(100, totalWeight) / totalWeight : 0;
  const segments = weightedHoldings.map((holding, index) => ({
    label: holding.componentName || holding.componentCode,
    value: getHoldingWeight(holding) * scale,
    displayValue: getHoldingWeight(holding),
    color: chartColors[index % chartColors.length],
  }));
  const visibleWeight = segments.reduce(
    (sum, segment) => sum + segment.value,
    0,
  );

  if (visibleWeight > 0 && visibleWeight < 100) {
    segments.push({
      label: "기타",
      value: Math.max(0, 100 - visibleWeight),
      displayValue: Math.max(
        0,
        totalWeight -
          weightedHoldings.reduce(
            (sum, holding) => sum + getHoldingWeight(holding),
            0,
          ),
      ),
      color: "#dbeafe",
    });
  }

  return segments;
}

function getPieSvgSegments<T extends { color: string; value: number }>(
  segments: T[],
) {
  let offset = 0;

  return segments.map((segment, index) => {
    const item = {
      ...segment,
      offset,
      index,
    };
    offset += segment.value;
    return item;
  });
}

function sortByKoreanName(left: Etf, right: Etf) {
  return nameCollator.compare(left.한글종목약명, right.한글종목약명);
}

function getColumnValue(etf: Etf, key: TableColumnKey) {
  switch (key) {
    case "name":
      return `${etf.한글종목약명} ${etf.한글종목명} ${etf.영문종목명} ${etf.기초지수명}`;
    case "code":
      return `${etf.단축코드} ${etf.표준코드}`;
    case "issuer":
      return etf.운용사;
    case "market":
      return etf.기초시장분류;
    case "asset":
      return etf.기초자산분류;
    case "fee":
      return formatFee(etf.총보수);
    case "tax":
      return etf.과세유형;
  }
}

function matchesColumnFilters(etf: Etf, columnFilters: ColumnFilters) {
  return tableColumns.every((column) => {
    const normalizedFilter = normalize(columnFilters[column.key]);

    if (!normalizedFilter) {
      return true;
    }

    return normalize(getColumnValue(etf, column.key)).includes(
      normalizedFilter,
    );
  });
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ] as const;
}

function handleRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  etf: Etf,
  openPriceModal: (etf: Etf) => void,
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openPriceModal(etf);
  }
}

function SearchToolbar({
  query,
  searchCategory,
  searchPlaceholder,
  onQueryChange,
  onCategoryChange,
}: {
  query: string;
  searchCategory: SearchCategory;
  searchPlaceholder: string;
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: SearchCategory) => void;
}) {
  return (
    <section className="toolbar" aria-label="ETF 검색">
      <div>
        <h1>대한민국 ETF 검색</h1>
        <p>
          {typedEtfs.length.toLocaleString("ko-KR")}개 ETF를 시장, 운용사,
          종목명으로 검색합니다.
        </p>
      </div>
      <div className="searchControls">
        <label className="categorySelect" aria-label="검색 기준">
          <select
            value={searchCategory}
            onChange={(event) =>
              onCategoryChange(event.target.value as SearchCategory)
            }
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
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={`${searchCategories[searchCategory].label} 검색어`}
          />
        </label>
      </div>
    </section>
  );
}

function ResultBar({
  count,
  first,
  last,
  query,
  searchCategory,
  holdingsLoaded,
  hasColumnFilters,
  onClearFilters,
}: {
  count: number;
  first: number;
  last: number;
  query: string;
  searchCategory: SearchCategory;
  holdingsLoaded: boolean;
  hasColumnFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <section className="resultBar" aria-live="polite">
      <div className="resultHeader">
        <strong>{count.toLocaleString("ko-KR")}</strong>
        <span>
          개 검색 결과
          {count > 0
            ? ` (${first.toLocaleString("ko-KR")}-${last.toLocaleString("ko-KR")}번째 표시)`
            : ""}
          {searchCategory === "holding" && query.trim()
            ? ` · 구성종목 "${query.trim()}" 포함 ETF`
            : ""}
          {searchCategory === "holding" && !holdingsLoaded
            ? " · 구성종목 데이터 로딩 중"
            : ""}
        </span>
      </div>
      {hasColumnFilters ? (
        <button
          className="clearFiltersButton"
          type="button"
          onClick={onClearFilters}
        >
          필터 초기화
        </button>
      ) : null}
    </section>
  );
}

function ColumnFilterHeader({
  column,
  columnFilters,
  openFilter,
  onToggleFilter,
  onUpdateFilter,
}: {
  column: (typeof tableColumns)[number];
  columnFilters: ColumnFilters;
  openFilter: TableColumnKey | null;
  onToggleFilter: (key: TableColumnKey) => void;
  onUpdateFilter: (key: TableColumnKey, value: string) => void;
}) {
  return (
    <th>
      <div className="columnHeader">
        <span>{column.label}</span>
        <button
          className={
            columnFilters[column.key]
              ? "filterButton activeFilter"
              : "filterButton"
          }
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFilter(column.key);
          }}
          aria-label={`${column.label} 필터 열기`}
          aria-expanded={openFilter === column.key}
        >
          <Filter aria-hidden="true" size={14} />
        </button>
        {openFilter === column.key ? (
          <div
            className="filterPopover"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="search"
              value={columnFilters[column.key]}
              onChange={(event) =>
                onUpdateFilter(column.key, event.target.value)
              }
              placeholder={`${column.label} 필터`}
              aria-label={`${column.label} 컬럼 필터`}
              autoFocus
            />
          </div>
        ) : null}
      </div>
    </th>
  );
}

function ResultsTable({
  visibleResults,
  columnFilters,
  openFilter,
  onToggleFilter,
  onUpdateFilter,
  onOpenEtf,
}: {
  visibleResults: Etf[];
  columnFilters: ColumnFilters;
  openFilter: TableColumnKey | null;
  onToggleFilter: (key: TableColumnKey) => void;
  onUpdateFilter: (key: TableColumnKey, value: string) => void;
  onOpenEtf: (etf: Etf) => void;
}) {
  return (
    <section className="tableWrap" aria-label="ETF 검색 결과">
      <table>
        <thead>
          <tr>
            {tableColumns.map((column) => (
              <ColumnFilterHeader
                key={column.key}
                column={column}
                columnFilters={columnFilters}
                openFilter={openFilter}
                onToggleFilter={onToggleFilter}
                onUpdateFilter={onUpdateFilter}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleResults.map((etf) => (
            <tr
              key={etf.표준코드}
              className="clickableRow"
              tabIndex={0}
              role="button"
              onClick={() => onOpenEtf(etf)}
              onKeyDown={(event) => handleRowKeyDown(event, etf, onOpenEtf)}
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
          ))}
        </tbody>
      </table>
      {visibleResults.length === 0 ? (
        <p className="empty">검색 결과가 없습니다.</p>
      ) : null}
    </section>
  );
}

function NumberPagination({
  currentPage,
  totalPages,
  paginationItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  paginationItems: ReturnType<typeof getPaginationItems>;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav className="pagination" aria-label="검색 결과 페이지">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        이전
      </button>
      <div className="pageNumbers">
        {paginationItems.map((item) =>
          typeof item === "number" ? (
            <button
              key={item}
              className={item === currentPage ? "activePage" : ""}
              type="button"
              onClick={() => onPageChange(item)}
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
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        다음
      </button>
    </nav>
  );
}

function StatGrid({
  className,
  items,
}: {
  className: string;
  items: Array<{ label: string; value: ReactNode; tone?: string }>;
}) {
  return (
    <dl className={className}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd className={item.tone}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function HoldingsChart({
  count,
  pieSegments,
  pieSvgSegments,
}: {
  count: number;
  pieSegments: ReturnType<typeof getPieSegments>;
  pieSvgSegments: ReturnType<
    typeof getPieSvgSegments<ReturnType<typeof getPieSegments>[number]>
  >;
}) {
  const [activeSegment, setActiveSegment] = useState<
    ReturnType<typeof getPieSegments>[number] | null
  >(null);

  return (
    <div className="holdingsChartWrap">
      <div className="pieChart" aria-label="구성종목 비중 원형 그래프">
        <svg viewBox="0 0 120 120" role="img">
          <defs>
            <mask id="pieRevealMask">
              <rect width="120" height="120" fill="black" />
              <circle
                className="pieReveal"
                cx="60"
                cy="60"
                r="44"
                pathLength="100"
              />
            </mask>
          </defs>
          <circle
            className="pieTrack"
            cx="60"
            cy="60"
            r="44"
            pathLength="100"
          />
          <g mask="url(#pieRevealMask)">
            {pieSvgSegments.map((segment) => (
              <circle
                key={segment.label}
                className="pieSegment"
                style={{ animationDelay: `${segment.index * 90}ms` }}
                tabIndex={0}
                cx="60"
                cy="60"
                r="44"
                pathLength="100"
                stroke={segment.color}
                strokeDasharray={`${segment.value} ${100 - segment.value}`}
                strokeDashoffset={-segment.offset}
                onBlur={() => setActiveSegment(null)}
                onFocus={() => setActiveSegment(segment)}
                onMouseLeave={() => setActiveSegment(null)}
                onMouseMove={() => setActiveSegment(segment)}
              />
            ))}
          </g>
        </svg>
        <span>{count.toLocaleString("ko-KR")}</span>
        {activeSegment ? (
          <div className="pieTooltip" role="tooltip">
            <strong>{activeSegment.label}</strong>
            <span>{formatWeight(activeSegment.displayValue)}</span>
          </div>
        ) : null}
      </div>
      <div className="chartLegend">
        {pieSegments.map((segment) => (
          <div key={segment.label}>
            <span style={{ background: segment.color }} />
            <strong>{segment.label}</strong>
            <em>{formatWeight(segment.displayValue)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function HoldingCard({ holding }: { holding: EtfHolding }) {
  return (
    <article className="holdingCard">
      <div className="holdingCardBody">
        <strong>{holding.componentName || holding.componentCode}</strong>
        <span>
          {holding.componentName ? holding.componentCode : "종목명 없음"}
        </span>
      </div>
      <dl className="holdingCardMetric">
        <div>
          <dt>비중</dt>
          <dd>{formatWeight(holding.weight)}</dd>
        </div>
      </dl>
    </article>
  );
}

function HoldingsSection({
  holdingsLoaded,
  visibleHoldings,
  totalHoldings,
  pagedHoldings,
  holdingPage,
  totalPages,
  pieSegments,
  pieSvgSegments,
  onPageChange,
}: {
  holdingsLoaded: boolean;
  visibleHoldings: EtfHolding[];
  totalHoldings: EtfHolding[];
  pagedHoldings: EtfHolding[];
  holdingPage: number;
  totalPages: number;
  pieSegments: ReturnType<typeof getPieSegments>;
  pieSvgSegments: ReturnType<
    typeof getPieSvgSegments<ReturnType<typeof getPieSegments>[number]>
  >;
  onPageChange: (page: number) => void;
}) {
  return (
    <section className="holdingsPanel" aria-label="ETF 구성종목">
      <div className="holdingsHeader">
        <h3>구성종목</h3>
        <span>
          {visibleHoldings.length.toLocaleString("ko-KR")} /{" "}
          {totalHoldings.length.toLocaleString("ko-KR")}개
        </span>
      </div>
      {holdingsLoaded ? (
        <HoldingsChart
          count={visibleHoldings.length}
          pieSegments={pieSegments}
          pieSvgSegments={pieSvgSegments}
        />
      ) : (
        <p className="modalState">구성종목 데이터를 불러오는 중입니다.</p>
      )}
      <div className="holdingsList">
        {pagedHoldings.map((holding) => (
          <HoldingCard
            key={`${holding.componentCode}-${holding.componentName ?? ""}`}
            holding={holding}
          />
        ))}
        {visibleHoldings.length === 0 ? (
          <p className="empty">구성종목 데이터가 없습니다.</p>
        ) : null}
      </div>
      {visibleHoldings.length > holdingPageSize ? (
        <nav className="holdingPagination" aria-label="구성종목 페이지">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, holdingPage - 1))}
            disabled={holdingPage === 1}
          >
            이전
          </button>
          <span>
            {holdingPage.toLocaleString("ko-KR")} /{" "}
            {totalPages.toLocaleString("ko-KR")}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, holdingPage + 1))}
            disabled={holdingPage === totalPages}
          >
            다음
          </button>
        </nav>
      ) : null}
    </section>
  );
}

function HeroZone({
  etf,
  price,
  changeTone,
}: {
  etf: Etf;
  price?: EtfPrice;
  changeTone: string;
}) {
  const logoSrc = issuerLogoMap[etf.운용사];
  return (
    <div className="heroZone">
      {logoSrc ? (
        <img
          className="heroLogoWatermark"
          src={logoSrc}
          alt=""
          aria-hidden="true"
        />
      ) : null}
      <div className="heroContent">
        <div className="heroLabel">현재가</div>
        <div className="heroPrice">
          {price ? formatNumber(price.close) : "-"}
        </div>
        <div className={`heroChange ${changeTone}`}>
          {price ? `${formatNumber(price.change)} / ${price.changeRate}%` : "-"}
        </div>
      </div>
      <div className="heroRight">
        <div className="heroLabel">NAV</div>
        <div className="heroNav">
          {price?.nav ? formatNumber(price.nav) : "-"}
        </div>
        <div className="heroVol">
          거래량 {price ? formatNumber(price.volume) : "-"}
        </div>
      </div>
    </div>
  );
}

function PriceModal({
  selectedEtf,
  selectedPrice,
  selectedChangeTone,
  isSelectedLoading,
  priceError,
  holdingsLoaded,
  selectedHoldings,
  visibleSelectedHoldings,
  pagedSelectedHoldings,
  holdingPage,
  selectedHoldingPages,
  pieSegments,
  pieSvgSegments,
  isClosing,
  onAnimationEnd,
  onRefreshPrice,
  onClose,
  onHoldingPageChange,
}: {
  selectedEtf: Etf;
  selectedPrice?: EtfPrice;
  selectedChangeTone: string;
  isSelectedLoading: boolean;
  priceError: string;
  holdingsLoaded: boolean;
  selectedHoldings: EtfHolding[];
  visibleSelectedHoldings: EtfHolding[];
  pagedSelectedHoldings: EtfHolding[];
  holdingPage: number;
  selectedHoldingPages: number;
  pieSegments: ReturnType<typeof getPieSegments>;
  pieSvgSegments: ReturnType<
    typeof getPieSvgSegments<ReturnType<typeof getPieSegments>[number]>
  >;
  isClosing: boolean;
  onAnimationEnd: () => void;
  onRefreshPrice: () => void;
  onClose: () => void;
  onHoldingPageChange: (page: number) => void;
}) {
  return (
    <div
      className={`modalOverlay${isClosing ? " modalOverlay--closing" : ""}`}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={`priceModal${isClosing ? " priceModal--closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="priceModalTitle"
        onClick={(event) => event.stopPropagation()}
        onAnimationEnd={onAnimationEnd}
      >
        <header className="modalHeader">
          <div>
            <h2 id="priceModalTitle">{selectedEtf.한글종목약명}</h2>
            <p>
              {selectedEtf.단축코드} · {selectedEtf.운용사}
            </p>
          </div>
          <div className="modalActions">
            <button
              className="actionButton"
              type="button"
              onClick={onRefreshPrice}
              disabled={isSelectedLoading}
            >
              <RefreshCw aria-hidden="true" size={18} />
              {isSelectedLoading ? "갱신 중" : "시세 갱신"}
            </button>
            <button
              className="iconButton"
              type="button"
              onClick={onClose}
              aria-label="모달 닫기"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
        </header>

        <HeroZone
          etf={selectedEtf}
          price={selectedPrice}
          changeTone={selectedChangeTone}
        />

        {isSelectedLoading ? (
          <p className="modalState">시세를 불러오는 중입니다.</p>
        ) : null}
        {!isSelectedLoading && priceError ? (
          <p className="notice">{priceError}</p>
        ) : null}

        <StatGrid
          className="infoGrid"
          items={[
            { label: "운용사", value: selectedEtf.운용사 },
            { label: "총보수", value: formatFee(selectedEtf.총보수) },
            { label: "과세유형", value: selectedEtf.과세유형 },
            { label: "시장분류", value: selectedEtf.기초시장분류 },
          ]}
        />

        <HoldingsSection
          holdingsLoaded={holdingsLoaded}
          visibleHoldings={visibleSelectedHoldings}
          totalHoldings={selectedHoldings}
          pagedHoldings={pagedSelectedHoldings}
          holdingPage={holdingPage}
          totalPages={selectedHoldingPages}
          pieSegments={pieSegments}
          pieSvgSegments={pieSvgSegments}
          onPageChange={onHoldingPageChange}
        />
      </section>
    </div>
  );
}

function App() {
  const [query, setQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<SearchCategory>("name");
  const [columnFilters, setColumnFilters] =
    useState<ColumnFilters>(emptyColumnFilters);
  const [openFilter, setOpenFilter] = useState<TableColumnKey | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [holdingsByEtfCode, setHoldingsByEtfCode] = useState<
    Record<string, EtfHolding[]>
  >({});
  const [holdingsLoaded, setHoldingsLoaded] = useState(false);
  const [holdingPage, setHoldingPage] = useState(1);
  const [prices, setPrices] = useState<Record<string, EtfPrice>>({});
  const [priceError, setPriceError] = useState("");
  const [loadingCode, setLoadingCode] = useState("");
  const [selectedEtf, setSelectedEtf] = useState<Etf | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const selectedPrice = selectedEtf
    ? findPrice(selectedEtf, prices)
    : undefined;
  const selectedHoldings = useMemo(
    () => (selectedEtf ? getEtfHoldings(selectedEtf, holdingsByEtfCode) : []),
    [selectedEtf, holdingsByEtfCode],
  );
  const visibleSelectedHoldings = useMemo(() => {
    const matchingHoldings =
      selectedEtf && searchCategory === "holding"
        ? getMatchingHoldings(selectedEtf, query, holdingsByEtfCode)
        : [];
    return [
      ...(matchingHoldings.length > 0 ? matchingHoldings : selectedHoldings),
    ].sort(sortHoldingsByWeight);
  }, [selectedEtf, searchCategory, query, holdingsByEtfCode, selectedHoldings]);
  const selectedHoldingPages = Math.max(
    1,
    Math.ceil(visibleSelectedHoldings.length / holdingPageSize),
  );
  const pagedSelectedHoldings = useMemo(
    () =>
      visibleSelectedHoldings.slice(
        (holdingPage - 1) * holdingPageSize,
        holdingPage * holdingPageSize,
      ),
    [visibleSelectedHoldings, holdingPage],
  );
  const pieSegments = useMemo(
    () => getPieSegments(visibleSelectedHoldings),
    [visibleSelectedHoldings],
  );
  const pieSvgSegments = useMemo(
    () => getPieSvgSegments(pieSegments),
    [pieSegments],
  );
  const selectedChangeTone = selectedPrice
    ? changeClassName(selectedPrice.change)
    : "";
  const isSelectedLoading = selectedEtf
    ? loadingCode === selectedEtf.단축코드
    : false;
  const searchPlaceholder =
    searchCategory === "market"
      ? "예: 국내, 해외"
      : searchCategory === "issuer"
        ? "예: 삼성, 미래에셋"
        : searchCategory === "holding"
          ? "예: 006400, 삼성SDI"
          : "예: S&P500, 379780, RISE";
  const results = useMemo(
    () =>
      typedEtfs
        .filter((etf) =>
          matchesQuery(etf, query, searchCategory, holdingsByEtfCode),
        )
        .filter((etf) => matchesColumnFilters(etf, columnFilters))
        .sort(sortByKoreanName),
    [columnFilters, holdingsByEtfCode, query, searchCategory],
  );
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const visibleResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return results.slice(startIndex, startIndex + pageSize);
  }, [currentPage, results]);
  const firstResultNumber =
    results.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResultNumber = Math.min(currentPage * pageSize, results.length);
  const paginationItems = getPaginationItems(currentPage, totalPages);
  const hasColumnFilters = Object.values(columnFilters).some((filter) =>
    filter.trim(),
  );

  function loadPrice(etf: Etf, forceRefresh = false) {
    if (!forceRefresh && (prices[etf.단축코드] || prices[etf.표준코드])) {
      return;
    }

    setLoadingCode(etf.단축코드);
    setPriceError("");

    const price = {
      ...dummyPrice,
      code: etf.단축코드,
      name: etf.한글종목약명,
    };

    setPrices((currentPrices) => ({
      ...currentPrices,
      [etf.단축코드]: price,
      [etf.표준코드]: price,
    }));
    setLoadingCode("");
  }

  function openPriceModal(etf: Etf) {
    setPriceError("");
    setSelectedEtf(etf);
    setHoldingPage(1);
    loadPrice(etf);
  }

  function closePriceModal() {
    setIsClosing(true);
  }

  function handleModalAnimationEnd() {
    if (isClosing) {
      setSelectedEtf(null);
      setIsClosing(false);
    }
  }

  function updateColumnFilter(key: keyof ColumnFilters, value: string) {
    setColumnFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  }

  function clearColumnFilters() {
    setColumnFilters(emptyColumnFilters);
    setOpenFilter(null);
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [columnFilters, query, searchCategory]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setHoldingPage(1);
  }, [query, searchCategory, selectedEtf]);

  useEffect(() => {
    if (holdingPage > selectedHoldingPages) {
      setHoldingPage(selectedHoldingPages);
    }
  }, [holdingPage, selectedHoldingPages]);

  useEffect(() => {
    let ignore = false;

    fetch("/data/etf_holdings.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("ETF 구성종목 데이터를 불러오지 못했습니다.");
        }

        return response.json() as Promise<EtfHoldingPayload>;
      })
      .then((data) => {
        if (!ignore) {
          setHoldingsByEtfCode(
            Object.fromEntries(
              data.etfs.map((etf) => [etf.etfCode, etf.holdings]),
            ),
          );
        }
      })
      .catch(() => {
        if (!ignore) {
          setHoldingsByEtfCode({});
        }
      })
      .finally(() => {
        if (!ignore) {
          setHoldingsLoaded(true);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="app" onClick={() => setOpenFilter(null)}>
      <SearchToolbar
        query={query}
        searchCategory={searchCategory}
        searchPlaceholder={searchPlaceholder}
        onQueryChange={setQuery}
        onCategoryChange={setSearchCategory}
      />

      <ResultBar
        count={results.length}
        first={firstResultNumber}
        last={lastResultNumber}
        query={query}
        searchCategory={searchCategory}
        holdingsLoaded={holdingsLoaded}
        hasColumnFilters={hasColumnFilters}
        onClearFilters={clearColumnFilters}
      />

      <ResultsTable
        visibleResults={visibleResults}
        columnFilters={columnFilters}
        openFilter={openFilter}
        onToggleFilter={(key) =>
          setOpenFilter((currentFilter) => (currentFilter === key ? null : key))
        }
        onUpdateFilter={updateColumnFilter}
        onOpenEtf={openPriceModal}
      />

      <NumberPagination
        currentPage={currentPage}
        totalPages={totalPages}
        paginationItems={paginationItems}
        onPageChange={setCurrentPage}
      />

      {selectedEtf ? (
        <PriceModal
          selectedEtf={selectedEtf}
          selectedPrice={selectedPrice}
          selectedChangeTone={selectedChangeTone}
          isSelectedLoading={isSelectedLoading}
          priceError={priceError}
          holdingsLoaded={holdingsLoaded}
          selectedHoldings={selectedHoldings}
          visibleSelectedHoldings={visibleSelectedHoldings}
          pagedSelectedHoldings={pagedSelectedHoldings}
          holdingPage={holdingPage}
          selectedHoldingPages={selectedHoldingPages}
          pieSegments={pieSegments}
          pieSvgSegments={pieSvgSegments}
          isClosing={isClosing}
          onAnimationEnd={handleModalAnimationEnd}
          onRefreshPrice={() => loadPrice(selectedEtf, true)}
          onClose={closePriceModal}
          onHoldingPageChange={setHoldingPage}
        />
      ) : null}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

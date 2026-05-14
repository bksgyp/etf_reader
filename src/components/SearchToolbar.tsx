import { Search } from "lucide-react";
import { typedEtfs, searchCategories } from "../constants";
import type { SearchCategory } from "../constants";

export function SearchToolbar({
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

export function ResultBar({
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

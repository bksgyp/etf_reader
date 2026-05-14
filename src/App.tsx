import { useEffect, useMemo, useState } from "react";
import type { Etf, EtfHolding, EtfHoldingPayload, EtfPrice } from "./types";
import {
  typedEtfs,
  emptyColumnFilters,
  dummyPrice,
  pageSize,
  holdingPageSize,
} from "./constants";
import type {
  SearchCategory,
  ColumnFilters,
  TableColumnKey,
} from "./constants";
import {
  findPrice,
  getEtfHoldings,
  getMatchingHoldings,
  sortHoldingsByWeight,
  changeClassName,
  getPieSegments,
  getPieSvgSegments,
  sortByKoreanName,
  matchesQuery,
  matchesColumnFilters,
  getPaginationItems,
} from "./utils";
import { SearchToolbar, ResultBar } from "./components/SearchToolbar";
import { ResultsTable } from "./components/ResultsTable";
import { NumberPagination } from "./components/NumberPagination";
import { PriceModal } from "./components/PriceModal";

export function App() {
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
  const hasColumnFilters = Object.values(columnFilters).some(
    (filter) => filter.length > 0,
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
    setColumnFilters((currentFilters) => {
      const current = currentFilters[key];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...currentFilters, [key]: updated };
    });
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

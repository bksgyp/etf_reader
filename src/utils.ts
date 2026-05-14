import type { KeyboardEvent } from "react";
import type { Etf, EtfHolding, EtfPrice } from "./types";
import {
  typedEtfs,
  tableColumns,
  searchCategories,
  nameCollator,
  chartColors,
} from "./constants";
import type {
  SearchCategory,
  TableColumnKey,
  ColumnFilters,
} from "./constants";

export function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

export function getEtfHoldings(
  etf: Etf,
  holdingsByEtfCode: Record<string, EtfHolding[]>,
) {
  return holdingsByEtfCode[etf.단축코드] ?? [];
}

export function formatHolding(holding: EtfHolding) {
  return holding.componentName
    ? `${holding.componentName} ${holding.componentCode}`
    : holding.componentCode;
}

export function getMatchingHoldings(
  etf: Etf,
  query: string,
  holdingsByEtfCode: Record<string, EtfHolding[]>,
) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  return getEtfHoldings(etf, holdingsByEtfCode).filter((holding) =>
    normalize(formatHolding(holding)).includes(normalizedQuery),
  );
}

export function matchesHoldingQuery(
  etf: Etf,
  query: string,
  holdingsByEtfCode: Record<string, EtfHolding[]>,
) {
  return (
    !normalize(query) ||
    getMatchingHoldings(etf, query, holdingsByEtfCode).length > 0
  );
}

export function matchesQuery(
  etf: Etf,
  query: string,
  category: SearchCategory,
  holdingsByEtfCode: Record<string, EtfHolding[]>,
) {
  if (category === "holding")
    return matchesHoldingQuery(etf, query, holdingsByEtfCode);
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  return searchCategories[category].fields.some((field) =>
    normalize(etf[field]).includes(normalizedQuery),
  );
}

export function formatFee(fee: string) {
  const value = Number(fee);
  return Number.isFinite(value) ? `${value.toFixed(3)}%` : fee;
}

export function formatNumber(value: string) {
  const number = Number(value.replaceAll(",", ""));
  return Number.isFinite(number) ? number.toLocaleString("ko-KR") : value;
}

export function changeClassName(value: string) {
  const number = Number(value.replaceAll(",", ""));
  if (number > 0) return "positive";
  if (number < 0) return "negative";
  return "";
}

export function findPrice(etf: Etf, prices: Record<string, EtfPrice>) {
  return prices[etf.단축코드] ?? prices[etf.표준코드];
}

export function formatWeight(value: number | null) {
  return value === null ? "-" : `${value.toFixed(2)}%`;
}

export function getHoldingWeight(holding: EtfHolding) {
  return holding.weight ?? 0;
}

export function sortHoldingsByWeight(left: EtfHolding, right: EtfHolding) {
  return getHoldingWeight(right) - getHoldingWeight(left);
}

export function getPieSegments(holdings: EtfHolding[]) {
  const weightedHoldings = holdings
    .filter((holding) => getHoldingWeight(holding) > 0)
    .slice(0, 5);
  const totalWeight = holdings.reduce((sum, h) => sum + getHoldingWeight(h), 0);
  const scale = totalWeight > 0 ? Math.min(100, totalWeight) / totalWeight : 0;
  const segments = weightedHoldings.map((holding, index) => ({
    label: holding.componentName || holding.componentCode,
    value: getHoldingWeight(holding) * scale,
    displayValue: getHoldingWeight(holding),
    color: chartColors[index % chartColors.length],
  }));
  const visibleWeight = segments.reduce((sum, s) => sum + s.value, 0);

  if (visibleWeight > 0 && visibleWeight < 100) {
    segments.push({
      label: "기타",
      value: Math.max(0, 100 - visibleWeight),
      displayValue: Math.max(
        0,
        totalWeight -
          weightedHoldings.reduce((sum, h) => sum + getHoldingWeight(h), 0),
      ),
      color: "#dbeafe",
    });
  }

  return segments;
}

export function getPieSvgSegments<T extends { color: string; value: number }>(
  segments: T[],
) {
  let offset = 0;
  return segments.map((segment, index) => {
    const item = { ...segment, offset, index };
    offset += segment.value;
    return item;
  });
}

export function sortByKoreanName(left: Etf, right: Etf) {
  return nameCollator.compare(left.한글종목약명, right.한글종목약명);
}

export function getColumnValue(etf: Etf, key: TableColumnKey) {
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

export function getColumnDisplayValue(etf: Etf, key: TableColumnKey) {
  switch (key) {
    case "name":
      return etf.한글종목약명;
    case "code":
      return etf.단축코드;
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

export const columnUniqueValues = Object.fromEntries(
  tableColumns.map((col) => [
    col.key,
    [...new Set(typedEtfs.map((etf) => getColumnDisplayValue(etf, col.key)))]
      .filter(Boolean)
      .sort(nameCollator.compare.bind(nameCollator)),
  ]),
) as Record<TableColumnKey, string[]>;

export function matchesColumnFilters(etf: Etf, columnFilters: ColumnFilters) {
  return tableColumns.every((column) => {
    const selected = columnFilters[column.key];
    if (selected.length === 0) return true;
    return selected.includes(getColumnDisplayValue(etf, column.key));
  });
}

export function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
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

export function handleRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  etf: Etf,
  openPriceModal: (etf: Etf) => void,
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openPriceModal(etf);
  }
}

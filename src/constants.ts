import type { Etf, EtfPrice } from "./types";
import etfs from "./data/etfs.json";

export const typedEtfs = etfs as Etf[];

export const searchCategories = {
  market: { label: "시장", fields: ["기초시장분류"] },
  issuer: { label: "운용사", fields: ["운용사"] },
  name: {
    label: "종목명",
    fields: ["단축코드", "한글종목명", "한글종목약명", "영문종목명"],
  },
  holding: { label: "구성종목", fields: [] },
} satisfies Record<string, { label: string; fields: Array<keyof Etf> }>;
export type SearchCategory = keyof typeof searchCategories;

export const tableColumns = [
  { key: "name", label: "종목" },
  { key: "code", label: "코드" },
  { key: "issuer", label: "운용사" },
  { key: "market", label: "시장" },
  { key: "asset", label: "자산" },
  { key: "fee", label: "총보수" },
  { key: "tax", label: "과세유형" },
] as const;
export type TableColumnKey = (typeof tableColumns)[number]["key"];
export type ColumnFilters = Record<TableColumnKey | "holding", string[]>;

export const filterKeys = [
  ...tableColumns.map((column) => column.key),
  "holding",
] as Array<keyof ColumnFilters>;

export const pageSize = 20;
export const holdingPageSize = 10;

export const nameCollator = new Intl.Collator("ko-KR", {
  numeric: true,
  sensitivity: "base",
});

export const emptyColumnFilters = Object.fromEntries(
  filterKeys.map((key) => [key, [] as string[]]),
) as ColumnFilters;

export const dummyPrice: EtfPrice = {
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

export const chartColors = [
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#bfdbfe",
];

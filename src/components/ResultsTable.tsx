import { tableColumns } from "../constants";
import type { ColumnFilters, TableColumnKey } from "../constants";
import type { Etf } from "../types";
import { FilterChip } from "./FilterChip";
import { EtfCard } from "./EtfCard";

export function ResultsTable({
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
              <FilterChip
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
            <EtfCard key={etf.표준코드} etf={etf} onOpen={onOpenEtf} />
          ))}
        </tbody>
      </table>
      {visibleResults.length === 0 ? (
        <p className="empty">검색 결과가 없습니다.</p>
      ) : null}
    </section>
  );
}

import { Filter } from "lucide-react";
import { tableColumns } from "../constants";
import type { ColumnFilters, TableColumnKey } from "../constants";
import { columnUniqueValues, formatFee, handleRowKeyDown } from "../utils";
import type { Etf } from "../types";

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
            columnFilters[column.key].length > 0
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
            {columnUniqueValues[column.key].map((value) => (
              <label key={value} className="filterCheckboxItem">
                <input
                  type="checkbox"
                  checked={columnFilters[column.key].includes(value)}
                  onChange={() => onUpdateFilter(column.key, value)}
                />
                <span>{value}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </th>
  );
}

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

import { Filter } from "lucide-react";
import type { ColumnFilters, TableColumnKey } from "../constants";
import { columnUniqueValues } from "../utils";

export function FilterChip({
  column,
  columnFilters,
  openFilter,
  onToggleFilter,
  onUpdateFilter,
}: {
  column: { key: TableColumnKey; label: string };
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

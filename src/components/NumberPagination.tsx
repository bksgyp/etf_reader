import { getPaginationItems } from "../utils";

export function NumberPagination({
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
      <span className="pageInfo">
        {currentPage} / {totalPages}
      </span>
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

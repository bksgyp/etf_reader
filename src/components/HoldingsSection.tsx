import { useState } from "react";
import { holdingPageSize } from "../constants";
import { formatWeight, getPieSegments, getPieSvgSegments } from "../utils";
import type { EtfHolding } from "../types";

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

export function HoldingsSection({
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

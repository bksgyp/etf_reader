import type { ReactNode } from "react";
import { RefreshCw, X } from "lucide-react";
import { issuerLogoMap } from "../issuerLogos";
import {
  formatFee,
  formatNumber,
  getPieSegments,
  getPieSvgSegments,
} from "../utils";
import type { Etf, EtfHolding, EtfPrice } from "../types";
import { HoldingsSection } from "./HoldingsSection";

export function StatGrid({
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

export function PriceModal({
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
              <span className="actionLabel">
                {isSelectedLoading ? "갱신 중" : "시세 갱신"}
              </span>
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

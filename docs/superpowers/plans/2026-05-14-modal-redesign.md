# Modal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PriceModal을 히어로 가격존 + 운용사 로고 워터마크 + 파란색 차트 + 슬라이드업 애니메이션으로 재설계한다.

**Architecture:** `src/main.tsx` 내 `PriceModal`에 `HeroZone` 컴포넌트를 추가하고, `isClosing` 상태로 퇴장 애니메이션을 제어한다. `src/styles.css`에서 모달 CSS 전체를 갱신하며 `chartColors` 상수를 파란색으로 교체한다.

**Tech Stack:** React 19, TypeScript, CSS (no external animation lib), Vite

---

## File Map

| 파일             | 변경 내용                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`   | `issuerLogoMap` 상수, `HeroZone` 컴포넌트, `PriceModal` 구조 변경, `isClosing` 상태, `chartColors` 수정 |
| `src/styles.css` | 모달 애니메이션 keyframe 추가, `.heroZone` 신규, `.infoGrid` 재설계, 차트 파란색 테마                   |

---

## Task 1: CSS 모달 진입/퇴장 애니메이션

**Files:**

- Modify: `src/styles.css`

- [ ] **Step 1: `.modalOverlay` 에 진입 애니메이션 추가**

`src/styles.css` 에서 `.modalOverlay` 블록을 아래로 교체한다.

```css
.modalOverlay {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.48);
  animation: overlayFadeIn 200ms ease forwards;
}

.modalOverlay--closing {
  animation: overlayFadeOut 180ms ease forwards;
}
```

- [ ] **Step 2: `.priceModal` 에 진입 애니메이션 추가**

`src/styles.css` 에서 `.priceModal` 블록을 아래로 교체한다.

```css
.priceModal {
  width: min(900px, calc(100vw - 36px));
  height: min(1400px, calc(100vh - 36px));
  overflow-y: auto;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.26);
  animation: modalSlideUp 260ms cubic-bezier(0.2, 0, 0, 1) forwards;
}

.priceModal--closing {
  animation: modalSlideDown 200ms ease-in forwards;
}
```

- [ ] **Step 3: 파일 맨 아래 `@keyframes` 추가**

`src/styles.css` 마지막 `@media` 블록 바로 앞에 추가한다.

```css
@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes overlayFadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalSlideDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(24px);
  }
}
```

- [ ] **Step 4: TypeScript 컴파일 확인**

```bash
cd /home/yup/etf_reader && npx tsc --noEmit
```

Expected: 출력 없음 (오류 없음)

- [ ] **Step 5: Commit**

```bash
git add src/styles.css
git commit -m "feat: add modal open/close slide-up animation"
```

---

## Task 2: TSX `isClosing` 퇴장 애니메이션 흐름

**Files:**

- Modify: `src/main.tsx`

현재 `closePriceModal()` 은 즉시 `setSelectedEtf(null)` 을 호출한다. 퇴장 애니메이션을 재생하려면 `isClosing` 상태가 필요하다.

- [ ] **Step 1: `App` 에 `isClosing` 상태 추가**

`src/main.tsx` 의 `App()` 함수 내 state 선언부에서 `selectedEtf` 바로 아래에 추가한다.

```tsx
const [isClosing, setIsClosing] = useState(false);
```

- [ ] **Step 2: `closePriceModal` 수정**

기존 코드를 아래로 교체한다.

```tsx
function closePriceModal() {
  setIsClosing(true);
}

function handleModalAnimationEnd() {
  if (isClosing) {
    setSelectedEtf(null);
    setIsClosing(false);
  }
}
```

- [ ] **Step 3: `PriceModal` 컴포넌트 props에 `isClosing`, `onAnimationEnd` 추가**

`PriceModal` 함수 시그니처의 props 구조분해와 타입을 확장한다.

기존 마지막 두 props 부분:

```tsx
  onRefreshPrice: () => void;
  onClose: () => void;
  onHoldingPageChange: (page: number) => void;
```

아래로 교체:

```tsx
  isClosing: boolean;
  onAnimationEnd: () => void;
  onRefreshPrice: () => void;
  onClose: () => void;
  onHoldingPageChange: (page: number) => void;
```

구조분해 목록에도 `isClosing`, `onAnimationEnd` 추가:

```tsx
function PriceModal({
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
}: { ... })
```

- [ ] **Step 4: `PriceModal` JSX에 closing 클래스 + `onAnimationEnd` 연결**

기존 JSX의 오버레이·모달 부분을 아래로 교체한다.

```tsx
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
```

- [ ] **Step 5: `App` JSX에서 `PriceModal`에 새 props 전달**

`<PriceModal ... />` 에 아래 두 prop을 추가한다.

```tsx
isClosing = { isClosing };
onAnimationEnd = { handleModalAnimationEnd };
```

- [ ] **Step 6: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 출력 없음

- [ ] **Step 7: Commit**

```bash
git add src/main.tsx
git commit -m "feat: add modal closing animation with isClosing state"
```

---

## Task 3: CSS 히어로존 + 기본정보 그리드 재설계

**Files:**

- Modify: `src/styles.css`

- [ ] **Step 1: `.heroZone` 신규 CSS 추가**

`.modalHeader` 블록 바로 아래에 추가한다.

```css
.heroZone {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
  overflow: hidden;
}

.heroLogoWatermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 60%;
  max-height: 80%;
  opacity: 0.07;
  pointer-events: none;
  user-select: none;
  object-fit: contain;
}

.heroContent {
  position: relative;
  z-index: 1;
}

.heroRight {
  position: relative;
  z-index: 1;
  text-align: right;
  flex-shrink: 0;
}

.heroLabel {
  margin-bottom: 3px;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 600;
}

.heroPrice {
  color: #111827;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -1px;
  line-height: 1.1;
}

.heroChange {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 700;
}

.heroNav {
  color: #374151;
  font-size: 18px;
  font-weight: 800;
}

.heroVol {
  margin-top: 3px;
  color: #9ca3af;
  font-size: 12px;
}
```

- [ ] **Step 2: `.infoGrid` / `.priceGrid` 공유 규칙을 `.infoGrid` 단독으로 재설계**

기존 코드:

```css
.infoGrid,
.priceGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  padding: 20px;
}

.infoGrid {
  padding-bottom: 0;
}

.infoGrid div,
.priceGrid div {
  min-width: 0;
  padding: 14px;
  background: #f8fafc;
}

.infoGrid dt,
.priceGrid dt {
  margin-bottom: 4px;
  color: #5a6573;
  font-size: 13px;
  font-weight: 700;
}

.infoGrid dd,
.priceGrid dd {
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.priceGrid dd.positive {
  color: #c2410c;
}

.priceGrid dd.negative {
  color: #1d4ed8;
}
```

아래로 교체한다 (`.priceGrid` 규칙 전체 제거, `.infoGrid` 카드 스타일로 변경):

```css
.infoGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 16px;
}

.infoGrid div {
  min-width: 0;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.infoGrid dt {
  margin-bottom: 4px;
  color: #5a6573;
  font-size: 12px;
  font-weight: 700;
}

.infoGrid dd {
  margin: 0;
  color: #111827;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}
```

- [ ] **Step 3: 모바일 반응형에서 `.priceGrid` 관련 규칙 제거**

`@media (max-width: 760px)` 블록에서 아래를 찾아 제거한다.

```css
.infoGrid,
.priceGrid {
  grid-template-columns: 1fr;
}
```

아래로 교체한다:

```css
.infoGrid {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 4: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 출력 없음

- [ ] **Step 5: Commit**

```bash
git add src/styles.css
git commit -m "feat: add heroZone styles and redesign infoGrid as card layout"
```

---

## Task 4: TSX `HeroZone` 컴포넌트 + 운용사 로고 맵 + PriceModal 구조 변경

**Files:**

- Modify: `src/main.tsx`

- [ ] **Step 1: 로고 파일 import 추가**

`import "./styles.css";` 바로 아래에 추가한다.

```tsx
import samsungLogo from "./assets/issuer-logos/samsung.svg";
import samsungActiveLogo from "./assets/issuer-logos/samsung-active.svg";
import shinhanLogo from "./assets/issuer-logos/shinhan.svg";
import kbLogo from "./assets/issuer-logos/kb.svg";
import koreaInvestmentLogo from "./assets/issuer-logos/korea-investment.svg";
import hanwhaLogo from "./assets/issuer-logos/hanwha.svg";
import hanaLogo from "./assets/issuer-logos/hana.svg";
import ibkLogo from "./assets/issuer-logos/ibk.svg";
import thejLogo from "./assets/issuer-logos/thej.svg";
import daishinLogo from "./assets/issuer-logos/daishin.png";
import dbLogo from "./assets/issuer-logos/db.png";
import midasLogo from "./assets/issuer-logos/midas.png";
import bnkLogo from "./assets/issuer-logos/bnk.jpg";
import nhAmundiLogo from "./assets/issuer-logos/nh-amundi.png";
import wooriLogo from "./assets/issuer-logos/woori.png";
import kcgiLogo from "./assets/issuer-logos/kcgi.png";
import timefolioLogo from "./assets/issuer-logos/timefolio.png";
import koreaValueLogo from "./assets/issuer-logos/korea-value.png";
import hyundaiLogo from "./assets/issuer-logos/hyundai.png";
```

- [ ] **Step 2: `issuerLogoMap` 상수 추가**

`const chartColors = [...]` 바로 아래에 추가한다.

```tsx
const issuerLogoMap: Record<string, string> = {
  삼성자산운용: samsungLogo,
  삼성액티브자산운용: samsungActiveLogo,
  신한자산운용: shinhanLogo,
  케이비자산운용: kbLogo,
  한국투자신탁운용: koreaInvestmentLogo,
  한화자산운용: hanwhaLogo,
  하나자산운용: hanaLogo,
  아이비케이자산운용: ibkLogo,
  더제이자산운용: thejLogo,
  대신자산운용: daishinLogo,
  디비자산운용: dbLogo,
  마이다스에셋: midasLogo,
  비엔케이자산운용: bnkLogo,
  엔에이치아문디자산운용: nhAmundiLogo,
  우리자산운용: wooriLogo,
  케이씨지아이자산운용: kcgiLogo,
  타임폴리오자산운용: timefolioLogo,
  한국투자밸류자산운용: koreaValueLogo,
  현대자산운용: hyundaiLogo,
};
```

- [ ] **Step 3: `HeroZone` 컴포넌트 추가**

`PriceModal` 함수 선언 바로 앞에 추가한다.

```tsx
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
```

- [ ] **Step 4: `PriceModal` JSX 내부 구조 변경**

`PriceModal` 의 `<header>` 바로 아래 블록을 교체한다.

기존 (isSelectedLoading 체크 ~ StatGrid priceGrid 끝):

```tsx
        {isSelectedLoading ? (
          <p className="modalState">시세를 불러오는 중입니다.</p>
        ) : null}
        {!isSelectedLoading && priceError ? (
          <p className="notice">{priceError}</p>
        ) : null}

        <StatGrid
          className="infoGrid"
          items={[
            { label: "종목", value: selectedEtf.한글종목약명 },
            { label: "코드", value: selectedEtf.단축코드 },
            { label: "운용사", value: selectedEtf.운용사 },
            { label: "보수", value: formatFee(selectedEtf.총보수) },
          ]}
        />

        <StatGrid
          className="priceGrid"
          items={[
            { label: "시세", value: selectedPrice ? "조회 완료" : "-" },
            {
              label: "종가",
              value: selectedPrice ? formatNumber(selectedPrice.close) : "-",
            },
            {
              label: "등락률",
              value: selectedPrice
                ? `${formatNumber(selectedPrice.change)} / ${selectedPrice.changeRate}%`
                : "-",
              tone: selectedChangeTone,
            },
            {
              label: "NAV",
              value: selectedPrice?.nav ? formatNumber(selectedPrice.nav) : "-",
            },
            {
              label: "거래량",
              value: selectedPrice ? formatNumber(selectedPrice.volume) : "-",
            },
          ]}
        />
```

아래로 교체:

```tsx
<HeroZone
  etf={selectedEtf}
  price={selectedPrice}
  changeTone={selectedChangeTone}
/>;

{
  isSelectedLoading ? (
    <p className="modalState">시세를 불러오는 중입니다.</p>
  ) : null;
}
{
  !isSelectedLoading && priceError ? (
    <p className="notice">{priceError}</p>
  ) : null;
}

<StatGrid
  className="infoGrid"
  items={[
    { label: "운용사", value: selectedEtf.운용사 },
    { label: "총보수", value: formatFee(selectedEtf.총보수) },
    { label: "과세유형", value: selectedEtf.과세유형 },
    { label: "시장분류", value: selectedEtf.기초시장분류 },
  ]}
/>;
```

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 출력 없음

- [ ] **Step 6: Commit**

```bash
git add src/main.tsx
git commit -m "feat: add HeroZone with issuer logo watermark, restructure PriceModal"
```

---

## Task 5: 파란색 차트 테마 (TSX + CSS)

**Files:**

- Modify: `src/main.tsx`, `src/styles.css`

- [ ] **Step 1: `chartColors` 배열을 파란색으로 교체**

`src/main.tsx` 에서 `const chartColors` 를 아래로 교체한다.

```tsx
const chartColors = [
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#bfdbfe",
];
```

- [ ] **Step 2: `getPieSegments` 의 "기타" 색상 교체**

`src/main.tsx` 에서 `getPieSegments` 함수 내 아래를 찾아:

```tsx
      color: "#d1fae5",
```

아래로 교체한다:

```tsx
      color: "#dbeafe",
```

- [ ] **Step 3: CSS 차트 영역 파란색으로 교체**

`src/styles.css` 에서 `.holdingsChartWrap` 블록을 교체한다.

기존:

```css
.holdingsChartWrap {
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
  padding: 18px;
  border: 1px solid #d9f4e7;
  border-radius: 8px;
  background: #f0fdf4;
}
```

교체:

```css
.holdingsChartWrap {
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
  padding: 18px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
}
```

- [ ] **Step 4: `.pieTrack` 색상 교체**

기존:

```css
.pieTrack {
  stroke: #dcfce7;
}
```

교체:

```css
.pieTrack {
  stroke: #dbeafe;
}
```

- [ ] **Step 5: `.pieChart span` (중앙 카운트) 색상 교체**

기존 `color: #065f46;` → `color: #1e3a8a;` 로 교체한다.

- [ ] **Step 6: `.pieTooltip` 색상 교체**

기존:

```css
.pieTooltip {
  ...
  border: 1px solid #bbf7d0;
  ...
  box-shadow: 0 10px 24px rgba(6, 95, 70, 0.16);
  color: #064e3b;
  ...
}
```

교체:

```css
.pieTooltip {
  position: absolute;
  left: 50%;
  bottom: -10px;
  z-index: 2;
  display: grid;
  min-width: 132px;
  padding: 8px 10px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.14);
  color: #1e3a8a;
  pointer-events: none;
  transform: translate(-50%, 100%);
}
```

- [ ] **Step 7: `.pieTooltip span` 색상 교체**

기존 `color: #047857;` → `color: #2563eb;` 로 교체한다.

- [ ] **Step 8: `.chartLegend strong` 색상 교체**

기존 `color: #064e3b;` → `color: #1e3a8a;` 로 교체한다.

- [ ] **Step 9: `.chartLegend em` 색상 교체**

기존 `color: #047857;` → `color: #2563eb;` 로 교체한다.

- [ ] **Step 10: `.holdingCardMetric dd` 비중 수치 색상 교체**

`src/styles.css` 에서 `.holdingCardMetric dd` 블록의 `color: #111827;` 를 아래로 교체한다.

```css
color: #2563eb;
```

- [ ] **Step 12: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 출력 없음

- [ ] **Step 13: Commit**

```bash
git add src/main.tsx src/styles.css
git commit -m "feat: switch chart colors from green to blue theme"
```

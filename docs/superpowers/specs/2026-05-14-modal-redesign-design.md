# Modal Redesign — Design Spec

Date: 2026-05-14

## Overview

ETF 상세 모달을 A+C 혼합 레이아웃으로 재설계한다. 히어로 가격존(C)과 정제된 스크롤 구성종목 섹션(A)을 결합하고, 열기/닫기 애니메이션, 파란색 차트, 운용사별 로고 워터마크를 적용한다.

---

## 1. 모달 구조 (위→아래 순서)

### 1-1. Header

- ETF 한글종목약명 (크게)
- 단축코드 · 운용사 · 총보수 (작게)
- 우측: 시세 갱신 버튼 + X 닫기 버튼
- 하단 구분선

### 1-2. Hero Zone (C 스타일 — 가격 강조)

- 배경: 흰색 (색상 없음)
- 운용사 로고를 **가운데 정렬**, `opacity: 0.07` 워터마크로 배치
  - 로고가 없는 운용사는 해당 영역 비워둠
- 좌측: "현재가" 라벨 + 종가 (32px, 굵게) + 등락액·등락률
- 우측: NAV 라벨 + NAV 값 + 거래량
- 하단 구분선

### 1-3. 기본정보 Grid (A 스타일)

- 2×2 카드 그리드: 운용사 / 총보수 / 과세유형 / 시장분류
- 카드 배경 `#f8fafc`, border-radius 8px
- 하단 구분선

### 1-4. 구성종목 섹션 (A 스타일)

- 헤더: "구성종목" 제목 + "{n}개" 카운트
- 파이차트 + 범례 영역 (파란색 테마)
- 2열 보유 종목 카드 (종목명 / 코드 / 비중)
- 페이지네이션 (10개 단위)

---

## 2. 색상 정책

| 영역              | 색상                                                      |
| ----------------- | --------------------------------------------------------- |
| 차트 배경         | `#eff6ff`                                                 |
| 차트 테두리       | `#bfdbfe`                                                 |
| 파이 세그먼트 1~5 | `#1d4ed8` → `#2563eb` → `#3b82f6` → `#60a5fa` → `#dbeafe` |
| 비중 텍스트       | `#2563eb`                                                 |
| 등락 양수         | `#c2410c`                                                 |
| 등락 음수         | `#1d4ed8`                                                 |

---

## 3. 애니메이션

| 대상     | 진입                                                                                     | 퇴장                          |
| -------- | ---------------------------------------------------------------------------------------- | ----------------------------- |
| 오버레이 | `opacity 0→0.48` (200ms ease)                                                            | `opacity 0.48→0` (180ms ease) |
| 모달     | `translateY(24px) opacity 0` → `translateY(0) opacity 1` (260ms cubic-bezier(0.2,0,0,1)) | 역방향 (200ms ease-in)        |

닫기 트리거: X 버튼, 오버레이 클릭 모두 동일.

퇴장 흐름:

1. `closePriceModal()` 호출 시 `isClosing` 상태를 `true`로 설정
2. 오버레이·모달에 퇴장 CSS 클래스 부여 → keyframe 재생
3. 모달의 `onAnimationEnd` 시점에 `selectedEtf(null)` + `isClosing(false)` 초기화

---

## 4. 운용사 로고 매핑

`src/assets/issuer-logos/` 디렉토리의 파일을 사용한다. `manifest.json`의 `status === "downloaded"` 항목만 사용 가능하다. 운용사 이름 → 파일명 매핑을 상수로 정의한다.

현재 사용 가능한 로고:

- 삼성자산운용 → `samsung.svg`
- 삼성액티브자산운용 → `samsung-active.svg`
- 신한자산운용 → `shinhan.svg`
- 케이비자산운용 → `kb.svg`
- 한국투자신탁운용 → `korea-investment.svg`
- 한화자산운용 → `hanwha.svg`
- 하나자산운용 → `hana.svg`
- 아이비케이자산운용 → `ibk.svg`
- 더제이자산운용 → `thej.svg`
- 대신자산운용 → `daishin.png`
- 디비자산운용 → `db.png`
- 마이다스에셋 → `midas.png`
- 비엔케이자산운용 → `bnk.jpg`
- 엔에이치아문디자산운용 → `nh-amundi.png`
- 우리자산운용 → `woori.png`
- 케이씨지아이자산운용 → `kcgi.png`
- 타임폴리오자산운용 → `timefolio.png`
- 한국투자밸류자산운용 → `korea-value.png`
- 현대자산운용 → `hyundai.png`

로고 `<img>` 태그 스타일: `position: absolute`, 세로 중앙, 가로 중앙 정렬, `max-width: 60%`, `opacity: 0.07`, `pointer-events: none`.

---

## 5. 구현 범위

- `src/main.tsx`: `PriceModal`, `HoldingsChart` 컴포넌트 수정
- `src/styles.css`: 모달 관련 CSS 전면 수정 (애니메이션 keyframe 포함)
- 새 파일 없음, 기존 파일만 수정

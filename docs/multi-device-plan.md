# 멀티 디바이스 반응형 레이아웃 플랜

## 목표

세 개의 대표 모바일 디바이스에 최적화된 레이아웃과 재사용 가능한 컴포넌트 구조 구현.

## 대상 디바이스

| 디바이스           | CSS 뷰포트   | 특징                            |
| ------------------ | ------------ | ------------------------------- |
| iPhone 13 mini     | 375 × 812 px | 초소형, 공간 최소화             |
| iPhone 16 Pro      | 393 × 852 px | 중형, 적당한 여유               |
| Samsung Galaxy S26 | 412 × 915 px | 넓은 Android, 더 많은 가로 공간 |

## 현재 코드 위치

- `/home/yup/etf_reader/src/styles.css` — 전역 CSS (760px, 420px 브레이크포인트)
- `/home/yup/etf_reader/src/components/` — React 컴포넌트들
  - SearchToolbar.tsx (SearchToolbar, ResultBar)
  - ResultsTable.tsx (ResultsTable, ColumnFilterHeader)
  - NumberPagination.tsx (NumberPagination)
  - PriceModal.tsx (PriceModal, StatGrid, HeroZone)
  - HoldingsSection.tsx (HoldingsSection)
- `/home/yup/etf_reader/src/App.tsx` — 루트 컴포넌트

## 태스크

### Task 1: CSS 커스텀 속성 및 디바이스 브레이크포인트

`src/styles.css`에 CSS custom properties와 디바이스별 브레이크포인트 추가.
375px/393px/412px 각각에 최적화된 spacing, font-size, column-width 값 정의.

### Task 2: EtfCard 재사용 컴포넌트 추출

`src/components/EtfCard.tsx` 신규 생성.
ResultsTable의 tbody tr 카드 렌더링 로직을 독립 컴포넌트로 추출.

### Task 3: FilterChip 재사용 컴포넌트 추출

`src/components/FilterChip.tsx` 신규 생성.
ResultsTable의 ColumnFilterHeader를 독립 컴포넌트로 추출.

### Task 4: SearchToolbar 서브컴포넌트 분리 및 디바이스 최적화

SearchToolbar.tsx 내 AppHeader, SearchBar 서브컴포넌트 분리.
각 디바이스에 최적화된 레이아웃 적용.

### Task 5: PriceModal 디바이스별 최적화

각 디바이스에서 모달 헤더, 히어로 존, 정보 그리드 최적화.
375px: 아이콘만 버튼, 초소형 헤더
393px/412px: 레이블 표시, 여유로운 패딩

### Task 6: NumberPagination 디바이스별 최적화

375px: 이전/다음 + 현재/전체 표시만
393px: 페이지 번호 3개
412px: 페이지 번호 5개

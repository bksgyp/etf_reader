# 대한민국 ETF 검색

`etf.md`에 정리된 대한민국 ETF 목록을 검색하는 React+Vite 정적 웹앱입니다.

## 실행

```bash
npm install
npm run generate:data
npm run dev
```

`npm run dev`는 Vite 프론트엔드만 실행합니다. 서버리스 API까지 로컬에서 확인하려면 Vercel CLI의 `vercel dev`를 사용합니다.

## KRX API 키

KRX Open API의 `ETF 일별매매정보`를 조회합니다. 실시간 체결가가 아니라 최신 영업일 기준 일별 시세입니다. API 키는 브라우저에 노출하지 않고 Vercel 서버리스 함수에서만 사용합니다.

로컬 또는 Vercel 환경변수에 아래 값을 설정합니다.

```bash
KRX_API_KEY=발급받은_KRX_OPEN_API_인증키
```

Vercel 배포 후 `/api/etf-prices`가 최신 영업일 ETF 일별 시세를 반환합니다.

## 데이터 갱신

1. 루트의 `etf.md`를 같은 Markdown 표 형식으로 교체합니다.
2. 아래 명령으로 앱용 JSON을 다시 생성합니다.

```bash
npm run generate:data
```

## 검증

```bash
npm test
npm run build
```

## Vercel 배포

GitHub 저장소를 Vercel에 연결하면 Vite 프로젝트로 자동 감지됩니다.

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Environment Variable: `KRX_API_KEY`

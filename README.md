# 대한민국 ETF 검색

`etf.md`에 정리된 대한민국 ETF 목록을 검색하는 React+Vite 정적 웹앱입니다.

## 실행

```bash
npm install
npm run generate:data
npm run dev
```

`npm run dev`는 Vite 프론트엔드만 실행합니다. 서버리스 API까지 로컬에서 확인하려면 Vercel CLI의 `vercel dev`를 사용합니다.

## 한국투자증권 API 키

한국투자증권 Open API의 `주식현재가 시세`를 조회합니다. API 키는 브라우저에 노출하지 않고 Vercel 서버리스 함수에서만 사용합니다.

로컬 또는 Vercel 환경변수에 아래 값을 설정합니다.

```bash
KIS_APP_KEY=발급받은_한국투자증권_APP_KEY
KIS_APP_SECRET=발급받은_한국투자증권_APP_SECRET
KIS_ENV=prod
```

모의투자 도메인을 쓰려면 `KIS_ENV=vts`로 설정합니다. 배포 후 `/api/etf-prices?codes=005930,069500`처럼 조회할 수 있습니다.

## 데이터 갱신

1. 루트의 `etf.md`를 같은 Markdown 표 형식으로 교체합니다.
2. 아래 명령으로 앱용 JSON을 다시 생성합니다.

```bash
npm run generate:data
```

## ETF 구성종목 갱신

`pykrx`로 ETF 구성종목, 계약수, 금액, 비중을 받아 `src/data/etf_holdings.json`과 `etf_holdings.md`에 저장합니다.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
npm run fetch:holdings
```

KRX 로그인 세션이 필요한 API라서 실행 전 `KRX_ID`, `KRX_PW` 환경변수를 설정해야 합니다. `.env`를 사용할 경우 파일은 커밋하지 마세요. 이 저장소의 `.env`는 이미 `.gitignore`에 포함되어 있습니다.

특정 기준일이나 테스트용 개수 제한이 필요하면 직접 스크립트를 실행합니다.

```bash
.venv/bin/python scripts/fetch_etf_holdings.py --date 20260514 --limit 5
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
- Environment Variables: `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_ENV`

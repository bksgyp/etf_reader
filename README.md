# 대한민국 ETF 검색

`etf.md`에 정리된 대한민국 ETF 목록을 검색하는 React+Vite 정적 웹앱입니다.

## 실행

```bash
npm install
npm run generate:data
npm run dev
```

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

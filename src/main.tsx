import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Search } from "lucide-react";
import etfs from "./data/etfs.json";
import type { Etf } from "./types";
import "./styles.css";

const typedEtfs = etfs as Etf[];
const searchFields: Array<keyof Etf> = [
  "단축코드",
  "한글종목명",
  "한글종목약명",
  "영문종목명",
  "기초지수명",
  "운용사",
];

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function matchesQuery(etf: Etf, query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return true;
  }

  return searchFields.some((field) => normalize(etf[field]).includes(normalizedQuery));
}

function formatFee(fee: string) {
  const value = Number(fee);
  return Number.isFinite(value) ? `${value.toFixed(3)}%` : fee;
}

function App() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => typedEtfs.filter((etf) => matchesQuery(etf, query)), [query]);

  return (
    <main className="app">
      <section className="toolbar" aria-label="ETF 검색">
        <div>
          <h1>대한민국 ETF 검색</h1>
          <p>{typedEtfs.length.toLocaleString("ko-KR")}개 ETF를 코드, 이름, 지수, 운용사로 검색합니다.</p>
        </div>
        <label className="searchBox">
          <Search aria-hidden="true" size={20} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: S&P500, 삼성, 379780, RISE"
            aria-label="ETF 검색어"
          />
        </label>
      </section>

      <section className="resultHeader" aria-live="polite">
        <strong>{results.length.toLocaleString("ko-KR")}</strong>
        <span>개 검색 결과</span>
      </section>

      <section className="tableWrap" aria-label="ETF 검색 결과">
        <table>
          <thead>
            <tr>
              <th>종목</th>
              <th>코드</th>
              <th>운용사</th>
              <th>시장</th>
              <th>자산</th>
              <th>총보수</th>
              <th>과세유형</th>
            </tr>
          </thead>
          <tbody>
            {results.map((etf) => (
              <tr key={etf.표준코드}>
                <td>
                  <span className="name">{etf.한글종목약명}</span>
                  <span className="fullName">{etf.기초지수명}</span>
                </td>
                <td className="code">{etf.단축코드}</td>
                <td>{etf.운용사}</td>
                <td>{etf.기초시장분류}</td>
                <td>{etf.기초자산분류}</td>
                <td>{formatFee(etf.총보수)}</td>
                <td>{etf.과세유형}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {results.length === 0 ? <p className="empty">검색 결과가 없습니다.</p> : null}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

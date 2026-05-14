export const ETF_HEADERS = [
  "표준코드",
  "단축코드",
  "한글종목명",
  "한글종목약명",
  "영문종목명",
  "상장일",
  "기초지수명",
  "지수산출기관",
  "추적배수",
  "복제방법",
  "기초시장분류",
  "기초자산분류",
  "상장좌수",
  "운용사",
  "CU수량",
  "총보수",
  "과세유형",
];

const tableRowPattern = /^\|.*\|$/;

export function splitMarkdownRow(line) {
  return line
    .trim()
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorRow(cells) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function parseEtfMarkdown(markdown) {
  const rows = markdown
    .split(/\r?\n/)
    .filter((line) => tableRowPattern.test(line.trim()))
    .map(splitMarkdownRow);

  if (rows.length < 2) {
    throw new Error("ETF markdown table not found.");
  }

  const [headers, separator, ...dataRows] = rows;

  if (headers.length !== ETF_HEADERS.length) {
    throw new Error(`Expected ${ETF_HEADERS.length} headers, found ${headers.length}.`);
  }

  for (const [index, header] of ETF_HEADERS.entries()) {
    if (headers[index] !== header) {
      throw new Error(`Header mismatch at ${index + 1}: expected "${header}", found "${headers[index]}".`);
    }
  }

  if (!isSeparatorRow(separator)) {
    throw new Error("ETF markdown table separator row is invalid.");
  }

  return dataRows.map((cells, rowIndex) => {
    if (cells.length !== ETF_HEADERS.length) {
      throw new Error(`Row ${rowIndex + 3} has ${cells.length} cells; expected ${ETF_HEADERS.length}.`);
    }

    return Object.fromEntries(ETF_HEADERS.map((header, cellIndex) => [header, cells[cellIndex]]));
  });
}

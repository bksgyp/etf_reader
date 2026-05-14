export type Etf = {
  표준코드: string;
  단축코드: string;
  한글종목명: string;
  한글종목약명: string;
  영문종목명: string;
  상장일: string;
  기초지수명: string;
  지수산출기관: string;
  추적배수: string;
  복제방법: string;
  기초시장분류: string;
  기초자산분류: string;
  상장좌수: string;
  운용사: string;
  CU수량: string;
  총보수: string;
  과세유형: string;
};

export type EtfPrice = {
  basDd: string;
  code: string;
  name: string;
  close: string;
  change: string;
  changeRate: string;
  nav?: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  tradingValue: string;
  marketCap: string;
  netAssets?: string;
};

export type EtfPriceResponse = {
  basDd: string;
  count: number;
  failures?: Array<{
    code: string;
    error: string;
  }>;
  prices: Record<string, EtfPrice>;
};

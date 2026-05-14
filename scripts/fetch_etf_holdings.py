import argparse
import contextlib
import io
import json
import os
import time
from datetime import datetime
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[1]
ETF_JSON_PATH = ROOT_DIR / "src" / "data" / "etfs.json"
OUTPUT_JSON_PATH = ROOT_DIR / "src" / "data" / "etf_holdings.json"
OUTPUT_MD_PATH = ROOT_DIR / "etf_holdings.md"
PROGRESS_JSON_PATH = ROOT_DIR / "src" / "data" / "etf_holdings.progress.json"
stock = None


def today_yyyymmdd():
    return datetime.now().strftime("%Y%m%d")


def load_etfs(limit):
    with ETF_JSON_PATH.open(encoding="utf-8") as file:
        etfs = json.load(file)

    return etfs[:limit] if limit else etfs


def normalize_holding(row):
    return {
        "componentCode": str(row.name).zfill(6),
        "contracts": None if row.get("계약수") is None else float(row.get("계약수")),
        "amount": None if row.get("금액") is None else int(row.get("금액")),
        "weight": None if row.get("비중") is None else round(float(row.get("비중")), 2),
    }


def fetch_holdings(etf, date):
    ticker = etf["단축코드"]
    frame = stock.get_etf_portfolio_deposit_file(ticker, date)

    return {
        "etfCode": ticker,
        "etfName": etf["한글종목약명"],
        "date": date,
        "holdings": [normalize_holding(row) for _, row in frame.iterrows()],
    }


def load_pykrx_stock():
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        from pykrx import stock as pykrx_stock

    return pykrx_stock


def write_json(payload):
    OUTPUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON_PATH.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")


def write_progress(payload):
    PROGRESS_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with PROGRESS_JSON_PATH.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")


def write_markdown(payload):
    lines = [
        "| ETF단축코드 | ETF명 | 기준일 | 구성종목코드 | 계약수 | 금액 | 비중 |",
        "| --- | --- | --- | --- | ---: | ---: | ---: |",
    ]

    for etf in payload["etfs"]:
        for holding in etf["holdings"]:
            lines.append(
                " | ".join(
                    [
                        f"| {etf['etfCode']}",
                        etf["etfName"],
                        etf["date"],
                        holding["componentCode"],
                        "" if holding["contracts"] is None else str(holding["contracts"]),
                        "" if holding["amount"] is None else str(holding["amount"]),
                        "" if holding["weight"] is None else str(holding["weight"]),
                    ]
                )
                + " |"
            )

    OUTPUT_MD_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    global stock
    parser = argparse.ArgumentParser(description="Fetch ETF holdings from pykrx.")
    parser.add_argument("--date", default=today_yyyymmdd(), help="기준일 YYYYMMDD")
    parser.add_argument("--limit", type=int, default=0, help="테스트용 ETF 개수 제한")
    parser.add_argument("--sleep", type=float, default=0.3, help="ETF 조회 사이 대기 시간(초)")
    args = parser.parse_args()

    load_dotenv(ROOT_DIR / ".env")
    if not os.environ.get("KRX_ID") or not os.environ.get("KRX_PW"):
        raise SystemExit("KRX_ID, KRX_PW 환경변수를 설정한 뒤 다시 실행하세요.")

    stock = load_pykrx_stock()
    etfs = load_etfs(args.limit)
    payload = {
        "source": "pykrx.stock.get_etf_portfolio_deposit_file",
        "date": args.date,
        "count": 0,
        "failed": [],
        "etfs": [],
    }

    for index, etf in enumerate(etfs, start=1):
        try:
            item = fetch_holdings(etf, args.date)
            payload["etfs"].append(item)
            payload["count"] += 1
        except Exception as error:
            payload["failed"].append(
                {
                    "etfCode": etf["단축코드"],
                    "etfName": etf["한글종목약명"],
                    "error": str(error),
                }
            )
            print(f"[{index}/{len(etfs)}] failed {etf['단축코드']} {etf['한글종목약명']}: {error}", flush=True)
        else:
            print(
                f"[{index}/{len(etfs)}] {etf['단축코드']} {etf['한글종목약명']} {len(item['holdings'])} holdings",
                flush=True,
            )

        write_progress(payload)

        if index < len(etfs):
            time.sleep(args.sleep)

    if payload["count"] > 0 and all(len(etf["holdings"]) == 0 for etf in payload["etfs"]):
        raise SystemExit("모든 ETF의 구성종목이 비어 있어 파일을 저장하지 않았습니다. KRX 로그인 상태를 확인하세요.")

    write_json(payload)
    write_markdown(payload)
    print(f"Wrote {OUTPUT_JSON_PATH}")
    print(f"Wrote {OUTPUT_MD_PATH}")


if __name__ == "__main__":
    main()

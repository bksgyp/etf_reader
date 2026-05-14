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
PUBLIC_JSON_PATH = ROOT_DIR / "public" / "data" / "etf_holdings.json"
PROGRESS_JSON_PATH = ROOT_DIR / "src" / "data" / "etf_holdings.progress.json"
PDF = None
get_etx_isin = None


def today_yyyymmdd():
    return datetime.now().strftime("%Y%m%d")


def load_etfs(limit):
    with ETF_JSON_PATH.open(encoding="utf-8") as file:
        etfs = json.load(file)

    return etfs[:limit] if limit else etfs


def parse_number(value, cast):
    if value is None or value == "-":
        return 0

    if isinstance(value, str):
        value = value.replace(",", "")

    return cast(value)


def classify_component(row):
    market_id = row.get("MKT_ID") or ""
    security_group_id = row.get("SECUGRP_ID") or ""
    component_code = str(row.get("COMPST_ISU_CD") or "")
    component_isin = str(row.get("COMPST_ISU_CD2") or "")

    if component_code == "KRD010010001" or component_code == "010010":
        return "현금"
    if market_id == "BND" or security_group_id == "BN" or component_isin.startswith("KR3"):
        return "채권"
    if market_id in ("STK", "KSQ", "KNX") or security_group_id == "ST":
        return "국내주식"
    if component_isin and not component_isin.startswith("KR"):
        return "해외주식"
    if component_code.startswith(("A", "B", "H", "F")):
        return "파생/기타"
    return "기타"


def normalize_holding(row):
    component_code = str(row.get("COMPST_ISU_CD") or "")
    component_isin = str(row.get("COMPST_ISU_CD2") or "")
    component_name = row.get("COMPST_ISU_NM") or ""
    market_id = row.get("MKT_ID") or ""
    security_group_id = row.get("SECUGRP_ID") or ""

    return {
        "componentCode": component_code,
        "componentIsin": component_isin,
        "componentName": component_name,
        "componentAssetType": classify_component(row),
        "componentMarketId": market_id,
        "componentSecurityGroupId": security_group_id,
        "contracts": parse_number(row.get("COMPST_ISU_CU1_SHRS"), float),
        "amount": parse_number(row.get("VALU_AMT"), int),
        "weight": round(parse_number(row.get("COMPST_RTO"), float), 2),
    }


def fetch_holdings(etf, date):
    ticker = etf["단축코드"]
    isin = get_etx_isin(ticker)
    frame = PDF().fetch(date, isin)

    return {
        "etfCode": ticker,
        "etfName": etf["한글종목약명"],
        "date": date,
        "holdings": [normalize_holding(row) for _, row in frame.iterrows()],
    }


def apply_request_timeout(timeout):
    import requests

    original_request = requests.sessions.Session.request

    def request_with_timeout(self, method, url, **kwargs):
        kwargs.setdefault("timeout", timeout)
        return original_request(self, method, url, **kwargs)

    requests.sessions.Session.request = request_with_timeout


def load_krx_pdf():
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        from pykrx.website.krx.etx.core import PDF as KrxPdf
        from pykrx.website.krx.etx.ticker import get_etx_isin as krx_get_etx_isin

    return KrxPdf, krx_get_etx_isin


def write_json(payload):
    OUTPUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON_PATH.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")
    PUBLIC_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with PUBLIC_JSON_PATH.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")


def write_progress(payload):
    PROGRESS_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = PROGRESS_JSON_PATH.with_suffix(".tmp")
    with tmp_path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")
    tmp_path.replace(PROGRESS_JSON_PATH)


def load_progress():
    if not PROGRESS_JSON_PATH.exists():
        raise SystemExit(f"진행 파일이 없습니다: {PROGRESS_JSON_PATH}")

    with PROGRESS_JSON_PATH.open(encoding="utf-8") as file:
        return json.load(file)


def main():
    global PDF, get_etx_isin
    parser = argparse.ArgumentParser(description="Fetch ETF holdings from pykrx.")
    parser.add_argument("--date", default=today_yyyymmdd(), help="기준일 YYYYMMDD")
    parser.add_argument("--limit", type=int, default=0, help="테스트용 ETF 개수 제한")
    parser.add_argument("--resume", action="store_true", help="진행 파일에서 이어받기")
    parser.add_argument("--sleep", type=float, default=0.3, help="ETF 조회 사이 대기 시간(초)")
    parser.add_argument("--timeout", type=float, default=30, help="KRX 요청 timeout(초)")
    args = parser.parse_args()

    load_dotenv(ROOT_DIR / ".env")
    if not os.environ.get("KRX_ID") or not os.environ.get("KRX_PW"):
        raise SystemExit("KRX_ID, KRX_PW 환경변수를 설정한 뒤 다시 실행하세요.")

    apply_request_timeout(args.timeout)
    PDF, get_etx_isin = load_krx_pdf()
    etfs = load_etfs(args.limit)
    if args.resume:
        payload = load_progress()
        if payload["date"] != args.date:
            raise SystemExit(f"진행 파일 기준일({payload['date']})과 요청 기준일({args.date})이 다릅니다.")
    else:
        payload = {
            "source": "pykrx.stock.get_etf_portfolio_deposit_file",
            "date": args.date,
            "count": 0,
            "failed": [],
            "etfs": [],
        }

    processed_count = len(payload["etfs"]) + len(payload["failed"])

    for index, etf in enumerate(etfs[processed_count:], start=processed_count + 1):
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
    print(f"Wrote {OUTPUT_JSON_PATH}")


if __name__ == "__main__":
    main()

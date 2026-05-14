API Spec

1.1. 유가증권 일별매매정보

1.2. Description

유가증권시장에 상장되어 있는 주권의 매매정보 제공 ('10년01월04일 데이터부터 제공)

Server endpoint url : https://data-dbg.krx.co.kr/svc/apis/sto/stk\_bydd\_trd

1.3. request

1.3.1. InBlock\_1

|  |  |  |
| --- | --- | --- |
| Name | Type | Description |
| basDd | string | 기준일자 |

1.4. response

1.4.1. OutBlock\_1

|  |  |  |
| --- | --- | --- |
| Name | Type | Description |
| BAS\_DD | string | 기준일자 |
| ISU\_CD | string | 종목코드 |
| ISU\_NM | string | 종목명 |
| MKT\_NM | string | 시장구분 |
| SECT\_TP\_NM | string | 소속부 |
| TDD\_CLSPRC | string | 종가 |
| CMPPREVDD\_PRC | string | 대비 |
| FLUC\_RT | string | 등락률 |
| TDD\_OPNPRC | string | 시가 |
| TDD\_HGPRC | string | 고가 |
| TDD\_LWPRC | string | 저가 |
| ACC\_TRDVOL | string | 거래량 |
| ACC\_TRDVAL | string | 거래대금 |
| MKTCAP | string | 시가총액 |
| LIST\_SHRS | string | 상장주식수 |

1.5. request Sample

|  |
| --- |
| {"basDd":"\_\_"} |

1.6. response Sample

|  |
| --- |
| {"OutBlock\_1":[{"BAS\_DD":"\_\_","ISU\_CD":"\_\_","ISU\_NM":"\_\_","MKT\_NM":"\_\_","SECT\_TP\_NM":"-","TDD\_CLSPRC":"-","CMPPREVDD\_PRC":"-","FLUC\_RT":"-","TDD\_OPNPRC":"-","TDD\_HGPRC":"-","TDD\_LWPRC":"-","ACC\_TRDVOL":"-","ACC\_TRDVAL":"-","MKTCAP":"-","LIST\_SHRS":"-"},{"BAS\_DD":"\_\_","ISU\_CD":"\_\_","ISU\_NM":"\_\_","MKT\_NM":"\_\_","SECT\_TP\_NM":"-","TDD\_CLSPRC":"-","CMPPREVDD\_PRC":"-","FLUC\_RT":"-","TDD\_OPNPRC":"-","TDD\_HGPRC":"-","TDD\_LWPRC":"-","ACC\_TRDVOL":"-","ACC\_TRDVAL":"-","MKTCAP":"-","LIST\_SHRS":"-"}]} |

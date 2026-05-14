## 주식현재가 시세
| 주식현재가 시세 | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 | Unnamed: 5 | Unnamed: 6 |
| --- | --- | --- | --- | --- | --- | --- |
| API 통신방식 | REST | NaN | NaN | NaN | NaN | NaN |
| 메뉴 위치 | [국내주식] 기본시세 | NaN | NaN | NaN | NaN | NaN |
| API 명 | 주식현재가 시세 | NaN | NaN | NaN | NaN | NaN |
| API ID | v1\_국내주식-008 | NaN | NaN | NaN | NaN | NaN |
| 실전 TR\_ID | FHKST01010100 | NaN | NaN | NaN | NaN | NaN |
| 모의 TR\_ID | FHKST01010100 | NaN | NaN | NaN | NaN | NaN |
| 기본정보 | NaN | NaN | NaN | NaN | NaN | NaN |
| HTTP Method | GET | NaN | NaN | NaN | NaN | NaN |
| 실전 Domain | https://openapi.koreainvestment.com:9443 | NaN | NaN | NaN | NaN | NaN |
| 모의 Domain | https://openapivts.koreainvestment.com:29443 | NaN | NaN | NaN | NaN | NaN |
| URL 명 | /uapi/domestic-stock/v1/quotations/inquire-price | NaN | NaN | NaN | NaN | NaN |
| 개요 | NaN | NaN | NaN | NaN | NaN | NaN |
| 개요 | 주식 현재가 시세 API입니다. 실시간 시세를 원하신다면 웹소켓 API를 활용하세요.\r\n\r\n※ 종목코드 마스터파일 파이썬 정제코드는 한국투자증권 Github 참고 부탁드립니다.\r\n   https://github.com/koreainvestment/open-trading-api/tree/main/stocks\_info | NaN | NaN | NaN | NaN | NaN |
| Layout | NaN | NaN | NaN | NaN | NaN | NaN |
| 구분 | Element | 한글명 | Type | Required | Length | Description |
| Request Header | content-type | 컨텐츠타입 | string | Y | 40 | application/json; charset=utf-8 |
| NaN | authorization | 접근토큰 | string | Y | 350 | OAuth 토큰이 필요한 API 경우 발급한 Access token \r\n일반고객(Access token 유효기간 1일, OAuth 2.0의 Client Credentials Grant 절차를 준용) \r\n법인(Access token 유효기간 3개월, Refresh token 유효기간 1년, OAuth 2.0의 Authorization Code Grant 절차를 준용) |
| NaN | appkey | 앱키 | string | Y | 36 | 한국투자증권 홈페이지에서 발급받은 appkey (절대 노출되지 않도록 주의해주세요.) |
| NaN | appsecret | 앱시크릿키 | string | Y | 180 | 한국투자증권 홈페이지에서 발급받은 appkey (절대 노출되지 않도록 주의해주세요.) |
| NaN | personalseckey | 고객식별키 | string | N | 180 | [법인 필수] 제휴사 회원 관리를 위한 고객식별키 |
| NaN | tr\_id | 거래ID | string | Y | 13 | FHKST01010100 |
| NaN | tr\_cont | 연속 거래 여부 | string | N | 1 | tr\_cont를 이용한 다음조회 불가 API |
| NaN | custtype | 고객 타입 | string | Y | 1 | B : 법인 \r\nP : 개인 |
| NaN | seq\_no | 일련번호 | string | N | 2 | [법인 필수] 001 |
| NaN | mac\_address | 맥주소 | string | N | 12 | 법인고객 혹은 개인고객의 Mac address 값 |
| NaN | phone\_number | 핸드폰번호 | string | N | 12 | [법인 필수] 제휴사APP을 사용하는 경우 사용자(회원) 핸드폰번호 \r\nex) 01011112222 (하이픈 등 구분값 제거) |
| NaN | ip\_addr | 접속 단말 공인 IP | string | N | 12 | [법인 필수] 사용자(회원)의 IP Address |
| NaN | gt\_uid | Global UID | string | N | 32 | [법인 전용] 거래고유번호로 사용하므로 거래별로 UNIQUE해야 함 |
| Request Query Parameter | FID\_COND\_MRKT\_DIV\_CODE | 조건 시장 분류 코드 | string | Y | 2 | J:KRX, NX:NXT, UN:통합 |
| NaN | FID\_INPUT\_ISCD | 입력 종목코드 | string | Y | 12 | 종목코드 (ex 005930 삼성전자)  // ETN은 종목코드 6자리 앞에 Q 입력 필수 |
| Response Header | content-type | 컨텐츠타입 | string | Y | 40 | application/json; charset=utf-8 |
| NaN | tr\_id | 거래ID | string | Y | 13 | 요청한 tr\_id |
| NaN | tr\_cont | 연속 거래 여부 | string | N | 1 | tr\_cont를 이용한 다음조회 불가 API |
| NaN | gt\_uid | Global UID | string | N | 32 | [법인 전용] 거래고유번호로 사용하므로 거래별로 UNIQUE해야 함 |
| Response Body | rt\_cd | 성공 실패 여부 | string | Y | 1 |  |
| NaN | msg\_cd | 응답코드 | string | Y | 8 |  |
| NaN | msg1 | 응답메세지 | string | Y | 80 |  |
| NaN | output | 응답상세 | object | Y |  | NaN |
| NaN | iscd\_stat\_cls\_code | 종목 상태 구분 코드 | string | Y | 3 | 51 : 관리종목\r\n52 : 투자위험\r\n53 : 투자경고\r\n54 : 투자주의\r\n55 : 신용가능\r\n57 : 증거금 100%\r\n58 : 거래정지\r\n59 : 단기과열종목\r\n |
| NaN | marg\_rate | 증거금 비율 | string | Y | 84 |  |
| NaN | rprs\_mrkt\_kor\_name | 대표 시장 한글 명 | string | Y | 40 |  |
| NaN | new\_hgpr\_lwpr\_cls\_code | 신 고가 저가 구분 코드 | string | Y | 10 |  |
| NaN | bstp\_kor\_isnm | 업종 한글 종목명 | string | Y | 40 |  |
| NaN | temp\_stop\_yn | 임시 정지 여부 | string | Y | 1 |  |
| NaN | oprc\_rang\_cont\_yn | 시가 범위 연장 여부 | string | Y | 1 |  |
| NaN | clpr\_rang\_cont\_yn | 종가 범위 연장 여부 | string | Y | 1 |  |
| NaN | crdt\_able\_yn | 신용 가능 여부 | string | Y | 1 |  |
| NaN | grmn\_rate\_cls\_code | 보증금 비율 구분 코드 | string | Y | 3 |  |
| NaN | elw\_pblc\_yn | ELW 발행 여부 | string | Y | 1 |  |
| NaN | stck\_prpr | 주식 현재가 | string | Y | 10 |  |
| NaN | prdy\_vrss | 전일 대비 | string | Y | 10 |  |
| NaN | prdy\_vrss\_sign | 전일 대비 부호 | string | Y | 1 |  |
| NaN | prdy\_ctrt | 전일 대비율 | string | Y | 82 |  |
| NaN | acml\_tr\_pbmn | 누적 거래 대금 | string | Y | 18 |  |
| NaN | acml\_vol | 누적 거래량 | string | Y | 18 |  |
| NaN | prdy\_vrss\_vol\_rate | 전일 대비 거래량 비율 | string | Y | 84 |  |
| NaN | stck\_oprc | 주식 시가2 | string | Y | 10 |  |
| NaN | stck\_hgpr | 주식 최고가 | string | Y | 10 |  |
| NaN | stck\_lwpr | 주식 최저가 | string | Y | 10 |  |
| NaN | stck\_mxpr | 주식 상한가 | string | Y | 10 |  |
| NaN | stck\_llam | 주식 하한가 | string | Y | 10 |  |
| NaN | stck\_sdpr | 주식 기준가 | string | Y | 10 |  |
| NaN | wghn\_avrg\_stck\_prc | 가중 평균 주식 가격 | string | Y | 192 |  |
| NaN | hts\_frgn\_ehrt | HTS 외국인 소진율 | string | Y | 82 |  |
| NaN | frgn\_ntby\_qty | 외국인 순매수 수량 | string | Y | 12 |  |
| NaN | pgtr\_ntby\_qty | 프로그램매매 순매수 수량 | string | Y | 18 |  |
| NaN | pvt\_scnd\_dmrs\_prc | 피벗 2차 디저항 가격 | string | Y | 10 |  |
| NaN | pvt\_frst\_dmrs\_prc | 피벗 1차 디저항 가격 | string | Y | 10 |  |
| NaN | pvt\_pont\_val | 피벗 포인트 값 | string | Y | 10 |  |
| NaN | pvt\_frst\_dmsp\_prc | 피벗 1차 디지지 가격 | string | Y | 10 |  |
| NaN | pvt\_scnd\_dmsp\_prc | 피벗 2차 디지지 가격 | string | Y | 10 |  |
| NaN | dmrs\_val | 디저항 값 | string | Y | 10 |  |
| NaN | dmsp\_val | 디지지 값 | string | Y | 10 |  |
| NaN | cpfn | 자본금 | string | Y | 22 |  |
| NaN | rstc\_wdth\_prc | 제한 폭 가격 | string | Y | 10 |  |
| NaN | stck\_fcam | 주식 액면가 | string | Y | 11 |  |
| NaN | stck\_sspr | 주식 대용가 | string | Y | 10 |  |
| NaN | aspr\_unit | 호가단위 | string | Y | 10 |  |
| NaN | hts\_deal\_qty\_unit\_val | HTS 매매 수량 단위 값 | string | Y | 10 |  |
| NaN | lstn\_stcn | 상장 주수 | string | Y | 18 |  |
| NaN | hts\_avls | HTS 시가총액 | string | Y | 18 |  |
| NaN | per | PER | string | Y | 82 |  |
| NaN | pbr | PBR | string | Y | 82 |  |
| NaN | stac\_month | 결산 월 | string | Y | 2 |  |
| NaN | vol\_tnrt | 거래량 회전율 | string | Y | 82 |  |
| NaN | eps | EPS | string | Y | 112 |  |
| NaN | bps | BPS | string | Y | 112 |  |
| NaN | d250\_hgpr | 250일 최고가 | string | Y | 10 |  |
| NaN | d250\_hgpr\_date | 250일 최고가 일자 | string | Y | 8 |  |
| NaN | d250\_hgpr\_vrss\_prpr\_rate | 250일 최고가 대비 현재가 비율 | string | Y | 84 |  |
| NaN | d250\_lwpr | 250일 최저가 | string | Y | 10 |  |
| NaN | d250\_lwpr\_date | 250일 최저가 일자 | string | Y | 8 |  |
| NaN | d250\_lwpr\_vrss\_prpr\_rate | 250일 최저가 대비 현재가 비율 | string | Y | 84 |  |
| NaN | stck\_dryy\_hgpr | 주식 연중 최고가 | string | Y | 10 |  |
| NaN | dryy\_hgpr\_vrss\_prpr\_rate | 연중 최고가 대비 현재가 비율 | string | Y | 84 |  |
| NaN | dryy\_hgpr\_date | 연중 최고가 일자 | string | Y | 8 |  |
| NaN | stck\_dryy\_lwpr | 주식 연중 최저가 | string | Y | 10 |  |
| NaN | dryy\_lwpr\_vrss\_prpr\_rate | 연중 최저가 대비 현재가 비율 | string | Y | 84 |  |
| NaN | dryy\_lwpr\_date | 연중 최저가 일자 | string | Y | 8 |  |
| NaN | w52\_hgpr | 52주일 최고가 | string | Y | 10 |  |
| NaN | w52\_hgpr\_vrss\_prpr\_ctrt | 52주일 최고가 대비 현재가 대비 | string | Y | 82 |  |
| NaN | w52\_hgpr\_date | 52주일 최고가 일자 | string | Y | 8 |  |
| NaN | w52\_lwpr | 52주일 최저가 | string | Y | 10 |  |
| NaN | w52\_lwpr\_vrss\_prpr\_ctrt | 52주일 최저가 대비 현재가 대비 | string | Y | 82 |  |
| NaN | w52\_lwpr\_date | 52주일 최저가 일자 | string | Y | 8 |  |
| NaN | whol\_loan\_rmnd\_rate | 전체 융자 잔고 비율 | string | Y | 84 |  |
| NaN | ssts\_yn | 공매도가능여부 | string | Y | 1 |  |
| NaN | stck\_shrn\_iscd | 주식 단축 종목코드 | string | Y | 9 |  |
| NaN | fcam\_cnnm | 액면가 통화명 | string | Y | 20 |  |
| NaN | cpfn\_cnnm | 자본금 통화명 | string | Y | 20 |  |
| NaN | apprch\_rate | 접근도 | string | Y | 112 |  |
| NaN | frgn\_hldn\_qty | 외국인 보유 수량 | string | Y | 18 |  |
| NaN | vi\_cls\_code | VI적용구분코드 | string | Y | 1 |  |
| NaN | ovtm\_vi\_cls\_code | 시간외단일가VI적용구분코드 | string | Y | 1 |  |
| NaN | last\_ssts\_cntg\_qty | 최종 공매도 체결 수량 | string | Y | 12 |  |
| NaN | invt\_caful\_yn | 투자유의여부 | string | Y | 1 |  |
| NaN | mrkt\_warn\_cls\_code | 시장경고코드 | string | Y | 2 |  |
| NaN | short\_over\_yn | 단기과열여부 | string | Y | 1 |  |
| NaN | sltr\_yn | 정리매매여부 | string | Y | 1 |  |
| NaN | mang\_issu\_cls\_code | 관리종목여부 | string | Y | 1 |  |
| Example | NaN | NaN | NaN | NaN | NaN | NaN |
| Request Example (Python) | {\r\n"fid\_cond\_mrkt\_div\_code": "J",\r\n"fid\_input\_iscd": "000660"\r\n}\r\n | NaN | NaN | NaN | NaN | NaN |
| Response Example | {\r\n  "output": {\r\n    "iscd\_stat\_cls\_code": "55",\r\n    "marg\_rate": "20.00",\r\n    "rprs\_mrkt\_kor\_name": "KOSPI200",\r\n    "bstp\_kor\_isnm": "전기.전자",\r\n    "temp\_stop\_yn": "N",\r\n    "oprc\_rang\_cont\_yn": "N",\r\n    "clpr\_rang\_cont\_yn": "N",\r\n    "crdt\_able\_yn": "Y",\r\n    "grmn\_rate\_cls\_code": "40",\r\n    "elw\_pblc\_yn": "Y",\r\n    "stck\_prpr": "128500",\r\n    "prdy\_vrss": "0",\r\n    "prdy\_vrss\_sign": "3",\r\n    "prdy\_ctrt": "0.00",\r\n    "acml\_tr\_pbmn": "344570137500",\r\n    "acml\_vol": "2669075",\r\n    "prdy\_vrss\_vol\_rate": "75.14",\r\n    "stck\_oprc": "128500",\r\n    "stck\_hgpr": "130000",\r\n    "stck\_lwpr": "128500",\r\n    "stck\_mxpr": "167000",\r\n    "stck\_llam": "90000",\r\n    "stck\_sdpr": "128500",\r\n    "wghn\_avrg\_stck\_prc": "129097.23",\r\n    "hts\_frgn\_ehrt": "49.48",\r\n    "frgn\_ntby\_qty": "0",\r\n    "pgtr\_ntby\_qty": "287715",\r\n    "pvt\_scnd\_dmrs\_prc": "131833",\r\n    "pvt\_frst\_dmrs\_prc": "130166",\r\n    "pvt\_pont\_val": "128333",\r\n    "pvt\_frst\_dmsp\_prc": "126666",\r\n    "pvt\_scnd\_dmsp\_prc": "124833",\r\n    "dmrs\_val": "129250",\r\n    "dmsp\_val": "125750",\r\n    "cpfn": "36577",\r\n    "rstc\_wdth\_prc": "38500",\r\n    "stck\_fcam": "5000",\r\n    "stck\_sspr": "97660",\r\n    "aspr\_unit": "500",\r\n    "hts\_deal\_qty\_unit\_val": "1",\r\n    "lstn\_stcn": "728002365",\r\n    "hts\_avls": "935483",\r\n    "per": "19.67",\r\n    "pbr": "1.72",\r\n    "stac\_month": "12",\r\n    "vol\_tnrt": "0.37",\r\n    "eps": "6532.00",\r\n    "bps": "74721.00",\r\n    "d250\_hgpr": "149500",\r\n    "d250\_hgpr\_date": "20210225",\r\n    "d250\_hgpr\_vrss\_prpr\_rate": "-14.05",\r\n    "d250\_lwpr": "90500",\r\n    "d250\_lwpr\_date": "20211013",\r\n    "d250\_lwpr\_vrss\_prpr\_rate": "41.99",\r\n    "stck\_dryy\_hgpr": "132500",\r\n    "dryy\_hgpr\_vrss\_prpr\_rate": "-3.02",\r\n    "dryy\_hgpr\_date": "20220103",\r\n    "stck\_dryy\_lwpr": "121500",\r\n    "dryy\_lwpr\_vrss\_prpr\_rate": "5.76",\r\n    "dryy\_lwpr\_date": "20220105",\r\n    "w52\_hgpr": "149500",\r\n    "w52\_hgpr\_vrss\_prpr\_ctrt": "-14.05",\r\n    "w52\_hgpr\_date": "20210225",\r\n    "w52\_lwpr": "90500",\r\n    "w52\_lwpr\_vrss\_prpr\_ctrt": "41.99",\r\n    "w52\_lwpr\_date": "20211013",\r\n    "whol\_loan\_rmnd\_rate": "0.22",\r\n    "ssts\_yn": "Y",\r\n    "stck\_shrn\_iscd": "000660",\r\n    "fcam\_cnnm": "5,000",\r\n    "cpfn\_cnnm": "36,576 억",\r\n    "frgn\_hldn\_qty": "360220601",\r\n    "vi\_cls\_code": "N",\r\n    "ovtm\_vi\_cls\_code": "N",\r\n    "last\_ssts\_cntg\_qty": "43916",\r\n    "invt\_caful\_yn": "N",\r\n    "mrkt\_warn\_cls\_code": "00",\r\n    "short\_over\_yn": "N",\r\n    "sltr\_yn": "N"\r\n  },\r\n  "rt\_cd": "0",\r\n  "msg\_cd": "MCA00000",\r\n  "msg1": "정상처리 되었습니다!"\r\n} | NaN | NaN | NaN | NaN | NaN |

# KR ETF 분배금 데이터 소스 리서치

## 조사일: 2026-03-20 (2026-03-21 추가 검증)

---

## 1. dis.kofia.or.kr (금융투자협회 펀드정보)

### 접근성: 외부 접근 불가

- **모든 요청이 WAF(Web Application Firewall)에 의해 차단됨**
- 메인 페이지(`/websquare/index.jsp`), XMLSERVLET API, 모든 스크린 ID (`UIFSD60200`, `UIFSD06030`, `UIFSD06020`) 전부 차단
- WebSquare 프레임워크 기반이라 일반적인 API 호출이 불가
- **결론: 서버 사이드 크롤링 소스로 사용 불가**

### KOFIA에서 제공하는 데이터 (브라우저 접속 시):
- ETF 분배금 내역 조회 (스크린 ID: UIFSD60200 추정)
- 펀드 표준코드, 분배금 기준일, 분배금 금액, 분배율 등

---

## 2. Yahoo Finance v8 Chart API (권장 소스)

### 접근성: 공개 API, 인증 불필요, KR ETF 지원

**엔드포인트:**
```
https://query1.finance.yahoo.com/v8/finance/chart/{ticker}.KS?interval=1d&range=5y&events=div
```

### 응답 형식:
```json
{
  "chart": {
    "result": [{
      "meta": { "currency": "KRW", "symbol": "069500.KS", "exchangeName": "KSC" },
      "events": {
        "dividends": {
          "1745884800": { "amount": 429.0, "date": 1745884800 },
          "1753833600": { "amount": 176.0, "date": 1753833600 }
        }
      }
    }]
  }
}
```

### 데이터 필드:
| 필드 | 설명 | 비고 |
|------|------|------|
| `amount` | 분배금 금액 (KRW) | 1주당 금액 |
| `date` | 분배락일 (ex-date) | Unix timestamp |

### 실측 데이터 (2026-03-21 재검증):

| ETF | 티커 | 3년간 건수 | 패턴 |
|-----|------|-----------|------|
| KODEX 200 | 069500.KS | 12건 | 분기별 (4월 최대) |
| TIGER 200 | 102110.KS | 12건 | 분기별 |
| KOSEF 단기자금 | 148070.KS | 3건 | 연간 (12월) |
| KODEX 미국S&P500TR | 379800.KS | 4건 | 분기별 |
| KODEX 미국배당+7%프리미엄 | 453810.KS | 11건 | 월간 |

- KODEX 200 예시: 2025-04-29: 429원, 2025-07-30: 176원, 2025-10-30: 140원, 2026-01-29: 80원

### 제한사항:
- `payDate` (지급일) 미제공 — `date`는 분배락일(ex-date)만
- `dividendYield` 미제공 (별도 계산 필요)
- `payoutRatio`, `faceValue` 미제공
- v10 quoteSummary는 401 Unauthorized (crumb 필요)

---

## 3. Naver Finance m.stock API

### ETF 관련 데이터 (부분적):
**엔드포인트:** `https://m.stock.naver.com/api/stock/{code}/integration`

```json
{
  "etfKeyIndicator": {
    "issuerName": "삼성자산운용(ETF)",
    "dividendYieldTtm": 0.95,
    "totalFee": 0.15,
    "nav": "86,850.98",
    "marketValue": "17조 6,136억",
    "returnRate1m": 2.8,
    "returnRate3m": 52.03,
    "returnRate1y": 149.78
  },
  "iconInfos": [{ "code": "isDividend", "value": "Y" }]
}
```

### 제한사항:
- **분배금 이력(history) API 없음** — 404 반환
- `dividendYieldTtm`만 제공 (TTM 배당수익률)
- 개별 분배금 내역 조회 불가
- `isDividend` 플래그로 분배금 지급 여부만 확인 가능

---

## 4. Naver WiseReport (navercomp.wisereport.co.kr)

- ETF 페이지 템플릿에 `${DIV_BASE_DT}` (분배금기준일) 필드 존재
- 하지만 AJAX API 호출 시 접속장애 에러 반환
- ETF 전용 cF4001, cF4002 페이지 모두 에러
- **결론: 현재 사용 불가**

---

## 5. KRX 정보데이터시스템 (data.krx.co.kr)

- OTP 기반 인증 필요 (`GenerateOTP/generate.cmd` → `getJsonData.cmd`)
- OTP 발급은 성공하나, 데이터 조회 시 HTML 에러 페이지 반환
- 세션/쿠키 기반 추가 인증이 필요한 것으로 추정
- ETF 분배금 BLD: `dbms/MDC/STAT/standard/MDCSTAT05901`
- **결론: 서버 사이드에서 안정적 사용 어려움**

---

## 6. Seibro 한국예탁결제원

- WebSquare 프레임워크 기반
- `callServletService.jsp` 엔드포인트 존재하나 `서버오류2` 반환
- ETF 분배금 페이지: `/IPORTAL/user/etf/BIP_CNTS06030V.xml`
- **결론: 복잡한 세션 관리 필요, 안정적 사용 어려움**

---

## 7. 기존 StockView 구현 현황

### 이미 구현된 것:
- `yahoo-events.ts`: `fetchYfDividends()` — Yahoo v8 chart API로 배당 이력 조회 (US 종목용)
- `naver-dividends.ts`: `fetchNaverDividends()` — Naver Finance 배당 페이지 스크래핑 (KR 일반주식용)
- Prisma `Dividend` 모델: `exDate`, `payDate`, `amount`, `currency`, `dividendYield`, `payoutRatio`, `faceValue`, `source`

### 매핑 (Yahoo → Dividend 모델):
| Yahoo 필드 | Dividend 모델 | 비고 |
|-----------|--------------|------|
| `date` (timestamp) | `exDate` | Unix → YYYY-MM-DD 변환 |
| `amount` | `amount` | 그대로 매핑 |
| `meta.currency` ("KRW") | `currency` | 그대로 매핑 |
| — | `payDate` | 미제공, null |
| — | `dividendYield` | 별도 계산 (amount / closePrice) |
| — | `payoutRatio` | ETF에는 해당 없음 |
| — | `faceValue` | ETF에는 해당 없음 (기준가 = NAV) |
| — | `source` | "yahoo" |

---

## 권장 구현 전략

### 1차: Yahoo Finance (즉시 가능)
- **기존 `yahoo-events.ts`의 `fetchYfDividends()`를 KR ETF에도 사용**
- 티커 형식: `{code}.KS` (코스피) 또는 `{code}.KQ` (코스닥)
- 5년치 분배금 이력 제공, 분기별 데이터 확인됨
- `dividendYieldTtm`은 Naver m.stock API에서 보충 가능

### 2차 (보강): Naver m.stock integration API
- `etfKeyIndicator.dividendYieldTtm`으로 현재 배당수익률 보충
- ETF 운용사, 보수율, NAV 등 추가 정보 획득 가능

### payDate 미제공 해결 방안:
- KR ETF 분배금 지급은 보통 분배락일(ex-date) + 3~5 영업일
- 룰 기반 추정 가능하나 정확하지 않음
- KOFIA/Seibro에서만 정확한 지급일 확인 가능 (브라우저 접근만 가능)

---

## 인증 및 Rate Limiting 요약

| 소스 | 인증 | Rate Limit | 안정성 |
|------|------|-----------|--------|
| Yahoo Finance v8 | 불필요 | ~2,000 req/hr (비공식) | 높음 |
| Naver m.stock | 불필요 | 미공개 (보수적 사용 권장) | 높음 |
| KOFIA | WAF 차단 | N/A | 사용 불가 |
| KRX | OTP + 세션 | N/A | 불안정 |
| Seibro | 세션 필요 | N/A | 불안정 |

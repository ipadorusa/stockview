# StockView 배포 가이드

## 1. Supabase 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. Project Settings → Database → Connection string (URI) 복사
3. `.env.local`의 `DATABASE_URL`에 붙여넣기
   ```
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

## 2. DB 마이그레이션 & 시딩

```bash
# Prisma 마이그레이션 실행
npx prisma migrate dev --name init

# 초기 데이터 시딩
npm run db:seed
```

## 3. Vercel 배포

1. [vercel.com](https://vercel.com) 에서 GitHub 저장소 연결
2. Environment Variables 설정:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Supabase connection string |
   | `AUTH_SECRET` | 랜덤 문자열 (`openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` |
   | `CRON_SECRET` | 랜덤 문자열 |
   | `KIS_APP_KEY` | 한국투자증권 API 키 |
   | `KIS_APP_SECRET` | 한국투자증권 API 시크릿 |
   | `ALPHA_VANTAGE_API_KEY` | Alpha Vantage API 키 |
   | `EXCHANGE_RATE_API_KEY` | 환율 API 키 |

3. Deploy 버튼 클릭

## 4. GitHub Actions Cron 설정

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. 다음 시크릿 추가:
   | Key | Value |
   |-----|-------|
   | `APP_URL` | `https://your-app.vercel.app` |
   | `CRON_SECRET` | Vercel에 설정한 것과 동일한 값 |

## 5. 한국투자증권 API 신청

1. [apiportal.koreainvestment.com](https://apiportal.koreainvestment.com) 접속
2. 회원가입 후 앱 등록
3. APP KEY, APP SECRET 발급

## 6. 로컬 개발

```bash
# 의존성 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# 개발 서버 실행
npm run dev
```

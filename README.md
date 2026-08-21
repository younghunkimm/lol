# 롤 딜량 내기 기록장

React/Vite로 만든 내기 기록장입니다. Supabase 환경변수가 없으면 브라우저 localStorage에 저장하고, 환경변수가 있으면 Supabase를 원격 저장소로 사용합니다.

## 실행

```bash
npm install
npm run dev
```

## Supabase 설정

1. Supabase 프로젝트를 만들고 SQL Editor에서 `supabase/schema.sql`을 실행합니다.
2. `.env.example`을 참고해 `.env.local`을 만듭니다.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

3. 개발 서버를 재시작합니다.

```bash
npm run dev
```

이 설정은 로그인 없는 공용 기록장 기준입니다. anon key로 읽기/쓰기/삭제가 가능하므로, 링크를 아는 사람이 같은 데이터를 공유합니다.

## 검증

```bash
npm run lint
npm run build
```

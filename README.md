# 롤 딜량 내기 기록장

React/Vite로 만든 내기 기록장입니다. 데이터는 Supabase Edge Function을 통해 Supabase DB에 저장합니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서는 Supabase DB를 직접 호출하지 않습니다. 공통 비밀번호로 `auth` Edge Function에서 JWT를 발급받고, 이후 요청은 `friends` Edge Function을 통해 처리됩니다.

프론트엔드 환경변수는 Edge Function 호출 주소를 만들기 위한 `VITE_SUPABASE_URL`만 필요합니다.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
```

`VITE_SUPABASE_PUBLISHABLE_KEY`는 브라우저에서 Supabase SDK를 사용하지 않으므로 필요하지 않습니다.

## 검증

```bash
npm run lint
npm run build
```

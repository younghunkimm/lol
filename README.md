# 롤 딜량 내기 기록장

React/Vite로 만든 내기 기록장입니다. 데이터는 Supabase Edge Function을 통해 Supabase DB에 저장합니다.

## 실행

```bash
npm install
npm run dev
```

공통 비밀번호는 `auth` Edge Function에서만 검증합니다. 인증에 성공하면 Edge Function이 Supabase Auth 세션을 발급하고, 이후 브라우저는 Supabase DB를 직접 호출합니다.

프론트엔드에는 Supabase URL과 publishable key가 필요합니다. publishable key는 공개 키이며, 데이터 접근 권한은 Supabase Auth JWT와 RLS 정책이 제어합니다.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

`auth` Edge Function에는 다음 secrets가 필요합니다.

```bash
PASSWORD=사용자가 입력할 공통 비밀번호
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
APP_AUTH_EMAIL=Supabase Auth에 생성한 앱 전용 사용자 이메일
APP_AUTH_PASSWORD=앱 전용 사용자 비밀번호
```

`APP_AUTH_EMAIL`/`APP_AUTH_PASSWORD` 계정은 Supabase Auth에 미리 생성하고 이메일 확인이 완료되어 있어야 합니다. `SUPABASE_SERVICE_ROLE_KEY`는 이 구조에서 프론트엔드와 인증 Edge Function 모두에 필요하지 않습니다.

## 검증

```bash
npm run lint
npm run build
```

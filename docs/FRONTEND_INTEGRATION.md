# 프런트엔드 연동 및 스타일 가이드

## 라우팅과 도메인 경계

| 경로                        | 화면                | 구현                                              |
| --------------------------- | ------------------- | ------------------------------------------------- |
| `/`                         | 랜딩                | `src/features/home/HomePage.tsx`                  |
| `/reservations`             | 예약 가능 객실 조회 | `src/features/reservation/ReservationPage.tsx`    |
| `/reservations/confirm`     | 예약 확인·생성      | `src/features/reservation/ConfirmationPage.tsx`   |
| `/my-reservations`          | 내 예약 목록        | `src/features/reservation/MyReservationsPage.tsx` |
| `/my-reservations/:resv_id` | 예약 상세·취소      | `src/features/reservation/MyReservationsPage.tsx` |
| `/login`                    | 로그인              | `src/features/auth/LoginPage.tsx`                 |
| `/signup`                   | 회원가입            | `src/features/auth/SignupPage.tsx`                |

인증 화면의 요청별 뷰 설계·검증 규칙·에러 매핑은 [`AUTH_VIEWS.md`](./AUTH_VIEWS.md)에 정리했습니다. 인증 API 계약과 세션 정책은 `src/features/auth`에 모여 있으며, access token은 `Authorization: Bearer` 헤더로만 전달합니다.

예약 API 계약과 타입은 `src/features/reservation/api.ts`, `types.ts`에 둡니다. 화면은 `room_id`만 전송하며, 물리 객실 ID·회원 ID·상태·가격은 생성 요청에 포함하지 않습니다.

## Tailwind CSS v4

Vite는 `@tailwindcss/vite` 플러그인으로 Tailwind v4를 로드합니다. 전역 진입점 `src/index.css`의 `@theme`은 Figma `MSDS / Foundations` 프레임을 반영한 공통 토큰의 단일 원천입니다. 토큰명에는 `msds` 접두사를 붙이지 않습니다.

- 폰트: `font-display`(Cormorant Garamond), `font-sans`(Noto Sans KR)
- 원색: `ivory-50|100|200`, `navy-900|800|700`, `gold-500|300`, `ink-700|500`, `mist-200`, `sage-200`
- 의미 색상: `bg-canvas`, `bg-surface`, `bg-subtle`, `bg-inverse`, `bg-accent`, `text-primary`, `text-secondary`, `text-muted`, `text-accent`, `border-border-subtle`, `border-border-accent`
- 타이포그래피 크기: `text-display-hero`, `text-display-section`, `text-heading-1|2|3`, `text-body-large|medium|small`, `text-label`
- 간격: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `section`, `page-margin` (예: `gap-lg`, `px-page-margin`)
- 형태·그림자: `rounded-sm|md|lg|full`, `shadow-floating`, `shadow-card`
- 상태 색상: `text-error`, `border-error-border`

`shadow-floating`은 예약 위젯 등 떠 있는 요소에, `shadow-card`는 일반 카드에 사용합니다. 버튼과 입력 필드의 키보드 포커스는 전역 base 레이어에서 `outline-accent`로 통일합니다.

새 UI는 먼저 해당 유틸리티를 JSX의 `className`에 조합합니다. `index.css`에는 전역 컴포넌트 선택자를 두지 않고 토큰과 base 보정만 둡니다. 반복되는 시각 규칙만 기능 전용 CSS 또는 `@layer`로 최소화합니다. base 레이어는 접근 가능한 포커스 링과 브라우저 기본 여백만 안전하게 보정하므로, Tailwind preflight로 인한 폼 컨트롤 회귀를 줄입니다.

## 백엔드 연동

개발 서버는 `/api` 요청을 `VITE_API_PROXY_TARGET`(기본 `http://localhost:8080`)의 Spring 서버로 프록시하므로, 브라우저에서는 같은 오리진으로 보이고 별도 CORS 설정이 필요 없습니다. API 오리진이 다른 환경에서는 `VITE_API_BASE_URL`로 호출 주소를 직접 지정합니다.

## 개발 도구 모드

`VITE_DEV_MODE=true`인 개발 환경에서만 DEV 도구와 `/__dev/components` 경로가 표시됩니다. DEV 도구는 제품 토큰과 분리된 다크 툴링 스타일을 `src/dev/dev.css`에 유지하며, 이 전용 파일도 `@reference '../index.css'`와 `@apply`로 Tailwind 유틸리티를 사용합니다. 배포 빌드에는 DEV 라우트와 패널이 등록되지 않습니다.

## 확인 명령

```sh
npm run format:check
npm run lint
npm run build
```

# 프런트엔드 연동 및 스타일 가이드

## 라우팅과 도메인 경계

| 경로                        | 화면                | 구현                                              |
| --------------------------- | ------------------- | ------------------------------------------------- |
| `/`                         | 랜딩                | `src/features/home/HomePage.tsx`                  |
| `/reservations`             | 예약 가능 객실 조회 | `src/features/reservation/ReservationPage.tsx`    |
| `/reservations/confirm`     | 예약 확인·생성      | `src/features/reservation/ConfirmationPage.tsx`   |
| `/my-reservations`          | 내 예약 목록        | `src/features/reservation/MyReservationsPage.tsx` |
| `/my-reservations/:resv_id` | 예약 상세·취소      | `src/features/reservation/MyReservationsPage.tsx` |

예약 API 계약과 타입은 `src/features/reservation/api.ts`, `types.ts`에 둡니다. 화면은 `room_id`만 전송하며, 물리 객실 ID·회원 ID·상태·가격은 생성 요청에 포함하지 않습니다.

## Tailwind CSS v4

Vite는 `@tailwindcss/vite` 플러그인으로 Tailwind v4를 로드합니다. 전역 진입점 `src/index.css`의 `@theme`이 MSDS 공통 토큰의 단일 원천입니다.

- 폰트: `font-display`, `font-sans`
- 브랜드: `bg-msds-navy`, `text-msds-gold`, `border-msds-border`
- 표면·문구: `bg-msds-canvas`, `bg-msds-surface`, `text-msds-muted`, `text-msds-copy`
- 상태: `text-msds-error`, `border-msds-error-border`
- 형태: `rounded-msds`, `rounded-panel`, `shadow-panel`

새 UI는 먼저 해당 유틸리티를 JSX의 `className`에 조합합니다. `index.css`에는 전역 컴포넌트 선택자를 두지 않고 토큰과 base 보정만 둡니다. 반복되는 시각 규칙만 기능 전용 CSS 또는 `@layer`로 최소화합니다. base 레이어는 접근 가능한 포커스 링과 브라우저 기본 여백만 안전하게 보정하므로, Tailwind preflight로 인한 폼 컨트롤 회귀를 줄입니다.

## 개발 도구 모드

`VITE_DEV_MODE=true`인 개발 환경에서만 DEV 도구와 `/__dev/components` 경로가 표시됩니다. DEV 도구는 제품 토큰과 분리된 다크 툴링 스타일을 `src/dev/dev.css`에 유지하며, 이 전용 파일도 `@reference '../index.css'`와 `@apply`로 Tailwind 유틸리티를 사용합니다. 배포 빌드에는 DEV 라우트와 패널이 등록되지 않습니다.

## 확인 명령

```sh
npm run format:check
npm run lint
npm run build
```

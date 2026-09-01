# 프런트엔드 연결 안내

## 라우트

| 경로 | 담당 기능 | 진입점 |
| --- | --- | --- |
| `/` | 랜딩 페이지 | `src/features/home/HomePage.tsx` |
| `/reservations` | 예약 가능 객실 조회 | `src/features/reservation/ReservationPage.tsx` |
| `/my-reservations` | 내 예약 목록 | `src/features/reservation/MyReservationsPage.tsx` |
| `/my-reservations/:resv_id` | 내 예약 상세·취소 | `src/features/reservation/MyReservationsPage.tsx` |

## 팀 작업 경계

- 예약 API 계약과 오류 처리는 `src/features/reservation/api.ts` 및 `types.ts`에 둡니다.
- 예약 생성 확인 화면은 `/reservations/confirm` 라우트를 사용하고, 검색 결과의 `room_id`, 날짜, 인원만 전달합니다. 개별 객실 ID나 객실 번호를 입력 폼에 추가하지 않습니다.
- 프로그램, 웰니스, 소개 화면은 각각 `src/features/program`, `src/features/wellness`, `src/features/about`에 독립적으로 추가합니다.
- 공통 헤더·푸터는 `src/components/AppLayout.tsx`, 공통 토큰과 반응형 규칙은 `src/index.css`에서 관리합니다.

## 개발 도구 모드

- `npm run dev`는 `.env.development`의 `VITE_DEV_MODE=true`로 개발 도구를 켭니다.
- 우측 `DEV MODE` 패널에서 화면 경로와 API 시나리오를 선택합니다. 시나리오 변경 후 해당 화면의 조회·확정·취소 동작을 실행합니다.
- `/__dev/components`는 개발 환경에서만 존재하는 공통 컴포넌트 갤러리입니다.
- 배포 환경에서는 `import.meta.env.DEV` 조건 때문에 도구 패널과 개발 라우트가 등록되지 않습니다.
- 실제 API를 확인할 때는 시나리오를 `실제 API 사용`으로 되돌립니다.

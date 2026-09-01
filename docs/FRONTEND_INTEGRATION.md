# Frontend Integration Guide

## 공용 UI 폴더

재사용 가능한 표현 컴포넌트는 `src/components/ui`에 둡니다. 기능별 API 호출, 예약 상태 전이, 예약 상세 카드처럼 도메인 맥락이 필요한 코드는 `src/features`에 유지합니다. 이 분리는 `common`보다 `ui`가 담는 범위를 명확히 표현합니다. 컴포넌트의 치수·상태·공식 소셜 에셋은 Figma Design System 노드에서 확인해 반영했습니다.

| 컴포넌트                             | 용도                                         | 주요 props                                           | 현재 적용 위치           |
| ------------------------------------ | -------------------------------------------- | ---------------------------------------------------- | ------------------------ |
| `Header`                             | 글로벌 헤더와 주 메뉴                        | 없음                                                 | `AppLayout`              |
| `Logo`                               | 심볼 포함 로고/워드마크                      | `inverse`, `compact`                                 | Header, Footer           |
| `NavItem`                            | 활성 상태를 표시하는 메뉴 항목               | `label`, `to`                                        | Header                   |
| `Footer`                             | 글로벌 푸터                                  | 없음                                                 | `AppLayout`              |
| `SocialIcons`                        | 소셜 아이콘 묶음                             | 없음                                                 | Footer                   |
| `Button`                             | 버튼의 일관된 상태/크기/변형                 | `variant`, `size`, 표준 button props                 | 홈, 예약 조회, 예약 확인 |
| `FormField` / `TextInput` / `Select` | 일반 폼 라벨과 입력 요소                     | 표준 input/select props, `error`                     | 후속 일반 폼             |
| `BookingField`                       | 예약 검색 필드 레이아웃                      | `label`, `as`                                        | 홈 즉시 예약, 예약 검색  |
| `StatusBadge`                        | 예약 가능·마감 및 예약 상태 표기             | `available` 또는 `status`                            | 예약 가능 객실 카드      |
| `RoomMediaCard`                      | 이미지, 객실 유형, 설명, 상세/행동 영역 카드 | `name`, `description`, `imageUrl`, `badge`, `footer` | 예약 가능 객실 목록      |

## 로고 에셋

`src/assets/ui`의 로고 관련 에셋은 아래 4개 SVG만 유지합니다.

| 파일                     | 용도                       | 색상      |
| ------------------------ | -------------------------- | --------- |
| `primary-logo-light.svg` | 밝은 배경용 Primary Logo   | `#0E2239` |
| `primary-logo-dark.svg`  | 어두운 배경용 Primary Logo | `#FBFAF7` |
| `wordmark-light.svg`     | 밝은 배경용 워드마크       | `#0E2239` |
| `wordmark-dark.svg`      | 어두운 배경용 워드마크     | `#FBFAF7` |

워드마크는 Figma의 래스터 소스에서 자동 트레이싱해 SVG path로 만들었습니다. Primary Logo는 Figma의 벡터 마크·구분선·대시, 새 워드마크 SVG, 태그라인 텍스트를 조합한 투명 배경 SVG입니다.

## 사용 원칙

- API 응답의 `snake_case` 필드는 `features/*/types.ts`와 API 경계에 유지합니다. UI 컴포넌트는 API 타입이나 요청을 직접 알지 않습니다.
- `RoomMediaCard`에는 객실 유형(`room_id`)만 표시합니다. 실제 객실 번호 또는 `room_units_id` 선택 UI를 추가하지 않습니다.
- 예약 취소/생성처럼 도메인 제약이 있는 흐름은 공용 버튼만 사용하고, 검증·서버 오류 처리·리프레시는 예약 feature에서 처리합니다.
- 새 화면에서는 클래스 문자열을 복사하기보다 먼저 `Button`, 입력 필드, 상태 배지와 카드 조합으로 해결할 수 있는지 확인합니다.

## 라우팅과 인증

| 경로                        | 화면                | 구현                                              |
| --------------------------- | ------------------- | ------------------------------------------------- |
| `/`                         | 랜딩                | `src/features/home/HomePage.tsx`                  |
| `/rooms`                    | 객실 목록           | `src/features/rooms/RoomsPage.tsx`                |
| `/rooms/:roomId`            | 객실 상세           | `src/features/rooms/RoomDetailPage.tsx`           |
| `/reservations`             | 예약 가능 객실 조회 | `src/features/reservation/ReservationPage.tsx`    |
| `/reservations/confirm`     | 예약 확인·생성      | `src/features/reservation/ConfirmationPage.tsx`   |
| `/my-reservations`          | 내 예약 목록        | `src/features/reservation/MyReservationsPage.tsx` |
| `/my-reservations/:resv_id` | 예약 상세·취소      | `src/features/reservation/MyReservationsPage.tsx` |
| `/login`                    | 로그인              | `src/features/auth/LoginPage.tsx`                 |
| `/signup`                   | 회원가입            | `src/features/auth/SignupPage.tsx`                |
| `/mypage`                   | 마이페이지          | `src/features/account/MyPage.tsx`                 |
| `/mypage/edit`              | 정보 수정           | `src/features/account/ProfileEditPage.tsx`        |
| `/mypage/delete`            | 회원 탈퇴           | `src/features/account/AccountDeletePage.tsx`      |
| `/inquiries`                | 내 문의 목록        | `src/features/inquiry/InquiryListPage.tsx`        |
| `/inquiries/new`            | 문의 작성           | `src/features/inquiry/InquiryNewPage.tsx`         |
| `/inquiries/:inquiryId`     | 문의 상세           | `src/features/inquiry/InquiryDetailPage.tsx`      |

회원 화면(로그인·회원가입·마이페이지·문의)의 요청별 뷰 설계·검증 규칙·에러 매핑은 [`AUTH_VIEWS.md`](./AUTH_VIEWS.md)에 정리했습니다. 로그인이 필요한 경로는 `features/auth/RequireAuth`로 감싸며, 헤더(`components/ui/Header`)는 세션을 구독해 로그인 사용자 이름과 로그아웃을 노출합니다.

## 백엔드 연동

HTTP 호출은 `src/lib/apiClient.ts`의 axios 인스턴스 두 개로 통일합니다.

- `publicApiClient` — 인증이 필요 없는 API(회원가입·로그인·객실 조회 등)
- `authApiClient` — 인증이 필요한 API. 요청마다 `lib/authToken`의 access token을 `Authorization: Bearer`로 붙이고, 401 응답이면 토큰을 지운 뒤 `msds-auth-expired` 이벤트를 알립니다.

응답 해석은 `src/lib/apiError.ts`가 담당합니다. 공통 규격 `ApiResponse(code, message, data)`를 벗기고, 실패는 상태 코드·에러 코드·필드별 메시지를 담은 `ApiError`로 통일합니다. 400 `INVALID_INPUT` 메시지는 필드별로 잘라 각 입력 아래에 표시합니다.

토큰은 `lib/authToken`(`msds.access_token`) 한 곳에만 보관하고, 화면 표시용 회원 정보는 `features/auth/session`이 함께 관리합니다.

개발 서버는 `/api` 요청을 `VITE_API_PROXY_TARGET`(기본 `http://localhost:8080`)의 Spring 서버로 프록시합니다. `API_BASE_URL`을 비워 두면 axios가 상대 경로 `/api`로 호출해 이 프록시를 타므로 별도 CORS 설정이 필요 없습니다. 다른 오리진의 API를 직접 호출해야 할 때만 `.env`의 `API_BASE_URL`을 지정합니다.

## 헤더 정보 구조

`HOME · ROOMS · RESERVATION · PROGRAM · WELLNESS · ABOUT`을 사용합니다. `ROOMS`는 예약 가능 객실 검색(`/reservations`), `RESERVATION`은 내 예약(`/my-reservations`)으로 연결됩니다. 데스크톱 헤더는 3열 그리드로 구성해 로고는 좌측, 메뉴는 화면 중앙, 로그인 버튼은 우측에 고정합니다. 로그인 전에도 보호된 경로가 인증 흐름으로 전환하도록 기존 라우팅 정책을 유지합니다.

## 개발 도구 모드

`VITE_DEV_MODE=true`인 개발 환경에서만 DEV 도구와 `/__dev/components`, `/__dev/login` 경로가 표시됩니다. DEV 도구는 제품 토큰과 분리된 다크 툴링 스타일을 `src/dev/dev.css`에 유지합니다. 배포 빌드에는 DEV 라우트와 패널이 등록되지 않습니다.

## 확인 명령

```sh
npm run format:check
npm run lint
npm run build
```

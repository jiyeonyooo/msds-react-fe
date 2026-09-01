# Frontend Integration Guide

## 공용 UI 폴더

재사용 가능한 표현 컴포넌트는 `src/components/ui`에 둡니다. 기능별 API 호출, 예약 상태 전이, 예약 상세 카드처럼 도메인 맥락이 필요한 코드는 `src/features`에 유지합니다. 이 분리는 `common`보다 `ui`가 담는 범위를 명확히 표현합니다. 컴포넌트의 치수·상태·공식 로고 및 소셜 에셋은 Figma Design System 노드에서 확인해 반영했습니다.

| 컴포넌트 | 용도 | 주요 props | 현재 적용 위치 |
| --- | --- | --- | --- |
| `Header` | 글로벌 헤더와 주 메뉴 | 없음 | `AppLayout` |
| `Logo` | 심볼 포함 로고/워드마크 | `inverse`, `compact` | Header, Footer |
| `NavItem` | 활성 상태를 표시하는 메뉴 항목 | `label`, `to` | Header |
| `Footer` | 글로벌 푸터 | 없음 | `AppLayout` |
| `SocialIcons` | 소셜 아이콘 묶음 | 없음 | Footer |
| `Button` | 버튼의 일관된 상태/크기/변형 | `variant`, `size`, 표준 button props | 홈, 예약 조회, 예약 확인 |
| `FormField` / `TextInput` / `Select` | 일반 폼 라벨과 입력 요소 | 표준 input/select props, `error` | 후속 일반 폼 |
| `BookingField` | 예약 검색 필드 레이아웃 | `label`, `as` | 홈 즉시 예약, 예약 검색 |
| `StatusBadge` | 예약 가능·마감 및 예약 상태 표기 | `available` 또는 `status` | 예약 가능 객실 카드 |
| `RoomMediaCard` | 이미지, 객실 유형, 설명, 상세/행동 영역 카드 | `name`, `description`, `imageUrl`, `badge`, `footer` | 예약 가능 객실 목록 |

## 사용 원칙

- API 응답의 `snake_case` 필드는 `features/*/types.ts`와 API 경계에 유지합니다. UI 컴포넌트는 API 타입이나 요청을 직접 알지 않습니다.
- `RoomMediaCard`에는 객실 유형(`room_id`)만 표시합니다. 실제 객실 번호 또는 `room_units_id` 선택 UI를 추가하지 않습니다.
- 예약 취소/생성처럼 도메인 제약이 있는 흐름은 공용 버튼만 사용하고, 검증·서버 오류 처리·리프레시는 예약 feature에서 처리합니다.
- 새 화면에서는 클래스 문자열을 복사하기보다 먼저 `Button`, 입력 필드, 상태 배지와 카드 조합으로 해결할 수 있는지 확인합니다.

## 헤더 정보 구조

`HOME · ROOMS · RESERVATION · PROGRAM · WELLNESS · ABOUT`을 사용합니다. `ROOMS`는 예약 가능 객실 검색(`/reservations`), `RESERVATION`은 내 예약(`/my-reservations`)으로 연결됩니다. 로그인 전에도 보호된 경로가 인증 흐름으로 전환하도록 기존 라우팅 정책을 유지합니다.

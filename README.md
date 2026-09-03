# MSDS Frontend

> Meditate. Slow Down. Stay.

MSDS 게스트하우스의 객실·예약·명상 프로그램·웰니스 서비스를 제공하는 React 웹 애플리케이션입니다. 일반 회원 화면과 운영자용 관리 화면을 하나의 프론트엔드에서 제공합니다.

## 주요 기능

- 객실 및 부대시설 조회, 숙박 가능 여부 검색과 예약
- 명상 프로그램 조회·신청·취소 및 후기 관리
- 회원가입, 로그인, 프로필·예약·문의 관리
- 웰니스 체크, 결과·이력 조회, 조용한 공간 추천
- 회원·예약·객실·시설·프로그램·문의·웰니스 관리자 화면
- 개발용 API 성공·빈 상태·오류 시나리오 전환 도구

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| UI | React 19, TypeScript 6 |
| 빌드 | Vite 8 |
| 스타일 | Tailwind CSS 4 |
| 라우팅 | React Router 7 |
| HTTP | Axios |
| 모션 | GSAP |
| 품질 관리 | ESLint, Prettier |

## 시작하기

### 사전 준비

- Node.js `20.19+` 또는 `22.12+`
- npm
- 실제 API를 사용할 경우 로컬에서 실행 중인 [MSDS Backend](https://github.com/jiyeonyooo/meditation)

### 설치 및 실행

```bash
npm ci
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

### 환경변수

로컬 설정 파일을 만듭니다.

```powershell
Copy-Item .env.example .env.development
```

macOS/Linux에서는 다음 명령을 사용합니다.

```bash
cp .env.example .env.development
```

| 변수 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `VITE_API_PROXY_TARGET` | 아니요 | `http://localhost:8080` | 개발 서버가 `/api`, `/meditation`, `/uploads` 요청을 전달할 백엔드 주소 |
| `VITE_API_BASE_URL` | 아니요 | 빈 값 | 배포 시 API가 다른 오리진에 있을 때 사용하는 주소 |
| `VITE_DEV_MODE` | 아니요 | `false` | `true`이면 개발 도구와 API 시나리오 전환 UI 활성화 |

일반적인 로컬 개발 설정은 다음과 같습니다.

```dotenv
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_API_BASE_URL=
VITE_DEV_MODE=true
```

`VITE_API_BASE_URL`을 비워 두면 Axios가 상대 경로 `/api`를 사용하며, Vite 프록시를 통해 백엔드와 통신합니다. 환경변수 파일에는 비밀값을 넣지 말고 `.env.example`만 Git에 커밋합니다.

## 백엔드와 함께 실행하기

1. 백엔드를 `http://localhost:8080`에서 실행합니다.
2. 이 프로젝트에서 `npm run dev`를 실행합니다.
3. 브라우저에서 `http://localhost:5173`에 접속합니다.

프록시 대상이 다른 경우 `VITE_API_PROXY_TARGET`만 변경합니다. 배포 환경에서 프론트엔드와 API의 오리진이 다를 때는 `VITE_API_BASE_URL`을 API 서버 주소로 설정하고 백엔드 CORS 설정도 함께 확인해야 합니다.

## 주요 화면

| 경로 | 설명 | 접근 |
| --- | --- | --- |
| `/` | 랜딩 페이지 | 공개 |
| `/rooms`, `/rooms/:roomId` | 객실 목록·상세 | 공개 |
| `/reservations` | 예약 가능 객실 검색 | 공개 |
| `/programs`, `/programs/:programId` | 명상 프로그램 목록·상세 | 공개 |
| `/wellness` | 웰니스와 조용한 공간 탐색 | 공개 |
| `/login`, `/signup` | 로그인·회원가입 | 공개 |
| `/my-reservations`, `/my-programs` | 내 예약·프로그램 | 회원 |
| `/mypage/*`, `/inquiries/*` | 계정과 문의 관리 | 회원 |
| `/admin/*` | 통합 운영자 화면 | 관리자 |
| `/__dev/components` | 공용 컴포넌트 갤러리 | 개발 모드 |

## 프로젝트 구조

```text
src/
├── assets/          # 이미지와 SVG 리소스
├── components/      # 레이아웃과 공용 UI 컴포넌트
├── dev/             # 개발 도구와 API 시나리오
├── features/        # 도메인별 화면·API·타입
├── lib/             # API 클라이언트, 인증 토큰, 공용 유틸리티
├── mocks/           # 개발용 목 데이터
├── App.tsx          # 애플리케이션 라우팅
└── main.tsx         # 진입점
```

`features`는 `auth`, `rooms`, `reservation`, `program`, `wellness`, `inquiry`, `account`, `admin` 등의 도메인 단위로 구성됩니다. 표현 전용 컴포넌트는 `src/components/ui`에 두고, API 호출과 업무 규칙은 각 `features` 내부에 둡니다.

## 인증과 API

- 공개 API는 `publicApiClient`, 인증 API는 `authApiClient`를 사용합니다.
- 로그인 응답의 access token은 `msds.access_token` 키로 브라우저 저장소에 보관됩니다.
- 인증 요청에는 `Authorization: Bearer <token>` 헤더가 자동으로 추가됩니다.
- API가 `401`을 반환하면 로컬 세션을 정리하고 인증 만료 이벤트를 전달합니다.
- 공통 응답 형식은 `{ code, message, data }`입니다.

자세한 연동 규칙과 API 명세는 아래 문서를 참고하세요.

- [프론트엔드 연동 가이드](docs/FRONTEND_INTEGRATION.md)
- [인증 화면 가이드](docs/AUTH_VIEWS.md)
- [전체 API 명세](docs/api_spec_full.md)
- [랜딩 페이지 구현 계획](docs/landing/LANDING_PAGE_PLAN.md)

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | Vite 개발 서버 실행 |
| `npm run build` | 타입 검사 후 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier로 파일 정리 |
| `npm run format:check` | Prettier 형식 검사 |

변경 사항을 제출하기 전 다음 명령을 권장합니다.

```bash
npm run format:check
npm run lint
npm run build
```

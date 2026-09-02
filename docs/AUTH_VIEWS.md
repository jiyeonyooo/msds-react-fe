# 회원 화면 설계 (로그인 · 회원가입 · 마이페이지 · 문의)

관리자 화면은 이번 범위에서 제외했습니다. 화면 구성은 Figma의 `Login`, `Member Sign Up`, `My Page`,
`Profile Edit`, `Account Delete` 프레임을 기준으로 합니다.

## 1. 라우트와 파일

| 경로                    | 화면            | 구현                                            | 인증   |
| ----------------------- | --------------- | ----------------------------------------------- | ------ |
| `/login`                | 로그인          | `src/features/auth/LoginPage.tsx`               | 불필요 |
| `/signup`               | 회원가입        | `src/features/auth/SignupPage.tsx`              | 불필요 |
| `/mypage`               | 마이페이지      | `src/features/account/MyPage.tsx`               | 필요   |
| `/mypage/edit`          | 정보 수정       | `src/features/account/ProfileEditPage.tsx`      | 필요   |
| `/mypage/delete`        | 회원 탈퇴       | `src/features/account/AccountDeletePage.tsx`    | 필요   |
| `/inquiries`            | 내 문의 목록    | `src/features/inquiry/InquiryListPage.tsx`      | 필요   |
| `/inquiries/new`        | 문의 작성       | `src/features/inquiry/InquiryNewPage.tsx`       | 필요   |
| `/inquiries/:inquiryId` | 문의 상세       | `src/features/inquiry/InquiryDetailPage.tsx`    | 필요   |

인증이 필요한 경로는 `features/auth/RequireAuth`로 감싸며, 비로그인 상태면 현재 경로를
`return_path`로 남기고 `/login`으로 보냅니다.

| 파일                                 | 역할                                                              |
| ------------------------------------ | ----------------------------------------------------------------- |
| `src/lib/apiClient.ts`               | 공용 axios 인스턴스(`publicApiClient`, `authApiClient`)             |
| `src/lib/apiError.ts`                | ApiResponse 해석, `ApiError` 변환, 400 메시지의 필드 분해           |
| `features/auth/session.ts`           | access token·회원 정보 보관, 로그인 후 복귀 경로                    |
| `features/auth/useSession.ts`        | 세션 구독 훅(헤더·화면이 같은 상태를 본다)                          |
| `features/auth/validation.ts`        | 서버 Bean Validation과 같은 기준의 입력 검증                        |
| `features/auth/AuthLayout.tsx`       | 로그인·회원가입의 좌우 2단(브랜드 스토리 + 폼 카드) 레이아웃         |
| `features/account/AccountLayout.tsx` | 마이페이지 계열이 공유하는 히어로 + 계정 사이드바                    |
| `components/ui/PasswordInput.tsx`    | 비밀번호 표시/숨김 전환 입력                                        |

## 2. 요청별 뷰 설계

### 2.1 회원가입 — `POST /api/auth/signup`

요청 `{ name, email, phoneNumber, password }` · 응답 `201 { email }`
(비밀번호 확인은 화면 전용 필드라 요청 바디에 넣지 않습니다.)

| 상태      | 화면                                                              |
| --------- | ----------------------------------------------------------------- |
| 입력      | 이름 / 이메일 / 전화번호 / 비밀번호 / 비밀번호 확인 + 필수 약관 동의 |
| 제출 중   | 버튼 문구 `가입 중…`, 버튼 비활성화                                |
| 성공(201) | "가입 완료" 카드 + 생성된 이메일 + `로그인하러 가기`               |
| 실패      | 3절 매핑에 따라 필드 아래 또는 폼 하단                             |

성공 후에는 `/login?email=<가입한 이메일>`로 이동해 이메일이 채워진 상태로 로그인합니다.

### 2.2 로그인 — `POST /api/auth/login` → `GET /api/users/me`

요청 `{ email, password }` · 응답 `200 { accessToken }`

| 상태      | 화면                                                                    |
| --------- | ----------------------------------------------------------------------- |
| 입력      | 이메일 / 비밀번호, 이메일 기억하기, 비밀번호 찾기(준비 중 안내)          |
| 제출 중   | 버튼 문구 `로그인 중…`, 버튼 비활성화                                    |
| 성공(200) | 토큰 보관 → `/api/users/me`로 회원 정보 확인 → **홈(또는 복귀 경로)로 이동** |
| 실패(401) | 폼 상단 `이메일 또는 비밀번호가 일치하지 않습니다.`                      |

이미 로그인한 상태로 `/login`에 들어오면 홈으로 돌려보냅니다. `이메일 기억하기`는 이메일만
`localStorage`에 저장하며 비밀번호는 저장하지 않습니다.

### 2.3 마이페이지 — `GET /api/users/me`

히어로에는 이니셜 아바타·권한 배지·이름·이메일·가입일 카드를, 본문에는 이름/이메일/전화번호/
권한/가입일/최근 수정 6개 항목과 `정보 수정`·`회원 탈퇴` 버튼, 예약·문의·정보 수정으로 가는
바로가기 카드 3장을 둡니다.

### 2.4 정보 수정 — `PATCH /api/users/me`

요청 `{ name, phoneNumber }`. 이메일은 로그인 아이디라 서버가 수정 대상으로 받지 않으므로
읽기 전용(READ ONLY 배지)으로 보여 줍니다. 저장에 성공하면 세션의 회원 정보를 다시 불러와
헤더 표시까지 갱신한 뒤 마이페이지로 돌아갑니다.

### 2.5 회원 탈퇴 — `DELETE /api/users/me`

요청 `{ password }`. 경고 박스 → 현재 비밀번호 → 동의 체크를 모두 통과해야 요청을 보냅니다.
성공하면 세션을 비우고 홈으로 이동하며, 비밀번호가 다르면 400 `PASSWORD_MISMATCH`를
비밀번호 필드 아래에 표시합니다.

### 2.6 문의 — `POST /api/inquiries`, `GET /api/inquiries`, `GET /api/inquiries/{id}`

- 작성: 제목(100자 이내)·내용 → 성공 시 생성된 문의 상세로 이동
- 목록: 상태 배지(`WAITING`/`ANSWERED`) · 제목 · 작성일, 비어 있으면 안내 문구
- 상세: 본문과 답변 영역. `answerContent`가 없으면 "아직 답변이 등록되지 않았습니다."

### 2.7 로그아웃 — `POST /api/auth/logout`

헤더의 `LOGOUT`과 마이페이지 하단에서 호출합니다. 서버가 상태를 저장하지 않으므로 호출
결과와 관계없이 클라이언트 토큰을 지우면 로그아웃이 끝납니다.

## 3. 에러 → 화면 매핑

| HTTP | code                  | 화면 처리                                         |
| ---- | --------------------- | ------------------------------------------------- |
| 400  | `INVALID_INPUT`       | 메시지(`필드명: 사유`)를 잘라 해당 필드 아래 표시  |
| 400  | `PASSWORD_MISMATCH`   | 탈퇴 화면의 비밀번호 필드 아래                     |
| 401  | `INVALID_CREDENTIALS` | 폼 상단 공통 안내(어느 쪽이 틀렸는지 구분하지 않음) |
| 401  | `AUTH_UNAUTHORIZED`   | 인증이 필요한 화면은 로그인 화면으로 이동          |
| 403  | `INQUIRY_FORBIDDEN`   | 문의 상세 상단에 서버 메시지                      |
| 409  | `DUPLICATE_EMAIL`     | 이메일 필드 아래 `이미 가입된 이메일입니다.`      |
| —    | `NETWORK_ERROR`       | `API 서버에 연결할 수 없습니다…` (백엔드 미기동)   |

서버는 검증 실패를 `"email: 올바른 이메일 형식이 아닙니다., password: 비밀번호는 필수 입력값입니다."`
한 문장으로 내려 줍니다. `lib/apiError.ts`의 `parseFieldErrors`가 필드명 기준으로 나눠 각 입력
아래에 붙입니다.

## 4. 입력 검증 규칙

제출 전 프런트에서 먼저 확인하고, 최종 판단은 서버 응답을 따릅니다. 검증 시점은 **포커스가
빠질 때**와 **제출할 때**이며, 이미 에러가 떠 있는 필드만 타이핑 중에 다시 검사합니다.

| 필드                | 프런트 규칙                   | 서버 제약                           |
| ------------------- | ----------------------------- | ----------------------------------- |
| `email`             | 필수, 이메일 형식             | `@NotBlank @Email`                  |
| `password`(로그인)  | 필수                          | `@NotBlank`                         |
| `password`(가입)    | 필수, 8자 이상, 영문+숫자 포함 | `@NotBlank` (길이 정책은 화면 기준) |
| `passwordConfirm`   | 비밀번호와 일치                | 화면 전용 필드                      |
| `name`              | 필수, 50자 이내               | `@NotBlank`, `users.name` 길이 50   |
| `phoneNumber`       | 필수, `010-1234-5678` 형식    | `@Pattern(^\d{3}-\d{3,4}-\d{4}$)`   |
| 약관 동의(가입)     | 필수 체크                     | 화면 전용                           |
| `title`(문의)       | 필수, 100자 이내              | `@NotBlank @Size(max = 100)`        |
| `content`(문의)     | 필수                          | `@NotBlank`                         |

전화번호는 숫자만 입력해도 하이픈이 자동으로 붙습니다. 이메일은 앞뒤 공백을 제거해 보내며,
서버가 소문자로 정규화해 저장·조회합니다.

## 5. 세션 정책

- 백엔드는 refresh token 없이 access token(JWT, 기본 2시간)만 발급합니다.
- 토큰은 공용 모듈 `lib/authToken`(`localStorage['msds.access_token']`)에만 보관하고, 화면 표시용 회원 정보는 `msds.auth.user`에 함께 둡니다.
- 인증이 필요한 요청은 `authApiClient`가 `Authorization: Bearer <token>` 헤더를 자동으로 붙이며, 401이면 토큰을 비우고 `msds-auth-expired` 이벤트를 알립니다.
- 헤더(`components/ui/Header`)는 세션이 있으면 이름과 `MY PAGE`, `LOGOUT`을, 없으면 `LOGIN`을 보여 줍니다.
- 개발 모드에서는 로그인/로그아웃 시 DEV 도구의 인증 상태(`guest`/`member`)도 함께 맞춥니다.

## 6. 백엔드 연결

Vite dev 서버가 `/api` 요청을 Spring 서버로 프록시하므로 브라우저에서는 같은 오리진처럼 보이고,
별도 CORS 설정이 필요 없습니다.

```
브라우저 → http://localhost:5173/api/auth/login → (vite proxy) → http://localhost:8080/api/auth/login
```

프록시 대상은 `.env.development`의 `VITE_API_PROXY_TARGET`으로 바꿉니다. `API_BASE_URL`을 비워 두면
axios가 상대 경로 `/api`로 호출해 이 프록시를 타고, 다른 오리진을 직접 호출해야 할 때만
`.env`의 `API_BASE_URL`을 지정합니다(서버 쪽 CORS 허용 필요).

## 7. 손으로 확인하는 시나리오

| #   | 입력                                  | 기대 결과                                        |
| --- | ------------------------------------- | ------------------------------------------------ |
| 1   | 빈 값으로 가입 제출                   | 필드별 필수 안내 + `필수 약관에 동의해 주세요.`   |
| 2   | 전화번호에 `01012345678`              | `010-1234-5678`로 자동 정리                      |
| 3   | 가입 비밀번호 `1234`                  | `비밀번호는 8자 이상이어야 합니다.`              |
| 3-1 | 비밀번호와 확인값을 다르게 입력       | `비밀번호가 일치하지 않습니다.`                  |
| 4   | 정상 값으로 가입                      | 201 → 완료 카드 → 로그인 화면에 이메일 채워짐    |
| 5   | 같은 이메일로 다시 가입               | 409 → 이메일 필드에 `이미 가입된 이메일입니다.`  |
| 6   | 비밀번호를 틀리게 로그인              | 401 → 폼 상단 공통 안내                          |
| 7   | 제대로 로그인                         | 200 → **홈 화면**, 헤더에 이름과 `LOGOUT`         |
| 8   | 마이페이지 진입                       | 서버에서 받은 회원 정보 6개 항목 표시            |
| 9   | 이름·전화번호 수정 후 저장            | 200 → 마이페이지에 변경 값 반영                  |
| 10  | 문의 작성                             | 201 → 상세 화면, 상태 `WAITING`                  |
| 11  | 탈퇴에서 비밀번호를 틀리게 입력       | 400 → `비밀번호가 일치하지 않습니다.`            |
| 12  | 로그아웃 후 `/mypage` 접근            | 로그인 화면으로 이동                             |
| 13  | 백엔드를 끄고 로그인 시도             | `API 서버에 연결할 수 없습니다…`                 |

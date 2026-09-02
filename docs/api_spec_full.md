# 게스트하우스 통합 API 명세서

## Auth

| Endpoint | Method | 기능 | 상태 | 요청/응답 및 비고 |
|---|---|---|---|---|
| `/auth/signup` | POST | 회원가입 | 완료 | Request body / Response body 아래 참고 |
| `/auth/login` | POST | 로그인(token 발급) | 완료 | Request body / Response body 아래 참고 |
| `/auth/logout` | POST | 로그아웃 | 시작 전 |  |
| `/auth/refresh` | POST | 토큰 재발급 | 시작 전 | 필요한가? |

### POST `/auth/signup`

**Request body**

```json
{
  "email": "guest@example.com",
  "password": "Password123!",
  "name": "홍길동",
  "phoneNumber": "010-1234-5678"
}
```

**Response body**

```json
{
  "userId": 1,
  "email": "guest@example.com",
  "message": "회원가입이 완료되었습니다."
}
```

### POST `/auth/login`

**Request body**

```json
{
  "email": "guest@example.com",
  "password": "Password123!"
}
```

**Response body (200 OK)**

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

---

## Users

| Endpoint | Method | 기능 | 상태 | 요청/응답 및 비고 |
|---|---|---|---|---|
| `/users/me` | GET | 내 정보 조회 | 시작 전 | 아래 참고 |
| `/users/me` | PATCH | 내 정보 수정 | 시작 전 |  |
| `/users/me` | DELETE | 회원 탈퇴 | 시작 전 |  |

### GET `/users/me`

**Request body**

```json
{
  "userId": 1,
  "email": "guest@example.com",
  "name": "홍길동",
  "phoneNumber": "010-1234-5678"
}
```

---

## Admin

| Endpoint | Method | 기능 | 상태 | 비고 |
|---|---|---|---|---|
| `/admin/inquiries` |  |  | 시작 전 | 필요한가? |
| `/admin/inquiries/{}/answers` |  |  | 시작 전 | 필요한가? |

---

## Meditation

| Endpoint | 권한 | Method | 기능 | 상태 | 비고 |
|---|---|---|---|---|---|
| `/meditation/program` | 비회원, 회원 | GET | 명상 프로그램 조회 | 완료 | 명상 프로그램 목록 조회 가능 / 예약 및 후기 볼 수 있음 |
| `/meditation/programs/{program_name}/{number}` | 회원 | POST | 명상 프로그램 별 예약 현황 확인 및 예약 | 완료 | `POST /programs/{programId}/reservations` |
| `/meditation/review` | 회원 | GET | 명상 프로그램 후기 검색/조회 | 완료 | `GET /reviews` / 비회원 접근 시 로그인 창으로 우회 |
| `/meditation/review/{userid}/create/{review}` | 회원 | POST | 명상 프로그램 후기 작성 | 완료 | `POST /programs/{programId}/reviews` |
| `/meditation/review/{userid}/delete/{number}` | 회원 | DELETE | 명상 프로그램 후기 삭제 | 완료 | `DELETE /reviews/{reviewId}` |
| `/meditation/admin` | 관리자 | GET | 명상 프로그램 조회 | 완료 | `GET /admin/programs/{programId}` / 프로그램 정보 수정창으로 이동 가능 |
| `/meditation/admin/create/{program_name}/{picture}/{capacity}/{remain}` | 관리자 | POST | 명상 프로그램 추가 | 완료 |  |
| `/meditation/admin/delete/{program_name}` | 관리자 | DELETE | 명상 프로그램 삭제 | 완료 |  |
| `/meditation/admin/adjust/{program_name}/{picture}/{capacity}/{remain}` | 관리자 | PATCH | 명상 프로그램 수정 | 완료 |  |

### GET `/meditation/program`

```json
{
  "data": {
    "content": [
      {
        "programId": 1,
        "title": "명상 프로그램 이름",
        "thumbnailImagePath": "프로그램 사진 주소",
        "location": "명상실 A",
        "startDateTime": "2025-09-01T06:00:00",
        "endDateTime": "2025-09-01T07:00:00",
        "capacity": 10,
        "reservedCount": 7,
        "status": "모집중"
      }
    ]
  }
}
```

### POST `/meditation/programs/{program_name}/{number}`

명상 프로그램 별 예약 여부 확인 및 예약 가능
비회원 접근 시 로그인 창으로 우회

**Request body**

```json
{
  "participantCount": 1
}
```

**201**

```json
{
  "code": "OK",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "reservationId": 101,
    "programId": 1,
    "memberId": 55,
    "participantCount": 1,
    "status": "예약완료",
    "reservedAt": "2025-08-20T09:12:00"
  }
}
```

**409**

```json
{
  "code": "PROGRAM_FULL",
  "message": "정원이 초과되었습니다."
}
```

**409**

```json
{
  "code": "ALREADY_RESERVED",
  "message": "이미 예약한 프로그램입니다."
}
```

**400**

```json
{
  "code": "PROGRAM_CLOSED",
  "message": "모집이 종료된 프로그램입니다."
}
```

**401**

```json
{
  "code": "AUTH_UNAUTHORIZED",
  "message": "인증이 필요합니다."
}
```

### POST `/meditation/review/{userid}/create/{review}`

```json
{
  "rating": 5,
  "content": "마음이 편안해지는 시간이었어요."
}
```

---

## Rooms / Facilities

| Endpoint | 권한 | Method | 기능 | 상태 | 비고 |
|---|---|---|---|---|---|
| `/rooms` | 비회원, 회원 | GET | 객실 목록 조회 | 완료 | 커서 방식 페이지네이션 적용 |
| `/rooms/{roomId}` | 비회원, 회원 | POST | 객실 상세 조회 | 완료 |  |
| `/facilities` | 비회원, 회원 | GET | 편의시설 조회 | 시작 전 |  |
| `/admin/rooms` | 관리자 | POST | 객실 등록 | 시작 전 |  |
| `/admin/rooms/{roomId}` | 관리자 | PATCH | 객실 상세 정보 수정 | 시작 전 |  |
| `/admin/rooms/{roomId}` | 관리자 | DELETE | 객실 삭제 | 시작 전 |  |
| `/admin/facilities` | 관리자 | PATCH | 편의시설 등록 | 시작 전 |  |

---

## Wellness

| Endpoint | 권한 | Method | 기능 | 상태 |
|---|---|---|---|---|
| `/wellness/questions` | 비회원, 회원 | GET | 마음상태 설문 문항 조회 | 완료 |
| `/wellness/checks` | 비회원, 회원 | POST | 마음상태 설문 제출 및 결과 계산 | 완료 |
| `/wellness/checks/{checkId}` | 비회원, 회원 | GET | 마음상태 검사 결과 상세 조회 | 완료 |
| `/wellness/records` | 회원 | GET | 내 마음상태 기록 목록 조회 | 완료 |
| `/wellness/trends` | 회원 | GET | 숙박 중 마음상태 변화 조회 | 완료 |
| `/admin/wellness/statistics` | 관리자 | GET | 숙박객 마음상태 통계 조회 | 시작 전 |

### GET `/wellness/questions`

**Header**

```text
Authorization: Bearer {accessToken}
```

**Path Parameter**

없음

**Query Parameter**

없음

**Request Body**

없음

**200 OK**

```json
{
  "code": "OK",
  "message": "마음상태 설문 문항 조회에 성공했습니다.",
  "data": {
    "surveyId": 1,
    "title": "오늘의 마음상태 체크",
    "questions": [
      {
        "questionId": 1,
        "content": "현재 마음이 편안하다고 느끼나요?",
        "answerType": "SCALE",
        "displayOrder": 1,
        "options": [
          {
            "value": 1,
            "label": "전혀 그렇지 않다"
          },
          {
            "value": 2,
            "label": "그렇지 않다"
          },
          {
            "value": 3,
            "label": "보통이다"
          },
          {
            "value": 4,
            "label": "그렇다"
          },
          {
            "value": 5,
            "label": "매우 그렇다"
          }
        ]
      }
    ]
  }
}
```

---

## Quietness

| Endpoint | 권한 | Method | 기능 | 상태 |
|---|---|---|---|---|
| `/guesthouses/{guesthouseId}/quietness` | 비회원, 회원 | GET | 숙소 종합 조용함 지수 조회 | 완료 |
| `/guesthouses/{guesthouseId}/spaces/quietness` | 비회원, 회원 | GET | 공간별 조용함 지수 조회 | 완료 |
| `/guesthouses/{guesthouseId}/quietness/history` | 비회원, 회원 | GET | 시간대별 조용함 조회 | 시작 전 |
| `/guesthouses/{guesthouseId}/quietest-space` | 비회원, 회원 | GET | 가장 조용한 공간 추천 | 시작 전 |
| `/admin/noise-devices` | 관리자 | GET | 조용함 측정 기기 조회 | 시작 전 |
| `/admin/noise-devices` | 관리자 | POST | 조용함 측정 기기 등록 | 시작 전 |
| `/admin/quietness/spaces` | 관리자 | GET | 관리자 공간별 조용함 현황 | 시작 전 |
| `/admin/quietness/thresholds` | 관리자 | PATCH | 조용함 단계 기준 수정 | 시작 전 |

---

# Reservation

## 사용자 예약 API

| Endpoint | Method | 기능 | 요청 필드 |
|---|---|---|---|
| `/resv` | GET | 예약 가능 조회 | `checkInDate`, `checkOutDate`, `guestCount` |
| `/resv` | POST | 예약 생성 | `roomId`, `checkInDate`, `checkOutDate`, `guestCount`, `quantity` |
| `/resv/me` | GET | 내 예약 조회 | `resvStatus`, `pageNum`, `pageSize` |
| `/resv/{resvId}` | GET | 예약 상세 조회 | `resvId` |
| `/resv/{resvId}/cancel` | PATCH | 사용자 예약 취소 | `resvId` |

### GET `/resv`

**Query Parameter**

- `checkInDate`
- `checkOutDate`
- `guestCount`

### POST `/resv`

**Request Body**

```json
{
  "roomId": 1,
  "checkInDate": "2026-09-10",
  "checkOutDate": "2026-09-12",
  "guestCount": 2,
  "quantity": 1
}
```

### GET `/resv/me`

**Query Parameter**

- `resvStatus`
- `pageNum`
- `pageSize`

### GET `/resv/{resvId}`

**Path Parameter**

- `resvId`

### PATCH `/resv/{resvId}/cancel`

**Path Parameter**

- `resvId`

---

## 관리자 예약 API

| Endpoint | Method | 기능 | 요청 필드 |
|---|---|---|---|
| `/admin/resv` | GET | 관리자 예약 목록 조회/검색/필터 | `resvStatus`, `searchFromDate`, `searchToDate`, `keyword`, `pageNum`, `pageSize` |
| `/admin/resv/{resvId}` | GET | 관리자 예약 상세 조회 | `resvId` |
| `/admin/resv/{resvId}/status` | PATCH | 관리자 예약 취소/상태 변경 | `resvId` |

### GET `/admin/resv`

**Query Parameter**

- `resvStatus`
- `searchFromDate`
- `searchToDate`
- `keyword`
- `pageNum`
- `pageSize`

### GET `/admin/resv/{resvId}`

**Path Parameter**

- `resvId`

### PATCH `/admin/resv/{resvId}/status`

**Path Parameter**

- `resvId`

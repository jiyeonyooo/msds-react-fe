# MSDS API 명세

> 기준: 2026-09-02 코드베이스의 Controller, DTO, Security 설정
>
> 이 문서는 현재 구현된 모든 HTTP 엔드포인트를 한곳에 정리한 문서다. 예약 API의 상세 업무 규칙과 필드 표는 [resv/api-spec.md](./resv/api-spec.md)가 우선한다.

## 공통 규칙

- 기본 API는 `/api` 접두사를 사용한다. 단, 명상 프로그램 API는 현재 구현상 `/meditation`으로 시작한다.
- `ApiResponse`를 쓰는 API의 본문은 `{ "code", "message", "data" }` 형식이다. 성공 `code`는 HTTP 상태명(예: `OK`, `CREATED`)이다.
- `Authorization: Bearer <accessToken>`이 필요한 API는 아래 표에서 **회원** 또는 **관리자**로 표시한다. 관리자 API는 `ROLE_ADMIN`이 필요하다.
- 별도 표기가 없는 시간은 ISO-8601 `LocalDateTime`, 날짜는 `yyyy-MM-dd` `LocalDate` 형식이다.
- `ApiResponse`를 사용하지 않는 명상 프로그램 API는 배열 또는 빈 본문을 직접 반환한다.

### 공통 오류

일반 검증/파싱 오류는 대체로 `400 BAD_REQUEST`, 인증 실패는 `401`, 권한 부족은 `403`, 찾을 수 없는 자원은 서비스가 발생시키는 `404`를 반환한다. 일반 오류의 공통 형식은 다음과 같다.

```json
{ "code": "BAD_REQUEST", "message": "오류 설명", "data": null }
```

예약 API는 별도 오류 코드와 `422 VALIDATION_FAILED` 형식을 사용하므로 [예약 원본 명세](./resv/api-spec.md)를 따른다.

## 엔드포인트 요약

| 도메인 | 메서드 | 경로 | 인증 | 성공 |
| --- | --- | --- | --- | --- |
| 인증 | POST | `/api/auth/signup` | 공개 | 201 |
| 인증 | POST | `/api/auth/login` | 공개 | 200 |
| 인증 | POST | `/api/auth/logout` | 공개 | 200 |
| 사용자 | GET/PATCH/DELETE | `/api/users/me` | 회원 | 200 |
| 객실 | GET | `/api/rooms`, `/api/rooms/{roomId}` | 공개 | 200 |
| 시설 | GET | `/api/facilities` | 공개 | 200 |
| 객실·시설 관리 | POST/PATCH | `/api/admin/rooms...`, `/api/admin/facilities...` | 관리자 | 201/200 |
| 예약 | GET/POST/PATCH | `/api/resv...` | 일부 공개 | 200/201 |
| 예약 관리 | GET/PATCH | `/api/admin/resv...` | 관리자 | 200 |
| 문의 | GET/POST | `/api/inquiries...` | 회원 | 200/201 |
| 문의 관리 | GET/PATCH | `/api/admin/inquiries...` | 관리자 | 200 |
| 웰니스 | GET/POST | `/api/wellness...` | 일부 공개 | 200 |
| 정숙도 | GET | `/api/quietness...` | 공개 | 200 |
| 정숙도 관리 | GET/POST/PATCH | `/api/admin/quietness...` | 관리자 | 200 |
| 명상 프로그램 | GET/POST/DELETE | `/meditation...` | 회원* | 200/201/204 |

`*` 명상 프로그램 컨트롤러는 현재 `userId` 쿼리 파라미터를 받으며, Security 설정상 인증도 필요하다.

## 인증 및 사용자

### `POST /api/auth/signup`

회원 가입. 요청: `email`(string, 필수, 이메일), `password`(string, 필수), `name`(string, 필수), `phoneNumber`(string, 필수, `000-0000-0000` 형식).  
응답 `201`: `data = { email: string }`.

### `POST /api/auth/login`

로그인. 요청: `email`(string, 필수, 이메일), `password`(string, 필수).  
응답 `200`: `data = { accessToken: string }`.

### `POST /api/auth/logout`

로그아웃. `Authorization` 헤더는 선택 사항이며 본문은 없다.  
응답 `200`: `data = null`.

### `GET /api/users/me`

내 프로필 조회. 응답 `200`의 `data`:

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| userId | number | 사용자 ID |
| email, name, phoneNumber, role | string | 회원 정보 |
| createdAt, updatedAt | datetime | `yyyy-MM-dd HH:mm:ss` |

### `PATCH /api/users/me`

내 프로필 부분 수정. 요청: `name`(string, 선택), `phoneNumber`(string, 선택, 전화번호 형식).  
응답 `200`: `userId`, `email`, `name`, `phoneNumber`, `updatedAt` (`yyyy-MM-dd HH:mm:ss`).

### `DELETE /api/users/me`

회원 탈퇴. 요청: `password`(string, 필수). 응답 `200`: `data = null`.

## 객실 및 시설

### `GET /api/rooms`

객실 목록. 응답 `200`: `data`는 `RoomSummary[]`.

`RoomSummary`: `roomId:number`, `name:string`, `description:string`, `mainImageUrl:string|null`, `roomType:STAY|REST|MEDITATE|RETREAT`, `standardGuests:number`, `maxGuests:number`, `areaM2:decimal|null`, `basePrice:number`.

### `GET /api/rooms/{roomId}`

객실 상세. 경로 변수 `roomId:number`. 응답 `200`: `data`는 다음 `RoomDetail`.

```text
roomId, name, description, roomType, status, basePrice
capacity: { standardGuests, maxGuests }
roomSpecs: { areaM2, bedType, bedCount, viewType }
images: [{ imageId, imageUrl, imageType, sortOrder }]
equipmentGroups: [{ category, categoryName, equipments: [{ equipmentId, name, quantity, note, iconUrl }] }]
```

`status`: `AVAILABLE|SOLDOUT|INAVAILABLE`; `bedType`: `SINGLE|DOUBLE|QUEEN|KING|TWIN`; `viewType`: `CITY|OCEAN|MOUNTAIN|GARDEN|RIVER|NONE`; 장비 `category`: `ELECTRONICS|FURNITURE|BATHROOM|BEDDING|KITCHEN|CONVENIENCE|WELLNESS`.

### `GET /api/facilities?category={category}`

시설 목록. `category`는 선택이며 `WELLNESS|LEISURE|FOOD|BUSINESS|CONVENIENCE|PARKING|ACCESSIBILITY|ETC`.  
응답 `200`: `data = FacilitySummary[]`; 항목은 `facilityId`, `name`, `category`, `description`, `imageUrl`이다.

### 관리자 객실·시설

| 메서드/경로 | 요청 본문 | 응답 |
| --- | --- | --- |
| POST `/api/admin/rooms` | `RoomCreate` | 201 `RoomDetail` |
| PATCH `/api/admin/rooms/{roomId}` | `RoomUpdate` | 200 `RoomDetail` |
| POST `/api/admin/facilities` | `FacilityCreate` | 201 `FacilityDetail` |
| PATCH `/api/admin/facilities/{facilityId}` | `FacilityUpdate` | 200 `FacilityDetail` |

- `RoomCreate` 필수: `name`(1~100), `description`, `roomType`, `status`, `minGuest`(1 이상), `maxGuest`(1 이상·`minGuest` 이상), `area`(0 초과), `basePrice`(0 이상).
- `RoomUpdate`: 위 필드를 모두 선택으로 받으며, 적어도 한 필드는 필요하다. `minGuest`와 `maxGuest`를 동시에 부분 수정할 때의 상호 범위 검증은 구현되어 있지 않다.
- `FacilityCreate`: `name`(필수, 최대 100), `category`(필수), `description`(최대 255), `imageUrl`(최대 512), `active`(boolean).
- `FacilityUpdate`: 위 모든 필드 선택, 최소 하나 필요. `name`은 공백만 허용하지 않는다.
- `FacilityDetail`: `FacilitySummary` 필드에 `active:boolean`, `createdAt:datetime`, `updatedAt:datetime`를 추가한다.

## 예약

예약의 URL, 인증, 요청/응답 필드와 오류는 [예약 API 명세](./resv/api-spec.md)를 기준으로 한다. 핵심 라우트는 아래와 같다.

| 메서드 | 경로 | 인증 | 용도 |
| --- | --- | --- | --- |
| GET | `/api/resv` | 공개 | 객실 타입별 예약 가능 여부 |
| POST | `/api/resv` | 회원 | 예약 생성 |
| GET | `/api/resv/me` | 회원 | 내 예약 목록 |
| GET | `/api/resv/{resvId}` | 회원 | 내 예약 상세 |
| PATCH | `/api/resv/{resvId}/cancel` | 회원 | 내 예약 취소 |
| GET | `/api/admin/resv` | 관리자 | 전체 예약 검색 |
| GET | `/api/admin/resv/{resvId}` | 관리자 | 예약 상세 |
| PATCH | `/api/admin/resv/{resvId}/status` | 관리자 | 예약 취소 |

예약 JSON은 `snake_case`다. 특히 생성 요청의 `room_id`는 `rooms.id`이며, `member_id`는 인증 정보에서 얻고 `price_per_night`, `total_price`, `nights`, `remaining_count`, `available`은 서버 계산 값이다.

## 문의

### `POST /api/inquiries`

문의 등록. 요청: `title`(string, 필수, 최대 100), `content`(string, 필수).  
응답 `201`: `Inquiry`.

### `GET /api/inquiries`, `GET /api/inquiries/{inquiryId}`

내 문의 목록 또는 상세. 응답 `200`: `Inquiry[]` 또는 `Inquiry`.

### `GET /api/admin/inquiries?status={status}`

관리자 문의 목록. `status`는 선택: `WAITING|ANSWERED`. 응답 `200`: `Inquiry[]`.

### `PATCH /api/admin/inquiries/{inquiryId}/answer`

관리자 답변 등록. 요청: `answerContent`(string, 필수). 응답 `200`: `Inquiry`.

`Inquiry` 필드: `inquiryId:number`, `authorEmail:string`, `title:string`, `content:string`, `status:WAITING|ANSWERED`, `answerContent:string|null`, `answeredAt:datetime|null`, `createdAt:datetime`, `updatedAt:datetime`. 시간 형식은 `yyyy-MM-dd HH:mm:ss`이다.

## 웰니스

### `GET /api/wellness/questions`

공개 문항 목록. 응답 `200`: `WellnessQuestion[]`.

`WellnessQuestion`: `questionId:number`, `category:STRESS|TENSION|FATIGUE|REST|MOOD|FOCUS|OVERALL`, `content:string`, `displayOrder:number`, `options:[{ value:number, label:string }]`.

### 검사 생성

| 메서드/경로 | 인증 | 저장 | 응답 |
| --- | --- | --- | --- |
| POST `/api/wellness/guest/checks` | 공개 | 아니오 | `WellnessCheckResult` |
| POST `/api/wellness/checks` | 회원 | 예 | `WellnessCheckResult` |

공통 요청 본문:

```json
{
  "reservationId": 1,
  "stayStage": "GENERAL",
  "answers": [{ "questionId": 1, "value": 0 }]
}
```

- `answers`는 비어 있을 수 없고, 각 `questionId`와 `value`는 필수이며 `value` 범위는 0~4다.
- `reservationId`와 `stayStage`는 선택이며, `stayStage` 기본값은 `GENERAL`이다. 값: `GENERAL|BEFORE_STAY|DURING_STAY|AFTER_STAY`.
- `WellnessCheckResult`: `checkId:number|null`, `totalScore:number`, `level:VERY_RELAXED|RELAXED|NORMAL|TIRED|VERY_TIRED`, `levelLabel:string`, `message:string`, `saved:boolean`.

### 내 검사 결과

| 메서드 | 경로 | 응답 `data` |
| --- | --- | --- |
| GET | `/api/wellness/checks/me` | `WellnessHistory[]` |
| GET | `/api/wellness/checks/me/{checkId}` | `WellnessCheckDetail` |
| GET | `/api/wellness/trends/me` | `WellnessTrendPoint[]` |

- `WellnessHistory`: `checkId`, `totalScore`, `level`, `stayStage`, `checkedAt`.
- `WellnessTrendPoint`: `checkId`, `totalScore`, `level`, `checkedAt`.
- `WellnessCheckDetail`: `checkId`, `reservationId`, `totalScore`, `level`, `levelLabel`, `message`, `stayStage`, `checkedAt`, `answers`.
- 상세 `answers` 항목: `questionId`, `category`, `content`, `answerValue`, `convertedValue`.

## 정숙도

### 공개 조회

| 메서드 | 경로 | 요청 | 응답 `data` |
| --- | --- | --- | --- |
| GET | `/api/quietness/guesthouses/{guesthouseId}/spaces/{spaceId}` | 경로 ID | `SpaceQuietness` |
| GET | `/api/quietness/guesthouses/{guesthouseId}/summary` | 경로 ID | `GuesthouseQuietnessSummary` |
| GET | `/api/quietness/guesthouses/{guesthouseId}/spaces` | 경로 ID | `SpaceQuietness[]` |
| GET | `/api/quietness/guesthouses/{guesthouseId}/recommendation` | 경로 ID (회원 인증 필요) | `QuietSpaceRecommendation` |
| GET | `/api/quietness/spaces/{spaceId}/history` | `from`, `to`(필수 ISO datetime) | `QuietnessHistoryPoint[]` |
| GET | `/api/quietness/guesthouses/{guesthouseId}/spaces/{spaceId}/hourly` | `from`, `to`(필수 ISO datetime) | `HourlyQuietness[]` |

- `SpaceQuietness`: `spaceId`, `spaceName`, `spaceType`, `decibel`, `level`, `measuredAt`.
- `GuesthouseQuietnessSummary`: `guesthouseId`, `averageDecibel`, `level`, `measuredSpaceCount`, `latestMeasuredAt`.
- `QuietSpaceRecommendation`: `guesthouseId`, `spaceId`, `spaceName`, `spaceType`, `decibel`, `level`, `measuredAt`.
- `QuietnessHistoryPoint`: `decibel`, `measuredAt`.
- `HourlyQuietness`: `hourStart`, `averageDecibel`, `minimumDecibel`, `maximumDecibel`, `level`, `sampleCount`.
- `spaceType`: `ROOM|LOUNGE|MEDITATION_ROOM|COMMON_AREA|FACILITY|OTHER`; `level`: `VERY_QUIET|QUIET|NORMAL|LOUD|VERY_LOUD|UNKNOWN`.

### 관리자 등록·관리

| 메서드/경로 | 요청 본문 | 응답 `data` |
| --- | --- | --- |
| GET `/api/admin/quietness/guesthouses/{guesthouseId}/spaces` | 없음 | `QuietSpace[]` |
| POST `/api/admin/quietness/spaces` | `QuietSpaceCreate` | `QuietSpace` |
| GET `/api/admin/quietness/guesthouses/{guesthouseId}/devices` | 없음 | `NoiseDevice[]` |
| POST `/api/admin/quietness/devices` | `NoiseDeviceCreate` | `NoiseDevice` |
| PATCH `/api/admin/quietness/devices/{deviceId}/status` | `NoiseDeviceStatusUpdate` | `NoiseDevice` |
| POST `/api/admin/quietness/measurements` | `NoiseMeasurementCreate` | `NoiseMeasurement` |

- `QuietSpaceCreate`: `guesthouseId`(필수), `name`(필수, 최대 100), `type`(필수 `spaceType`).
- `NoiseDeviceCreate`: `guesthouseId`, `spaceId`, `deviceName`, `serialNumber`(모두 필수, 문자열은 최대 100), `modelName`(선택, 최대 100).
- `NoiseDeviceStatusUpdate`: `status`(필수 `ACTIVE|INACTIVE|DISCONNECTED`).
- `NoiseMeasurementCreate`: `deviceId`(필수), `decibel`(필수, 0 이상), `measuredAt`(선택; 미입력 시 서버 현재 시간).
- `QuietSpace`: `spaceId`, `guesthouseId`, `name`, `type`, `active`.
- `NoiseDevice`: `deviceId`, `guesthouseId`, `spaceId`, `deviceName`, `serialNumber`, `modelName`, `status`, `installedAt`, `lastConnectedAt`.
- `NoiseMeasurement`: `measurementId`, `deviceId`, `guesthouseId`, `spaceId`, `decibel`, `measuredAt`.

## 명상 프로그램

> 이 도메인은 공통 `ApiResponse`와 `/api` 접두사를 사용하지 않는 현재 구현이다. 생성은 `Location` 헤더와 빈 본문, 삭제는 빈 `204 No Content`를 반환한다.

| 메서드 | 경로 | 요청 | 성공 응답 |
| --- | --- | --- | --- |
| GET | `/meditation/program` | 없음 | 200 `Program[]` |
| POST | `/meditation/program?userId={userId}` | `ProgramReservationCreate` | 201, `Location: /meditation/program/reservation/{reservationId}` |
| DELETE | `/meditation/program/reservation/{reservationId}?userId={userId}` | 없음 | 204 |
| GET | `/meditation/review` | 없음 | 200 `Review[]` |
| POST | `/meditation/review?userId={userId}` | `ReviewCreate` | 201, `Location: /meditation/review/{reviewId}` |
| DELETE | `/meditation/review/{reviewId}?userId={userId}` | 없음 | 204 |
| POST | `/meditation/admin/program` | `ProgramCreate` | 201, `Location: /meditation/program/{id}` |
| DELETE | `/meditation/admin/program/{programId}` | 없음 | 204 |

- `Program`: `id:number`, `name:string`, `pictureUrl:string|null`, `capacity:number`, `remain:number`, `status:OPEN|CLOSED`.
- `ProgramReservationCreate`: `programId:number`(필수), `quantity:number`(필수, 1 이상).
- `Review`: `id:number`, `programName:string`, `userName:string`, `content:string`, `createdAt:datetime`.
- `ReviewCreate`: `programReservationId:number`(필수), `content:string`(필수).
- `ProgramCreate`: `name:string`(필수), `pictureUrl:string|null`, `capacity:number`(1 이상).

## 구현상 확인이 필요한 사항

- Security 설정은 `/api/admin/**`만 관리자 전용으로 강제한다. 따라서 `/meditation/admin/**`는 이름과 달리 일반 인증 사용자도 접근 가능한 상태다.
- Security 설정의 CORS 허용 메서드에는 `DELETE`가 없다. 브라우저에서 명상 프로그램/리뷰 삭제 호출이 필요한 경우 CORS 정책 보완이 필요하다.

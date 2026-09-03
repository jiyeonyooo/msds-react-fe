# MSDS 랜딩 페이지 개편 기획

## 목적

MSDS 홈페이지를 단순한 메뉴 진입 화면이 아니라, `머무름 → 상태 이해 → 고요 탐색 → 명상 참여`의 흐름을 경험하는 스크롤 기반 랜딩 페이지로 개편한다.

- 기존 Hero의 이미지, MSDS 타이포그래피, 예약 검색 바가 만드는 첫인상은 유지한다.
- Rooms, Facility, Wellness, Quietness, Meditation Program의 진입점을 명확히 한다.
- GSAP와 ScrollTrigger를 사용해 절제된 브랜드 톤을 유지하면서도 기억에 남는 스크롤 경험을 만든다.
- 모든 핵심 정보와 링크는 애니메이션과 무관하게 접근 가능해야 한다.

## 페이지 정보 구조

```text
Hero
  ↓
Brand Story
  ↓
3가지 핵심 가치 카드
  ↓
Stay: Rooms & Facility
  ↓
Wellness Experience
  ↓
Quietness Experience
  ↓
Meditation Program Experience
  ↓
Final CTA
```

## 1. Hero

### 유지 요소

- 기존 Hero 배경 이미지, MSDS 타이포그래피, 브랜드 문구를 유지한다.
- 하단 예약 검색 바는 빠른 예약 진입점으로 유지하며 `/reservations`로 연결한다.

### 변경 요소

기존 `BOOK YOUR STAY` 단일 CTA를 같은 높이의 가로 2버튼으로 교체한다.

| CTA | 경로 | 역할 |
| --- | --- | --- |
| `EXPLORE ROOMS` | `/rooms` | 객실 유형 탐색 |
| `EXPLORE FACILITY` | `/facility` | 편의시설 탐색 |

- 첫 버튼은 네이비 채움, 두 번째 버튼은 밝은 반투명 또는 테두리 스타일로 구분한다.
- 진입 시 브랜드 문구, 제목, CTA, 예약 검색 바를 순차적으로 등장시킨다.

## 2. Brand Story

현재의 `A PLACE TO RETURN TO YOURSELF` 소개 영역은 유지한다.

- `OUR STORY` 버튼은 제거한다.
- 텍스트는 행 단위 reveal, 해안 이미지는 낮은 강도의 패럴랙스를 적용한다.
- 강한 pin 동작을 사용하지 않아 Hero 이후 호흡을 낮추는 구간으로 사용한다.

## 3. 핵심 가치 카드

기존 카드 3개와 아이콘 스타일은 유지하되, 각 카드가 명확한 서비스 진입점이 되도록 제목·본문·CTA를 바꾼다. 카드 전체 또는 CTA가 키보드로도 접근 가능한 링크여야 한다.

| 순서 | 서비스 | 메시지 | CTA | 경로 |
| --- | --- | --- | --- | --- |
| 1 | Wellness | 짧은 마음상태 검사로 현재의 휴식 리듬을 살펴본다. | `CHECK YOUR MIND` | `/wellness/check` |
| 2 | Quietness | 공간별 고요함과 시간대별 분위기를 확인한다. | `EXPLORE QUIETNESS` | 전용 `/quietness` 권장 |
| 3 | Meditation Program | 프로그램을 찾고, 참여하고, 경험을 남긴다. | `VIEW PROGRAMS` | `/programs` |

### 인터랙션

- 섹션 진입 시 카드가 순차적으로 나타난다.
- 데스크톱 hover/focus 시 대상 카드가 미세하게 확장되고, 아이콘과 CTA 화살표가 반응한다.
- 모바일에서는 짧은 등장 효과만 적용하고 hover 의존 동작은 사용하지 않는다.

## 4. Stay: Rooms & Facility

세 가지 콘텐츠 경험에 앞서 실제 머무름의 기반인 객실과 시설을 소개한다.

### 서비스 기획 반영 원칙

객실은 단순한 숙박 상품이 아니라 방문 목적에 맞는 휴식 방식을 고르는 영역으로 소개한다. 편의시설은 객실 밖에서 머무름을 완성하는 공용 공간과 서비스로 소개한다.

| 구분 | 랜딩에서 전달할 메시지 | 고객 화면의 실제 기준 |
| --- | --- | --- |
| Rooms | 나의 휴식 목적에 맞는 방을 고른다. | 객실 유형, 기준/최대 인원, 면적, 1박 기본 가격, 예약 가능 상태 |
| Facility | 객실 밖에서도 고요·회복·편의를 이어 간다. | 카테고리, 시설명, 설명, 대표 이미지, 활성 시설만 노출 |

- 고객은 객실 **유형**을 선택하며, 실제 호실이나 `room_units_id`를 선택하지 않는다. 실제 호실 배정은 예약 생성 후 서버가 처리한다.
- 랜딩에서는 판매 중지(`INAVAILABLE`) 객실을 추천하거나 노출하지 않는다. 매진(`SOLDOUT`)은 객실 목록의 정책에 따라 표시할 수 있으나 CTA는 예약 가능 객실 검색으로 안내한다.
- 편의시설은 운영 중인 활성 시설만 고객 경험의 근거로 사용한다. 준비 중·비활성 시설은 랜딩에 노출하지 않는다.
- API에 없는 운영 시간, 이용료, 층수, 사전 예약 여부를 실제 정보처럼 작성하지 않는다.

### 섹션 내러티브와 레이아웃

이 구간은 한 화면에 Rooms와 Facility를 단순 병렬 배치하지 않고, `나를 위한 방`에서 `머무름을 넓히는 공간`으로 이동하는 2막 구조로 구성한다.

```text
01. FIND YOUR ROOM
    방문 목적에 맞는 객실 유형을 발견한다.
              ↓
02. EXTEND YOUR STAY
    웰니스·여가·식음료 등 객실 밖의 경험으로 머무름을 확장한다.
```

#### 01. Find Your Room

- 첫 장면은 넓은 객실 이미지와 `A ROOM FOR THE WAY YOU REST` 카피를 사용한다.
- 스크롤에 따라 객실 유형 `STAY`, `REST`, `MEDITATE`, `RETREAT`가 한 장씩 전면으로 전환된다. 이는 고정된 객실 상품명이 아니라 현재 시스템의 객실 콘셉트 분류를 설명하는 장면이다.
- 전면 카드에는 유형명, 한 줄의 목적 설명, 객실 목록에서 확인 가능한 정보만 배치한다.
  - `STAY`: 균형 잡힌 기본 머무름
  - `REST`: 수면과 정적인 휴식
  - `MEDITATE`: 개인 명상과 집중
  - `RETREAT`: 장기 체류와 몰입형 휴식
- 실제 객실명·설명·대표 이미지·기준/최대 인원·면적·기본 가격은 `/api/rooms` 결과를 사용한다. 데이터가 아직 없으면 특정 객실을 만들지 않고, 객실 탐색 CTA와 준비 안내 상태를 보여 준다.
- CTA는 `EXPLORE ROOMS` → `/rooms`, 보조 CTA는 `CHECK AVAILABILITY` → `/reservations`로 둔다.

#### 02. Extend Your Stay

- 객실 장면이 양옆으로 열리며 시설 이미지가 가운데에서 나타난다.
- 랜딩에서는 시설 카테고리 전체를 동일 비중으로 나열하지 않고, MSDS 정체성과 연결되는 `WELLNESS`, `LEISURE`, `FOOD`를 우선 소개한다.
  - `WELLNESS`: 명상, 요가, 스파처럼 회복을 돕는 공간
  - `LEISURE`: 도서 라운지, 정원, 산책로처럼 느린 시간을 만드는 공간
  - `FOOD`: 레스토랑, 카페, 티 라운지처럼 머무름의 리듬을 잇는 공간
- `CONVENIENCE`, `PARKING`, `ACCESSIBILITY`, `BUSINESS`, `ETC`는 하단의 작은 정보 스트립 또는 전체 시설 페이지에서 접근하게 한다. 특히 접근성은 장식 요소로 축소하지 않고 독립된 라벨과 링크로 명확히 제공한다.
- 시설 카드의 CTA는 해당 필터 상태로 직접 이동한다.
  - `EXPLORE WELLNESS SPACE` → `/facility?category=WELLNESS`
  - `EXPLORE LEISURE SPACE` → `/facility?category=LEISURE`
  - `EXPLORE FOOD & TEA` → `/facility?category=FOOD`
  - 전체 CTA: `VIEW ALL FACILITIES` → `/facility`
- 특정 시설을 대표로 노출하려면 API 결과 중 해당 카테고리의 활성 시설이 있는지 먼저 확인해야 한다. 카테고리별 시설이 없을 때는 빈 카드나 임의의 시설명을 보이지 않고 해당 카테고리를 숨기거나 전체 시설 CTA로 대체한다.

### GSAP 인터랙션 시퀀스

데스크톱에서만 약 2~3뷰포트 길이의 짧은 pin 구간을 사용한다.

| 스크롤 구간 | 화면 변화 | 사용자에게 남길 정보 |
| --- | --- | --- |
| 0–25% | Rooms 대형 이미지와 도입 카피 reveal | 객실은 휴식 목적에 따라 고르는 상품 |
| 25–55% | 객실 유형 카드 4장이 순차적으로 전면 전환 | STAY·REST·MEDITATE·RETREAT의 차이 |
| 55–75% | 객실 이미지가 좌우로 열리고 Facility 장면 등장 | 객실 밖의 경험으로 이어지는 전환 |
| 75–100% | 시설 카테고리 카드가 깊이감 있게 쌓였다가 펼쳐짐 | 웰니스·여가·식음료 및 전체 시설 진입 |

- 이미지에는 느린 scale/translate 패럴랙스만 사용하고, 텍스트 대비와 버튼의 읽기 가능성을 우선한다.
- 이미지가 로드되지 않았거나 API가 실패한 경우에도 CTA와 설명은 정적인 레이아웃으로 즉시 표시한다.
- 모바일과 `prefers-reduced-motion: reduce` 환경에서는 pin과 겹침 전환을 제거하고 Rooms 블록 → Facility 블록 순서의 일반 세로 흐름으로 렌더링한다.

### 데이터·콘텐츠 운영 기준

- 객실 대표 이미지는 `mainImageUrl`을 우선 사용한다. 이미지가 없을 때의 브랜드 기본 이미지는 실제 객실 사진으로 오인되지 않도록 대체 표현을 둔다.
- 시설 대표 이미지는 `imageUrl`을 우선 사용한다. 이미지가 없는 시설은 아이콘 기반 카드로 안전하게 대체한다.
- 현재 화면의 로컬 이미지 배열은 시각적 fallback일 뿐, API 응답 순서에 따라 임의로 다른 객실·시설의 이미지가 매칭되지 않게 개선이 필요하다.
- 객실의 침대, 전망, 비품은 상세 페이지에서 다루고 랜딩에는 과도하게 나열하지 않는다. 다만 `WELLNESS` 비품은 객실 상세의 체류 경험을 보강하는 요소로 활용할 수 있다.
- 랜딩의 가격은 참고용으로 해석될 수 있으므로, 실제 예약 가능 여부·숙박일 수·총 가격 계산은 반드시 `/reservations` 검색 결과와 서버 응답을 기준으로 한다.

### 구현 전 확정할 항목

1. 랜딩에 노출할 객실 유형의 우선순위와 유형별 대표 이미지
2. 각 시설 카테고리에서 실제로 운영 중인 대표 시설과 이미지
3. 비어 있는 객실/시설 카테고리의 숨김 또는 대체 CTA 정책
4. Rooms 및 Facility의 실제 API 이미지 URL 사용 시점과 브랜드 fallback 이미지 정책

## 5. Wellness Experience

### 스토리

`마음상태 검사 → 결과 분석 → 나를 위한 휴식 제안`을 한 섹션에서 보여 준다.

1. 짙은 배경에서 질문 하나로 시작한다. 예: `오늘, 마음의 속도는 어떤가요?`
2. 스크롤에 맞춰 원형 상태 지표와 질문 카드가 차례로 드러난다.
3. 마지막에 결과 레벨과 맞춤형 휴식 제안의 개념을 보여 주고 검사 CTA를 배치한다.

### 연결 및 데이터 원칙

- CTA는 `/wellness/check`로 연결한다.
- 실제 검사 전에는 개인 결과나 개인화된 추천을 만들어 보여 주지 않는다.
- 랜딩의 표현은 검사 흐름을 설명하는 시각 장치이며, 실제 문항·결과는 Wellness API를 통해 검사 화면에서 확인한다.

### API 근거

- `GET /api/wellness/questions`
- `POST /api/wellness/guest/checks`
- `POST /api/wellness/checks`
- 회원 기록·상세·추이: `GET /api/wellness/checks/me`, `GET /api/wellness/checks/me/{checkId}`, `GET /api/wellness/trends/me`

## 6. Quietness Experience

### 스토리

이 섹션은 랜딩의 대표적인 pin 스크롤 경험으로 구성한다.

```text
게스트하우스 전체의 고요
  ↓
공간별 고요도
  ↓
시간대별 변화
  ↓
나에게 맞는 조용한 장소
```

1. 전체 평균 dB와 정숙 단계를 크게 보여 준다.
2. 객실·라운지·명상실·공용공간의 레이어가 분리되며 공간별 정숙도를 나타낸다.
3. 시간대별 평균 dB 그래프와 조용한 시간대를 보여 준다.
4. 가장 조용한 공간 또는 회원 대상 추천 공간을 강조하고 CTA를 제공한다.

### 연결 및 데이터 원칙

- 현재 서비스 화면에는 Quietness가 Wellness 화면에 포함되어 있다. 랜딩의 독립 서비스 카드와 CTA를 위해 전용 `/quietness` 라우트·화면을 추가하는 것을 권장한다.
- 전용 화면 전에는 `/wellness#quietness`를 임시 진입점으로 쓸 수 있다.
- dB, 정숙 단계, 측정 시각은 API 응답만 표시하며 임의 수치를 사용하지 않는다.
- API 오류 또는 데이터 부재 시 차트·수치를 꾸며내지 않고, 측정 데이터 안내 상태를 보여 준다.

### API 근거

- `GET /api/quietness/guesthouses/{guesthouseId}/summary`
- `GET /api/quietness/guesthouses/{guesthouseId}/spaces`
- `GET /api/quietness/guesthouses/{guesthouseId}/spaces/{spaceId}/hourly`
- 회원 추천: `GET /api/quietness/guesthouses/{guesthouseId}/recommendation`

### 현재 API의 한계와 후속 제안

현재 API는 공간 단위의 정숙도와 공간 추천을 제공한다. `조용함`을 기준으로 객실 유형을 직접 추천하려면 다음이 추가로 필요하다.

- 객실 유형(`room_id`)과 정숙도 공간(`space_id`)의 관계 데이터
- 날짜·인원·정숙도 조건을 함께 반영하는 객실 유형 추천 또는 예약 가능 여부 API

이 기능이 생기기 전까지는 Quietness를 공간 탐색 기능으로 정확하게 설명한다.

## 7. Meditation Program Experience

### 스토리

프로그램 이미지 또는 카드 더미와 참여 단계를 함께 보여 준다.

```text
DISCOVER  →  RESERVE  →  PRACTICE  →  REFLECT
프로그램 탐색 → 신청 → 참여 → 후기
```

- 스크롤에 따라 현재 단계의 프로그램 카드가 앞으로 오고 이전 카드는 뒤로 물러난다.
- 프로그램의 `OPEN/CLOSED`, `remain/capacity`를 실제 목록 정보로 활용할 수 있다.
- 마지막 CTA는 `/programs`로 연결한다.

### API 근거

- 목록: `GET /meditation/program`
- 신청: `POST /meditation/program?userId={userId}`
- 후기: `GET /meditation/review`, `POST /meditation/review?userId={userId}`
- 관리자 프로그램 생성·삭제: `POST /meditation/admin/program`, `DELETE /meditation/admin/program/{programId}`

### 현재 API의 한계

프로그램 일시, 상세 내용, 신청자 목록, 참여 완료 관리 기능은 현재 명세에 없다. 랜딩에서는 API로 확인할 수 없는 일정·참여 현황을 표시하지 않는다. 운영 기능을 확장하려면 해당 데이터와 관리자 API가 필요하다.

## 8. Final CTA

세 서비스를 하나의 머무름 경험으로 연결하는 마무리 구간이다.

> 오늘의 마음을 읽고, 가장 조용한 곳에서 머물러 보세요.

| CTA | 경로 |
| --- | --- |
| `WELLNESS CHECK` | `/wellness/check` |
| `EXPLORE ROOMS` | `/rooms` |

어두워지는 자연 이미지 또는 절제된 영상 질감을 배경으로 사용하고, 텍스트와 CTA는 마스크 reveal로 나타낸다.

## GSAP 구현 원칙

- `gsap`과 `ScrollTrigger`를 도입한다.
- pin은 Stay, Quietness, Meditation Program 세 구간에만 제한적으로 사용한다.
- Wellness는 읽기 흐름을 우선해 pin보다 텍스트·카드 reveal 중심으로 구현한다.
- 모바일에서는 긴 pin을 제거하고 세로 흐름, 짧은 fade/translate 효과로 대체한다.
- `prefers-reduced-motion: reduce`에서는 pin, 패럴랙스, 자동 전환을 해제하고 모든 콘텐츠를 즉시 표시한다.
- 모든 CTA·링크·정보는 애니메이션 상태와 관계없이 마우스와 키보드로 접근 가능해야 하며, focus-visible 스타일을 유지한다.
- 스크롤 효과는 장식이며, API 로딩·오류·빈 데이터 상태를 가리거나 조작해서는 안 된다.

## 구현 전 확정할 항목

1. Rooms와 Facility 섹션에 노출할 실제 목록·순서·이미지·카피
2. Quietness 전용 `/quietness` 화면의 추가 여부
3. Quietness 기반 객실 추천을 위한 백엔드 데이터/API 확장 여부
4. 프로그램 일정·상세·신청자·참여 관리 기능의 백엔드 확장 범위

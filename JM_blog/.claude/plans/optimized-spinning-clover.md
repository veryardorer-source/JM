# 인테리어 블로그 자동화 시스템 구현 계획

## Context
인테리어 회사 대표가 네이버 블로그를 주 3회 운영하려고 함. 현재 JM_blog 앱에서 AI Writer로 글 생성 + Puppeteer로 네이버에 발행하는 기본 기능은 동작하지만, 매번 수동으로 주제/사진을 입력해야 함. NAS에 현장별 사진이 정리되어 있으므로, **현장 폴더를 지정하면 → 사진을 읽어서 → 3편의 포스팅을 자동 생성 → 앱에서 미리보기/수정 → 발행**하는 워크플로우가 필요함.

---

## 1. 현장 관리 + 사진 폴더 연동

### 새 컴포넌트: `SiteManager.jsx`
- **현장 등록**: 현장명, NAS 폴더 경로(UNC), 상태(디자인/시공/마감/완료)
- **사진 미리보기**: 선택한 현장 폴더의 이미지 파일 목록 표시 (서버 API로 읽기)
- **사진 선택**: 포스팅에 사용할 사진을 골라서 단계별(디자인/시공/마감) 분류

### 서버 API 추가 (`server.js`)
- `GET /api/sites/photos?path=UNC경로` — NAS 폴더의 이미지 파일 목록 반환
- `GET /api/sites/photo/:filename?path=UNC경로` — 개별 이미지를 base64로 반환
- 지원 확장자: jpg, jpeg, png, webp

### 데이터 저장 (`storage.js`)
- `localStorage` 키 `'blog_sites'`에 현장 목록 저장
```js
{
  id, name, folderPath, status, createdAt,
  phases: {
    design: { photos: [], generated: false, draftId: null },
    construction: { photos: [], generated: false, draftId: null },
    finishing: { photos: [], generated: false, draftId: null }
  }
}
```

---

## 2. 인테리어 특화 AI 프롬프트 (네이버 SEO 최적화)

### 서버에 새 엔드포인트: `POST /api/ai/generate-series`
- 기존 `/api/ai/generate`를 확장하되, 인테리어 3단계 시리즈 전용 프롬프트 사용
- **입력**: 현장명, 단계(design/construction/finishing), 사진 base64 배열, 키워드
- **네이버 SEO 프롬프트 강화 포인트**:
  - C-Rank: 인테리어 전문성 강조, 일관된 카테고리 키워드
  - D.I.A.: 체류시간 늘리는 구조 (사진+설명 반복, 소제목 활용)
  - 제목에 "지역명 + 인테리어" 키워드 포함
  - 본문 2000자 이상, 사진 5장 이상 권장
  - 시리즈 내 상호 링크 (이전/다음 글 언급)

### 단계별 프롬프트 특화:
1. **디자인/설계**: 고객 요구사항, 디자인 컨셉, 도면/3D, 자재 선정 이유
2. **시공**: 현장 진행상황, 공정별 설명, 전문 시공 과정
3. **마감**: Before/After, 최종 결과물, 고객 만족 포인트

---

## 3. 시리즈 생성 + 미리보기 워크플로우

### 새 컴포넌트: `SeriesGenerator.jsx`
- 현장 선택 → 단계 선택 → 사진 선택/분류
- "시리즈 생성" 버튼 → 3편 동시 생성 (또는 단계별 개별 생성)
- 생성된 글은 **draft로 자동 저장** → DraftList에서 확인 가능

### 기존 `DraftList.jsx` 개선
- 현장별 필터링 기능 추가
- 시리즈 묶음 표시 (디자인 → 시공 → 마감)
- 각 초안에서 "미리보기" → "수정" → "발행" 플로우

---

## 4. 발행 스케줄링

### 새 컴포넌트: `ScheduleManager.jsx`
- 주간 발행 스케줄 설정 (예: 월/수/금 오전 10시)
- 발행 대기열: 생성된 초안을 발행 순서에 배치
- 발행일이 되면 앱에서 알림 → 사용자가 확인 후 발행 버튼 클릭
- (**자동 발행이 아닌 수동 확인 후 발행** — 사용자 요청에 맞춤)

### 데이터 (`storage.js`)
```js
// 'blog_schedule' 키
{
  days: ['mon', 'wed', 'fri'],
  time: '10:00',
  queue: [{ draftId, scheduledDate, status: 'pending'|'published' }]
}
```

---

## 5. 네비게이션 업데이트

### `Layout.jsx` 메뉴 추가:
- 현장관리 (SiteManager)
- 시리즈 생성 (SeriesGenerator) 
- 발행 스케줄 (ScheduleManager)
- 기존 메뉴 유지 (AI 작성, 직접 작성, 임시저장, 발행목록, 설정)

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `server.js` | NAS 사진 읽기 API, 시리즈 생성 프롬프트 API |
| `src/App.jsx` | 새 페이지 라우팅 추가 |
| `src/components/Layout.jsx` | 네비게이션 메뉴 추가 |
| `src/utils/storage.js` | 현장, 스케줄 데이터 관리 함수 |
| **신규** `src/components/SiteManager.jsx` | 현장 등록/관리 |
| **신규** `src/components/SeriesGenerator.jsx` | 시리즈 글 생성 |
| **신규** `src/components/ScheduleManager.jsx` | 발행 스케줄 관리 |

---

## 검증 방법
1. 앱 실행 (`npm run dev` + `node server.js`)
2. 현장 등록 → NAS 경로 입력 → 사진 목록 로딩 확인
3. 시리즈 생성 → 3편의 초안이 DraftList에 저장되는지 확인
4. 각 초안 미리보기/수정 → 네이버 발행 테스트
5. 스케줄 설정 → 발행 대기열에 초안 배치 확인

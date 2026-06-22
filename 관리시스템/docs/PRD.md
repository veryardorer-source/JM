# JM OS — 제품 요구사항 문서 (PRD)

> 최종 업데이트: 2026-06-22 · 작성 기준: **실제 운영 DB**(Supabase `jm-system`) 확인 내용
> ⚠️ 기존 `ERD.md`/`0001`/`0002.sql`은 운영에 적용되지 않은 옛 설계임. 본 문서가 실제 기준.

## 0. 진행 현황 (2026-06-22)

**✅ 완료·배포됨** — 라이브: https://jm-interior.vercel.app
- **로그인 문제 해결**: 이메일 인증(Confirm email) OFF + 기존 미인증 계정 인증 처리
- **현장 상세 '현황' 대시보드 탭**(기본 탭): 요약카드(공정 진행률·자료/사진 수·누적 원가) + 공정 진행 막대 + 사진/영상 미리보기 + 배정직원·비용 카드. `field` 역할은 금액 자동 숨김. (기존 자료/공정/비용 탭은 유지)
- **영상 재생**: 시공사진 등에 올린 mp4가 썸네일(첫 장면)+▶로 표시, 클릭 시 재생 (자료 탭·현황 미리보기·라이트박스 모두 적용)
- **현장 수정 기능**: 현장 상세 "현장 수정" 버튼 → 이름/고객/담당/주소/단계/일정/메모 수정 (이전엔 진행단계만 변경 가능 → **주소 등 추가 입력 가능**)
- **가로 화면 허용**: PWA manifest `orientation` portrait→any (포터블 스크린은 앱 **재설치** 시 적용)

**배포 방법**: 이 PC에서 `cd jm-system && npx vercel --prod --yes` (Vercel 로그인·`jm-interior` 링크 완료). GitHub 자동배포는 계정 분리(veryardorer vs veryardorer-source) 이슈로 보류.

**⏳ 요청됨·미착수**
- 직원 채팅(전체 단톡방 우선) · 자료 업로드 알림(앱 내 🔔)
- 영수증/출금을 **현장별로 연결** (현재 DB에 `project_id` 없음 → DB 변경 필요)
- 앱 내 가입 승인(4장) · 모바일 반응형 · "신규 가입 허용" OFF

## 1. 개요

JM 건축인테리어의 **사내 관리 웹앱**. 노션 기반 관리 시스템을 대체하며, 외주 없이 Claude와 함께 직접 구축·운영한다. 비개발자인 대표가 화면을 보며 피드백해 다듬는 방식.

- **목적**: 현장(프로젝트) 중심으로 일정·자료·비용·직원 업무를 한곳에서 관리.
- **사용자**: JM 건축인테리어 임직원 (대표/관리자, 디자인, 현장).
- **배포**: Vercel (https://jm-interior.vercel.app). 기술스택: Next.js + Tailwind + Supabase(DB/Auth/Storage).

## 2. 사용자 & 역할 (권한)

권한은 `profiles.role` 값으로 결정된다. 현재 실제 사용 값:

| role | 의미 | 권한 개요(의도) |
|------|------|----------------|
| `admin` | 대표·관리자 | 전체 조회/수정, 재무, 직원·권한 관리, 출금 승인 |
| `designer` | 디자인팀 | 현장·자료·일정 관리, 영수증/출금 요청 |
| `field` | 현장팀 | 배정된 현장 업무·자료 업로드·영수증/출금 요청 (재무·민감정보 제한) |

- `profiles.team` 컬럼으로 팀 구분 가능(현재 데이터는 비어 있음).
- 신규 가입자는 기본 `field`로 생성됨.

## 3. 핵심 기능 (실제 데이터 모델 기준)

| 영역 | 기능 | 관련 테이블 |
|------|------|-------------|
| 계정/권한 | 로그인, 직원 프로필·역할·팀 | `profiles` |
| 인사 | 직원 정보 관리 | `employees` |
| 현장(프로젝트) | 현장 등록·상태·정보 | `projects` |
| 현장 배정 | 현장별 담당 직원 배정 | `project_assignments` |
| 공정/일정 | 일정·공정표 | `schedules` |
| 현장 자료 | 사진/도면/문서 업로드 | `project_files` |
| 현장 원가 | 현장별 비용 기록 | `project_costs` |
| 영수증 | 영수증 사진·금액 업로드 | `receipts` |
| 출금 요청 | 거래처 지급/출금 요청·승인 | `withdrawal_requests` |
| 공지 | 사내 공지사항 | `notices` |
| 회사 문서 | 매뉴얼·회사 문서 | `company_documents` |
| 재무 | 매출/고정비/급여/현장수익 | `finance_sales`, `finance_fixed_costs`, `finance_payroll`, `finance_project_profit` |

## 4. 가입 · 인증 · 권한 정책

### 현재 동작 (2026-06-22)
- 이메일+비밀번호 회원가입. **이메일 인증(Confirm email) OFF** → 가입 후 바로 로그인.
- 가입 시 `profiles` 행 자동 생성(기본 role=`field`).
- **승인(pending) 절차 없음** → 가입=즉시 사용. 역할 변경은 현재 대표가 DB에서 직접.
- "신규 가입 허용(Allow new users to sign up)" 현재 ON(외부인도 가입 가능 → 직원 가입 끝나면 OFF 권장).

### 요청된 개선 — 앱 내 가입 승인 (예정)
대표가 **앱 안에서** 신규 직원을 승인하고 역할을 부여하는 흐름.
1. 가입 → `profiles.status='pending'` (상태 컬럼 신규 추가 필요)
2. pending 직원은 로그인해도 "대표 승인 대기" 화면만 표시
3. 관리자 전용 "직원 승인" 화면에서 승인 + 역할/팀 지정 → `status='approved'`
- ⚠️ DB 변경(①)과 앱 화면(②)은 **반드시 함께 배포**. (상세: `actual_schema_and_approval_plan.md`)

## 5. 업무 규칙
- 회계/급여는 외부 경리나라에서 대표가 처리하던 방식이나, 실제 앱에는 `finance_*` 재무 기능이 존재함 → 실제 운영 범위는 다음 세션에 대표와 재확인 필요.
- 직원은 영수증 사진만 올리고, 대표가 확인.

## 6. 비범위 (현재 의도적으로 제외/보류)
- 고객관리(CRM), AI 자동 블로그, Make 자동알림.

## 7. 데이터 모델 (운영 public 스키마, 15개 테이블)
```
company_documents, employees, finance_fixed_costs, finance_payroll,
finance_project_profit, finance_sales, notices, profiles,
project_assignments, project_costs, project_files, projects,
receipts, schedules, withdrawal_requests
```

## 8. 로드맵 / 다음 작업
- [x] 앱 소스 확보 (`veryardorer-source/jm-system` clone)
- [x] 현장 상세 '현황' 대시보드
- [x] 영상 재생·미리보기
- [x] 현장 수정(주소 등)
- [x] 가로 화면 허용 (PWA manifest)
- [x] 라이브 배포 파이프라인 (Vercel CLI)
- [ ] **직원 채팅** (전체 단톡방 우선)
- [ ] **자료 업로드 알림** (앱 내 🔔)
- [ ] **영수증/출금 현장별 연결** (DB에 project_id 추가)
- [ ] 모바일 반응형 (☰ 햄버거 메뉴, 공정표 카드형) — `mobile_audit.md`
- [ ] **가입 승인 기능** 구현 (4장 ②) → `actual_schema_and_approval_plan.md`
- [ ] 직원 가입 완료 후 "신규 가입 허용" OFF
- [ ] 재무(`finance_*`) 기능 실제 사용 범위 대표와 확정

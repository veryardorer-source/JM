# 보안(RLS/권한) 적용 현황

> 마지막 정리: 2026-07-02
> ⚠️ Claude는 Supabase에 직접 접속할 수 없어 **원격으로 실제 적용 여부를 확인할 수 없습니다.**
> 아래 "적용" 표시는 **대화 기록(대표님이 SQL Editor에서 실행하고 알려준 것) 기준**입니다.
> 확실한 확인은 아래 §검증 쿼리를 Supabase에서 직접 실행해 주세요.

## SQL 파일별 상태 (repo: `jm-system/db/`)

| 파일 | 내용 | 상태 | 근거/날짜 |
|---|---|---|---|
| `security_and_realtime.sql` | 전체 테이블 RLS ON + authenticated 전체허용(auth_all) + 채팅/알림 테이블·realtime | ✅ 적용 | 2026-06-22 (파일 주석) — 이후 아래 파일들이 auth_all을 대체 |
| `rls_sensitive.sql` | employees/employee_salaries/employee_attendance/finance_* → **admin 전용** + `my_role()` | ✅ 적용 | 2026-07-02, 대표 실행 "Success" |
| `rls_notifications.sql` | notifications → 본인것만 select/update/delete, insert 허용 | ✅ 적용 | 2026-07-02, 대표 실행 "됐어" |
| `chat_features.sql` | messages 컬럼(reply/edit/delete/pin) + `message_reactions` + realtime | ✅ 적용 | 2026-07-02, 대표 "실행했어" |
| `chat_reads.sql` | `chat_reads`(읽음확인) 테이블 + realtime | ✅ 적용 | 2026-07-02, 대표 실행 (Success) |
| `rls_chat.sql` | **채팅 RLS 정비**(messages/chat_rooms/chat_room_members/message_reactions/chat_reads 참여자·본인 기준) | ✅ 적용 | 2026-07-02, 대표 실행 (Success). auth_all 대체 |
| `rls_money.sql` | **금전/내부자료 RLS**(receipts/withdrawal_requests/payments/project_costs/company_documents/project_files 역할 기준) | ✅ 적용 | 2026-07-02, 대표 실행 (Success). auth_all 대체 |

### 실행 순서 (완료됨 — 2026-07-02 이 순서로 적용)
1. `chat_reads.sql` (테이블이 있어야 `rls_chat.sql`이 chat_reads 정책을 걺)
2. `rls_chat.sql`
3. `rls_money.sql`

> 세 파일 모두 기존 `auth_all`(전체 허용) 정책을 **자동으로 제거 후** 새 정책을 겁니다. 운영 데이터 접근에 영향이 있으니 **실행 전 스냅샷/백업 권장**, 실행 직후 각 역할(admin/designer/field/partner) 계정으로 화면 동작을 확인하세요.

## 적용될 정책 요약

### 채팅 (`rls_chat.sql`)
- **messages**: 전체채팅=승인자 / DM=당사자만 / 방=멤버만 select. insert=본인 명의+파트너 제외. update(수정·고정·소프트삭제)=작성자 또는 admin. delete=작성자 또는 admin.
- **chat_rooms**: 멤버(또는 admin)만 select. 생성=본인 명의. 이름변경/삭제=생성자 또는 admin.
- **chat_room_members**: 멤버(또는 admin)만 목록 조회. 추가=생성자/admin. 삭제=생성자/admin/본인(나가기).
- **message_reactions**: 메시지 볼 수 있는 사람만 select. 본인 reaction만 추가/삭제.
- **chat_reads**: 내 행/나와의 DM 상대 행/내가 속한 방만 select. 본인 행만 upsert.

### 금전·내부자료 (`rls_money.sql`)
- **receipts / withdrawal_requests / payments**: admin·designer·field 접근, **partner·미승인 차단** (현재 화면 로직과 동일 — partner만 막힘).
- **project_costs**: admin·designer만 (field·partner 제외 = 현장상세 canSeeMoney와 동일).
- **company_documents**: admin=전체, designer·field=`전체공개`만, 쓰기=admin. partner·미승인 차단.
- **project_files**: 승인자 읽기, 쓰기=admin·designer·field(파트너 보기전용).

## 남은 보안 과제 (roadmap, 미구현)
- **partner "배정 현장만" DB 제한**: `project_assignments`가 `employee_name`(텍스트)로 연결돼 있어 `auth.uid()`와 못 맞춤. → 배정 테이블에 `user_id` 컬럼 추가 후 projects/project_files에 배정 기반 RLS 필요.
- **Storage(uploads) 비공개화 + signed URL**: 현재 public 버킷. 계약서·직원자료는 private 전환 검토.
- **감사 로그**: 상태변경·삭제·금액수정 이력.
- **방 관리 UI**: 현재 채팅방 설정(⚙️)은 non-partner에게 노출되나 RLS상 멤버 추가/삭제는 방 생성자·admin만 성공 → 필요 시 UI도 생성자/admin에게만 노출로 정리.

## §검증 쿼리 (Supabase SQL Editor에서 직접 확인)
```sql
-- 1) 테이블별 RLS 활성화 여부
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;

-- 2) 테이블별 정책 목록 (auth_all 이 남아있으면 아직 미교체)
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) 헬퍼 함수 존재 확인
select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('my_role','is_approved','is_room_member','can_see_message');
```
- messages/chat_*/receipts/... 에 `auth_all` 정책이 **더 이상 없어야** 정상(새 정책명으로 바뀜).

# JM OS v1.0 — ERD & 데이터 설계

모든 데이터는 **Project**를 중심으로 연결된다. 회계/급여는 외부(경리나라)에서 처리하므로 본 스키마에 포함하지 않는다.

## ER 다이어그램

```mermaid
erDiagram
    users ||--o{ projects        : "manager"
    users ||--o{ tasks           : "assigned"
    users ||--o{ meeting_notes   : "author"
    users ||--o{ files           : "uploaded_by"
    users ||--o{ receipts        : "user"
    users ||--o{ payment_requests: "requester"
    users ||--o{ notices         : "author"

    customers ||--o{ projects    : "client"

    projects ||--o{ tasks            : "has"
    projects ||--o{ meeting_notes    : "has"
    projects ||--o{ files            : "has"
    projects ||--o{ receipts         : "has"
    projects ||--o{ payment_requests : "has"

    users {
        uuid id PK "= auth.users.id"
        user_role role
        text name
        text phone "민감"
        text email "민감"
        text department
        date hire_date "민감"
        date leave_date "민감"
        timestamptz created_at
    }
    customers {
        uuid id PK
        text name
        text phone "현장팀 마스킹"
        text email "현장팀 마스킹"
        text address
        text memo
    }
    projects {
        uuid id PK
        uuid customer_id FK
        text name
        text address
        project_status status
        uuid manager_id FK
        numeric contract_amount "관리자 전용"
        date start_date
        date end_date
        text description
    }
    tasks {
        uuid id PK
        uuid project_id FK
        task_category category
        text title
        uuid assigned_user_id FK
        date scheduled_date
        date completed_date
        task_status status
    }
    meeting_notes {
        uuid id PK
        uuid project_id FK
        uuid author_id FK
        text content
    }
    files {
        uuid id PK
        uuid project_id FK
        file_category category
        text file_name
        text file_type
        storage_provider storage_provider
        text storage_path
        text public_url
        uuid uploaded_by FK
    }
    receipts {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        numeric amount
        text purpose
        text image_url
    }
    payment_requests {
        uuid id PK
        uuid project_id FK
        uuid requester_id FK
        text vendor_name
        numeric amount
        text description
        date due_date
        payment_status status
        uuid approved_by FK
        timestamptz approved_at
    }
    manuals {
        uuid id PK
        manual_category category
        text title
        text content
    }
    notices {
        uuid id PK
        text title
        text content
        uuid author_id FK
    }
    audit_logs {
        uuid id PK
        uuid actor_id FK
        text action
        text entity
        uuid entity_id
        jsonb detail
    }
```

## ENUM 정의

| 타입 | 값 |
|------|-----|
| `user_role` | representative(대표), director(이사), design(디자인), field(현장), accounting(경리) |
| `project_status` | inquiry, survey, design, estimate, contract, construction, completed |
| `task_category` | demolition, carpentry, electrical, plumbing, tile, painting, film, furniture, cleaning |
| `task_status` | pending, in_progress, completed, delayed |
| `payment_status` | requested, pending_approval, approved, paid, rejected |
| `file_category` | before, after, cad, render, meeting, receipt, doc |
| `storage_provider` | supabase, cloudflare_r2 |
| `manual_category` | company, design, construction |

## 접근 제어 매트릭스 (RLS)

R=조회, W=생성/수정, –=불가, △=조건부(본인/마스킹)

| 테이블 | 대표 | 이사 | 디자인 | 현장 | 경리 |
|--------|:---:|:---:|:---:|:---:|:---:|
| users (개인정보) | RW | RW | △본인 | △본인 | △본인 |
| customers | RW | RW | RW | R(연락처 마스킹) | R(연락처 마스킹) |
| projects (계약금액) | RW | RW | RW | R(금액 마스킹) | R(금액 마스킹) |
| tasks | RW | RW | RW | RW | R |
| meeting_notes | RW | RW | RW | △작성자 | △작성자 |
| files | RW | RW | RW | RW | R |
| receipts | R전체 | R전체 | △본인 | △본인 | R전체 |
| payment_requests | RW(승인) | RW(승인) | △본인 | △본인 | RW(지급) |
| manuals / notices | RW | RW | R | R | R |
| audit_logs | R | R | – | – | – |

### 민감정보 컬럼 마스킹
단일 `authenticated` 역할 한계 때문에 컬럼 단위 제한은 `security_invoker` 뷰로 처리한다. 앱은 가능한 한 뷰를 통해 읽는다.

- `projects_v` — `contract_amount`는 관리자(대표/이사)에게만 노출
- `customers_v` — `phone`/`email`은 현장팀에게 NULL 마스킹
- `users_v` — `phone`/`email`/`hire_date`/`leave_date`는 관리자·본인에게만 노출

## 파일 저장 구조 (Supabase Storage)

```
/project/{project_id}/before/
/project/{project_id}/after/
/project/{project_id}/cad/
/project/{project_id}/render/
/project/{project_id}/meeting/
/project/{project_id}/receipt/
```

허용 형식: jpg, png, pdf, dwg, skp, xlsx, docx

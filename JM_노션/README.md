# JM 노션 작업 폴더

이 폴더는 JM Notion 업무 시스템을 만들고 정리했던 스크립트 모음입니다.

## 먼저 할 일

이미 예전 Notion 토큰이 파일에 노출된 적이 있으므로, Notion에서 기존 integration token을 폐기하고 새 토큰을 발급하세요.

## 실행 방법

PowerShell에서 실행할 때만 토큰을 넣습니다.

```powershell
$env:NOTION_TOKEN="새로_발급한_Notion_토큰"
python notion_preflight_audit.py
```

토큰은 `.py` 파일이나 문서에 직접 적지 않습니다.

## 권장 실행 순서

1. `notion_preflight_audit.py`로 현재 새 시스템 상태를 읽기 전용 점검
2. `notion_site_album_pages.py`로 각 현장 카드에 사진첩 하위 페이지 추가
3. `notion_usage.py`로 각 페이지의 직원용 사용법 안내문 보강
4. `notion_decorate.py`로 메인 대시보드 커버/모바일 안내/바로가기 정리
5. 필요 시 `notion_applicants.py`로 지원자 이력서 DB를 관리자 전용에 생성
6. 전 직원 초대 전 Notion 화면에서 권한을 직접 확인

`notion_build.py`는 새 시스템을 다시 만드는 구축 스크립트입니다. 기존 운영 중인 `JM 업무 시스템`에 보강만 할 때는 먼저 실행하지 마세요.

## 사진 관리

앞으로 사진은 현장 카드 안의 하위 페이지 `시공전 사진첩 / 시공중 사진첩 / 완성 사진첩`에서 관리합니다. 직원이 휴대폰에서 직접 지울 때는 해당 사진첩 안의 파일 메뉴에서 삭제하면 됩니다.

전 직원용 현장 DB의 사진 속성칸은 삭제했고, 사진첩 하위 페이지 방식으로 정리했습니다.

## 주요 문서

- `STRUCTURE.md`: 현재 Notion 구조, 권한 분리 상태, 남은 작업
- `notion_auth.py`: 모든 스크립트가 공통으로 사용하는 토큰 로더
- `notion_preflight_audit.py`: 직원 초대 전 권한/민감정보 읽기 전용 점검
- `notion_site_album_pages.py`: 현장 카드에 모바일용 사진첩 하위 페이지 추가
- `notion_build.py`: 새 JM 업무 시스템 구축 스크립트
- `notion_v10_privacy.py`: 전 직원 현장 DB에서 재무 노출을 제거하는 보정 스크립트

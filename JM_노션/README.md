# JM 노션 작업 폴더

이 폴더는 JM Notion 업무 시스템을 만들고 정리했던 스크립트 모음입니다.

## 먼저 할 일

이미 예전 Notion 토큰이 파일에 노출된 적이 있으므로, Notion에서 기존 integration token을 폐기하고 새 토큰을 발급하세요.

## 실행 방법

PowerShell에서 실행할 때만 토큰을 넣습니다.

```powershell
$env:NOTION_TOKEN="새로_발급한_Notion_토큰"
python notion_v10_privacy.py
```

토큰은 `.py` 파일이나 문서에 직접 적지 않습니다.

## 주요 문서

- `STRUCTURE.md`: 현재 Notion 구조, 권한 분리 상태, 남은 작업
- `notion_auth.py`: 모든 스크립트가 공통으로 사용하는 토큰 로더
- `notion_build.py`: 새 JM 업무 시스템 구축 스크립트
- `notion_v10_privacy.py`: 전 직원 현장 DB에서 재무 노출을 제거하는 보정 스크립트


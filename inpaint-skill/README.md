# Inpaint Skill

이미지에서 수정할 영역을 선택해 ChatGPT로 전달하는 개인 Codex 스킬과 웹앱입니다.

## 포함 내용

- `webapp/`: 드래그앤드롭, 붙여넣기, 브러시·사각형·원·다각형 선택, 투명 배경 제거를 지원하는 웹앱
- `codex-skill/inpaint/`: Codex 개인 스킬 등록 파일

배포된 앱: https://inpaint-studio-kr.dear-grove-5711.chatgpt.site

## 스킬 설치

`codex-skill/inpaint` 폴더를 개인 Codex skills 디렉터리에 복사하면 `$inpaint`로 호출할 수 있습니다.

## 웹앱 실행

`webapp` 폴더에서 의존성을 설치한 뒤 개발 서버를 실행합니다.

```text
npm install
npm run dev
```


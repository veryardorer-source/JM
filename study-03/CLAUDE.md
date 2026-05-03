# study-03: 상식 퀴즈 게임

## 프로젝트 개요
단일 HTML 파일(index.html)로 구성된 상식 퀴즈 게임.
외부 라이브러리 없이 순수 HTML/CSS/JS로 구현. 3단계 모두 완료.

## 파일 구조
```
study-03/
├── index.html   # 모든 코드(HTML, CSS, JS)가 담긴 단일 파일
└── CLAUDE.md
```

## 기술 스택
- 순수 HTML5 / CSS3 / Vanilla JavaScript
- 외부 의존성 없음
- 한국어(UTF-8)
- LocalStorage (랭킹 저장)

## 화면 구성 (display: none/block 전환)
| 화면 ID | 역할 |
|---------|------|
| `#start-screen` | 시작 화면 (닉네임 입력, 카테고리 선택, 게임 시작/랭킹 보기) |
| `#quiz-screen` | 문제 풀기 화면 (진행 바, 4지선다, 해설, 다음 버튼) |
| `#result-screen` | 결과 화면 (점수, 정답률, 카테고리별 성적 바차트) |
| `#ranking-screen` | 랭킹 화면 (TOP 10, 1~3위 금/은/동 강조) |

## 문제 데이터 (QUESTIONS 상수 배열)
- 총 40문제, 카테고리 4개 × 10문제
- 카테고리: 한국사, 과학, 지리, 일반상식
- 각 문제 구조 (단축 키 사용):
  ```js
  {
    id:  Number,
    cat: "한국사" | "과학" | "지리" | "일반상식",
    q:   String,                           // 문제 텍스트
    c:   [String, String, String, String], // 보기 4개
    a:   Number,                           // 정답 인덱스 (0~3)
    exp: String                            // 정답 해설
  }
  ```

## 게임 로직 핵심
- 셔플: Fisher-Yates (`shuffle()`) — 문제 순서 + 보기 순서 모두 랜덤
- 보기 셔플 후 정답 텍스트로 인덱스 재계산 (`shuffleChoices()`)
- 중복 답변 방지: `state.answered` 플래그 + `btn.disabled = true`
- 화면 전환: `showScreen('start'|'quiz'|'result'|'ranking')`

## 랭킹 시스템
- LocalStorage 키: `quiz_ranking`
- 저장 구조:
  ```js
  {
    nickname:       String,
    score:          Number,
    totalQuestions: Number,
    accuracy:       Number,   // 정답률 (%)
    category:       String,
    playedAt:       String    // "YYYY-MM-DD HH:mm"
  }
  ```
- 정렬: accuracy 내림차순 → playedAt 내림차순 (동률 시 최신 우선)
- 상위 20개 저장, 화면에는 TOP 10 표시

## 결과 화면 메시지 기준
| 정답률 | 메시지 |
|--------|--------|
| 90% 이상 | 탁월합니다! |
| 70~89% | 훌륭해요! |
| 50~69% | 괜찮아요! |
| 50% 미만 | 다시 도전해 보세요! |

## 실행
`index.html`을 브라우저에서 직접 열면 됨. 별도 서버 불필요.

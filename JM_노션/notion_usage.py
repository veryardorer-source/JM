"""
notion_usage.py — 각 폴더 페이지의 '안내 콜아웃'을 직원용 자세한 사용법으로 교체
- DB 설명은 인라인 DB에서 안 보이므로, 페이지의 첫 콜아웃(회색 박스) 텍스트를 업데이트
- 콜아웃이 없으면 페이지 맨 위에 새로 추가
실행:  $env:NOTION_TOKEN="새토큰"  ;  python notion_usage.py
"""
import urllib.request, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from notion_auth import TOKEN
H={'Authorization':f'Bearer {TOKEN}','Notion-Version':'2022-06-28','Content-Type':'application/json'}
def api(m,e,d=None):
    b=json.dumps(d,ensure_ascii=False).encode() if d else None
    r=urllib.request.Request('https://api.notion.com/v1'+e,data=b,headers=H,method=m)
    try:
        with urllib.request.urlopen(r) as x: return json.loads(x.read())
    except urllib.error.HTTPError as ex:
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:160]); return err

# 페이지 제목에 포함된 키워드 → 사용법 텍스트
USAGE=[
 ('경비',   '📖 사용법: 현장에서 쓴 영수증을 사진으로 올리세요. ① "새로 만들기" → ② 영수증 사진 첨부 → ③ 금액·사용처·현장 입력. 사진만 올려도 OK. 정산되면 상태를 "정산완료"로 바꿔요. (현장팀+관리팀만 봄)'),
 ('출금',   '📖 사용법: 일용직 일당·거래처 대금 등 돈을 보내야 할 때 등록하세요. ① "새로 만들기" → ② 유형·금액·수령인·계좌번호 입력 → ③ 상태 "요청". 대표가 확인 후 처리합니다(실제 송금은 경리나라). (현장팀+관리팀만 봄)'),
 ('SNS',   '📖 사용법: 현장별 블로그(디자인·시공·마감편)·인스타 발행 계획을 관리. ① 현장·채널·포스팅 종류 선택 → ② 진행하며 상태 갱신 → ③ 발행하면 "발행완료" + 링크 붙여넣기.'),
 ('자재',   '📖 사용법: 현장별 자재 발주·입고를 기록. 품목·발주업체·수량·납기일 입력 후, 입고되면 상태를 "입고완료"로 바꿔요.'),
 ('A/S',    '📖 사용법: 완공 후 하자·민원이 들어오면 접수하세요. 현장·고객·내용 입력 → 처리하며 상태(접수→처리중→완료) 갱신. 처리 사진도 첨부.'),
 ('협력업체','📖 사용법: 전기·타일·목공 등 협력업체 주소록입니다. 업체명·업종·연락처·계좌·단가표를 모아두고, 평점·거래상태로 관리하세요.'),
 ('공지',   '📖 사용법: 회사 공지와 업무 매뉴얼 게시판. 신입도 여기서 한눈에 확인. 새 공지는 "새로 만들기", 읽었으면 "확인" 체크하세요.'),
 ('직원 명부','📖 사용법(관리자): 직원 인적사항·계좌·입퇴사·계약을 관리. 사진·연락처·4대보험 등 인사정보. 🔴 대표·이사만 봅니다.'),
 ('근태',   '📖 사용법(관리자): 출퇴근·지각·조퇴·결근·연차를 날짜별로 기록. 직원과 연결해서 관리. 🔴 대표·이사만 봅니다.'),
 ('회계',   '📖 사용법(관리자): 회사 매출·매입 흐름. 구분(수입/지출)·비용성격(고정/변동/현장원가)·카테고리로 분류. 세부 회계는 경리나라. 🔴 대표·이사만.'),
 ('재무',   '📖 사용법(관리자): 현장별 계약금액·총지출·수익 관리. 계약금액과 총지출을 입력하면 수익이 자동 계산(계약금액-총지출). 🔴 대표·이사만.'),
 ('고객',   '📖 사용법(관리자): 고객 의뢰·상담·계약·연락처 관리. 상담상태로 진행 단계를 추적. 🔴 대표·이사만 봅니다.'),
 ('견적',   '📖 사용법(관리자): 견적 작성·발송·성사 여부 관리. 견적서 파일 첨부, 상태로 진행 추적. 🔴 대표·이사만 봅니다.'),
 ('아카이브','📖 사용법(관리자): 완료한 공사 기록(포트폴리오). 완성 사진·도면 보관, 마케팅 활용 체크. 🔴 대표·이사만 봅니다.'),
]

ROOT='381089e9-0a52-81b5-83a3-c42ce799c0d6'
# 루트에서 직접 훑기(검색 색인 안 기다림)
def all_pages():
    out=[]
    def walk(pid,depth=0):
        if depth>3: return
        r=api('GET','/blocks/'+pid+'/children?page_size=100')
        for b in r.get('results',[]):
            if b['type']=='child_page':
                out.append((b['child_page']['title'], b['id']))
                walk(b['id'],depth+1)
    walk(ROOT)
    return out

def first_callout(pid):
    r=api('GET','/blocks/'+pid+'/children?page_size=50')
    for b in r.get('results',[]):
        if b['type']=='callout': return b['id']
    return None

pages=all_pages()
print(f'페이지 {len(pages)}개 검색됨\n')
done=0
for key,text in USAGE:
    # 키워드가 제목에 든 페이지 찾기 (가장 먼저 매칭되는 것)
    pid=next((i for nm,i in pages if key in nm), None)
    if not pid:
        print(f'⚠️ 못 찾음(키워드 "{key}")'); continue
    cb=first_callout(pid)
    co={'callout':{'rich_text':[{'type':'text','text':{'content':text}}],
        'icon':{'type':'emoji','emoji':'📖'},'color':'blue_background'}}
    if cb:
        r=api('PATCH','/blocks/'+cb, co)
    else:
        r=api('PATCH','/blocks/'+pid+'/children',{'children':[{'type':'callout',**co}]})
    print(('✅ ' if ('id' in r or 'results' in r) else '실패 ')+key)
    if 'id' in r or 'results' in r: done+=1
print(f'\n완료: {done}/{len(USAGE)}개. 노션 새로고침(Ctrl+R)하면 회색→파란 안내 박스로 사용법이 보여요.')

"""
notion_usage.py — 각 DB에 직원용 '사용법' 설명(description) 추가
- 이름으로 DB를 찾아 description(제목 아래 안내문)을 설정
- 재실행해도 안전(덮어쓰기). 새 'JM 업무 시스템'의 DB들 대상
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

# 모든 DB 한번에 가져오기 (이름→id)
def all_dbs():
    out={}
    res=api('POST','/search',{'filter':{'property':'object','value':'database'},'page_size':100})
    for db in res.get('results',[]):
        if db.get('in_trash') or db.get('archived'): continue
        nm=''.join(t.get('plain_text','') for t in db.get('title',[]))
        out.setdefault(nm, db['id'])   # 첫 번째(새 시스템) 사용
    return out

def set_desc(dbid, text):
    return api('PATCH','/databases/'+dbid,{'description':[{'type':'text','text':{'content':text}}]})

USAGE={
 '진행중인 현장':'현장 카드를 클릭하면 사진·도면·3D·미팅·공정이 모두 보여요. 새 현장은 우측 "새로 만들기". 공사가 끝나면 진행단계를 "완공"으로 바꾸면 "완료 현장" 보기로 자동 분류돼요.',
 '공정 일정':'현장별 공정(목공·타일·청소 등)의 예정일과 담당자를 기록. 끝나면 상태를 "완료"로 옮기세요. 보드에서 예정→진행중→완료가 한눈에 보여요.',
 '업무 현황':'각자 맡은 업무를 카드로 관리. 본인 업무의 상태(대기/진행중/완료)는 본인이 직접 바꿔주세요.',
 '현장 경비·영수증':'쓴 영수증 사진을 올리고 금액·사용처·현장을 기록하세요. 사진만 올려도 됩니다. 정산되면 상태를 "정산완료"로.',
 '출금 요청 관리':'일용직 일당·거래처 대금 등 출금이 필요하면 등록하세요. 대표가 확인 후 처리합니다(실제 결제는 경리나라).',
 'SNS·블로그 발행':'현장별 블로그(디자인·시공·마감편)·인스타 계획과 발행 여부를 체크. 발행하면 상태를 "발행완료"로 바꾸세요.',
 '자재·발주 관리':'현장별 자재 발주·입고 상태를 기록하는 곳입니다.',
 'A/S 관리':'하자·민원을 접수하고 처리 상태(접수→처리중→완료)를 기록하세요.',
 '협력업체 관리':'전기·타일·목공 등 협력업체 연락처와 단가를 모아두는 주소록입니다.',
 '공지사항':'회사 공지와 업무 매뉴얼. 신입도 여기서 한눈에 확인. 읽었으면 확인 체크하세요.',
 '직원 명부':'직원 인적사항·계좌·계약 정보. 🔴 관리자 전용입니다.',
 '근태 기록':'출퇴근·지각·조퇴·결근·연차 기록. 🔴 관리자 전용입니다.',
 '수입·지출 내역':'회사 매출·매입 흐름. 고정비/변동비/현장원가로 분류. 세부 회계는 경리나라. 🔴 관리자 전용.',
 '현장별 재무':'현장별 계약금액·총지출·수익. 총지출을 입력하면 수익이 자동 계산돼요(계약금액-총지출). 🔴 관리자 전용.',
 '고객 CRM':'고객 의뢰·상담·계약·연락처 관리. 🔴 관리자 전용입니다.',
 '견적 현황':'견적 작성·발송·성사 여부를 관리. 🔴 관리자 전용입니다.',
 '공사 아카이브':'완료한 공사 기록(포트폴리오). 완성 사진·도면 보관. 🔴 관리자 전용.',
}

print('DB 목록 가져오는 중...')
dbs=all_dbs()
print(f'  발견 DB {len(dbs)}개')
ok=0; miss=[]
for name,text in USAGE.items():
    did=dbs.get(name)
    if not did:
        miss.append(name); print(f'  ⚠️ 못 찾음: {name}'); continue
    r=set_desc(did,text)
    if 'id' in r or 'object' in r:
        ok+=1; print(f'  ✅ {name}')
    else:
        print(f'  실패: {name}')
print(f'\n완료: {ok}개 적용' + (f' / 못 찾음 {len(miss)}: {miss}' if miss else ''))
print('노션에서 각 DB 제목 아래에 안내문이 보이면 성공이에요(앱 새로고침).')

"""
notion_v9_spec.py — 14개 필수항목 갭 채우기 (신규/보강)
③ 공정 일정 DB 신규 (현장별 공정×예정일×담당자)
② 마스터: 비포사진 / 구매물품 링크 추가
④ SNS: 포스팅 종류 추가
⑥ 직원 명부: 퇴사일·계좌번호·계약형태·기본급 추가
⑦ 수입·지출: 비용성격(고정/변동) 추가
⑪⑫ 디자인팀·시공팀 매뉴얼 페이지 신규
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

SITE='37d089e9-0a52-81e7-834c-e9ef6fb235ea'        # 진행중인 현장(마스터)
MGMT='37d089e9-0a52-815d-a402-db252a8959a8'        # 🏗️ 현장 관리
LIB ='376089e9-0a52-816f-8598-ec3beb2aaf77'        # 회사 자료실

def find_db(name):
    res=api('POST','/search',{'filter':{'property':'object','value':'database'},'page_size':100})
    for db in res['results']:
        if ''.join(t.get('plain_text','') for t in db.get('title',[]))==name: return db['id']
    return None

def idb(pid,title,emoji,props):
    return api('POST','/databases',{'parent':{'type':'page_id','page_id':pid},
      'icon':{'type':'emoji','emoji':emoji},'is_inline':True,
      'title':[{'text':{'content':title}}],'properties':props})

# ③ 공정 일정 DB (중복 생성 방지)
print('③ 공정 일정 DB...')
if find_db('공정 일정'):
    print('   이미 있음 — 건너뜀')
else:
    PHASE=['🔵 상담','🎨 디자인','📝 견적','🔧 설비','⚡ 전기','🪵 목공','🧱 수장','⬜ 바닥','🛋️ 가구','🧹 입주청소']
    r=idb(MGMT,'공정 일정','🗓️',{
      '공정':{'title':{}},
      '현장':{'relation':{'database_id':SITE,'single_property':{}}},
      '공정종류':{'select':{'options':[{'name':n} for n in PHASE]}},
      '예정일':{'date':{}},
      '완료일':{'date':{}},
      '담당자':{'rich_text':{}},
      '상태':{'select':{'options':[{'name':'⚪ 예정','color':'gray'},{'name':'🔵 진행중','color':'blue'},
              {'name':'🟢 완료','color':'green'},{'name':'🔴 지연','color':'red'}]}},
      '비고':{'rich_text':{}},
    })
    print('   ✅ 생성' if 'id' in r else '   실패')

# ② 마스터 보강
print('② 마스터: 비포사진/구매물품 링크...')
api('PATCH','/databases/'+SITE,{'properties':{
    '📷 비포 사진':{'files':{}},
    '🛒 구매물품 링크':{'url':{}},
}})
print('   완료')

# ④ SNS 보강
print('④ SNS: 포스팅 종류...')
sns=find_db('SNS 발행 현황')
api('PATCH','/databases/'+sns,{'properties':{'포스팅 종류':{'select':{'options':[
    {'name':'디자인','color':'purple'},{'name':'시공','color':'orange'},{'name':'마감','color':'green'},
    {'name':'인스타피드','color':'pink'},{'name':'릴스','color':'red'},{'name':'기타','color':'gray'}]}}}})
print('   완료')

# ⑥ 직원 명부 보강
print('⑥ 직원 명부: 퇴사일/계좌번호/계약형태/기본급...')
emp=find_db('직원 명부')
api('PATCH','/databases/'+emp,{'properties':{
    '퇴사일':{'date':{}},
    '계좌번호':{'rich_text':{}},
    '계약형태':{'select':{'options':[{'name':'정규직','color':'blue'},{'name':'계약직','color':'yellow'},{'name':'일용직','color':'gray'}]}},
    '기본급':{'number':{'format':'won'}},
}})
print('   완료')

# ⑦ 수입·지출 보강
print('⑦ 수입·지출: 비용성격(고정/변동)...')
acc=find_db('수입·지출 내역')
api('PATCH','/databases/'+acc,{'properties':{'비용성격':{'select':{'options':[
    {'name':'고정비','color':'red'},{'name':'변동비','color':'orange'},{'name':'현장원가','color':'blue'},{'name':'해당없음','color':'gray'}]}}}})
print('   완료')

# ⑪⑫ 매뉴얼 페이지
def manual_page(title,emoji,sections):
    blocks=[{'type':'callout','callout':{'icon':{'type':'emoji','emoji':'📖'},'color':'gray_background',
             'rich_text':[{'text':{'content':'신입도 한눈에 볼 수 있는 업무 매뉴얼입니다. 각 항목을 펼쳐 작성하세요.'}}]}}]
    for s in sections:
        blocks.append({'type':'toggle','toggle':{'rich_text':[{'text':{'content':s}}],
            'children':[{'type':'paragraph','paragraph':{'rich_text':[{'text':{'content':'(내용 작성)'}}]}}]}})
    return api('POST','/pages',{'parent':{'type':'page_id','page_id':LIB},
        'icon':{'type':'emoji','emoji':emoji},
        'properties':{'title':{'title':[{'text':{'content':title}}]}},'children':blocks})

print('⑪ 디자인팀 매뉴얼...')
manual_page('🎨 디자인팀 매뉴얼','🎨',
    ['상담·미팅 진행 방법','실측·도면 작성 기준','3D·컨셉 제안 프로세스','견적 산출 기준','고객 자료 정리/공유 규칙','자주 쓰는 자재·마감재'])
print('   완료')
print('⑫ 시공팀 매뉴얼...')
manual_page('🔧 시공팀 매뉴얼','🔧',
    ['공정 순서 표준(상담~입주청소)','현장 안전 수칙','공종별 시공 체크리스트','자재 발주·입고 절차','영수증·출금 처리 방법','하자/AS 대응 절차'])
print('   완료')

print('\n✅ v9 적용 완료')


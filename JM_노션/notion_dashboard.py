"""
notion_dashboard.py
─────────────────────────────────────────────
전 직원 협업툴 — 깨끗한 통합 대시보드 재구성
  - 🏠 JM 통합 대시보드 (전 직원): 진행중 현장 + 업무 현황 (돈 정보 없음)
  - 🔴 재무 현황 (대표·이사 전용): 계약금액·경비·출금·수익 자동집계
  - 경비/출금/업무 → 현장 DB 연결, 재무는 별도 분리
"""
import urllib.request, json

TOKEN='ntn_H23137511225x1Um9OQaYDJW1V7e0AGk3dAO7z2znnhewK'
HUB='376089e9-0a52-8015-ba56-f0837a19d29a'
EXPEN='37d089e9-0a52-814b-82bc-ff7dffbda124'   # 경비·영수증
PAYOU='37d089e9-0a52-818d-bc2d-de8f73abc1ac'   # 출금 요청
OLD_BOARD='37d089e9-0a52-81d4-a300-db3a4016db73' # 옛 현황판(돈 섞임) → 보관
OLD_STAFF='37d089e9-0a52-81b0-938f-f5ea760a77a5' # 옛 직원업무 → 보관

# 기존 섹션 (빠른 이동 링크용)
RECEIPT='37d089e9-0a52-81d2-a468-f4129ce32861'
PAYOUT_PG='37d089e9-0a52-81a1-8915-c279bf034c98'
GUIDE='37d089e9-0a52-8189-b182-efb8e91b1c73'
SITE_HUB='37d089e9-0a52-815d-a402-db252a8959a8'
SEC={'crm':'376089e9-0a52-81c5-a945-d6ca14b09ee2','marketing':'376089e9-0a52-8162-be4b-da3ec2e4f3a9',
     'archive':'376089e9-0a52-81e4-8b74-f51dd3e04d67','as':'376089e9-0a52-816d-8f8b-deeb91860dca',
     'notice':'376089e9-0a52-81b1-8299-e963c9dbb8e9','partner':'376089e9-0a52-81bb-ab62-d204f6c0b904',
     'company':'376089e9-0a52-816f-8598-ec3beb2aaf77','material':'376089e9-0a52-8101-be42-dd6f86b42ee1'}

H={'Authorization':f'Bearer {TOKEN}','Notion-Version':'2022-06-28','Content-Type':'application/json'}
def api(m,e,d=None):
    b=json.dumps(d,ensure_ascii=False).encode() if d else None
    r=urllib.request.Request(f'https://api.notion.com/v1{e}',data=b,headers=H,method=m)
    try:
        with urllib.request.urlopen(r) as x: return json.loads(x.read())
    except urllib.error.HTTPError as ex:
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:120]); return err

def page(pid,title,emoji): return api('POST','/pages',{'parent':{'type':'page_id','page_id':pid},
    'icon':{'type':'emoji','emoji':emoji},'properties':{'title':{'title':[{'text':{'content':title}}]}}})
def add(pid,blk): return api('PATCH',f'/blocks/{pid}/children',{'children':blk})
def idb(pid,title,emoji,props): return api('POST','/databases',{'parent':{'type':'page_id','page_id':pid},
    'icon':{'type':'emoji','emoji':emoji},'is_inline':True,'title':[{'text':{'content':title}}],'properties':props})
def h2(t): return {'type':'heading_2','heading_2':{'rich_text':[{'text':{'content':t}}]}}
def h3(t): return {'type':'heading_3','heading_3':{'rich_text':[{'text':{'content':t}}]}}
def para(t,c='default'): return {'type':'paragraph','paragraph':{'rich_text':[{'text':{'content':t},'annotations':{'color':c}}]}}
def co(t,e,c='gray_background'): return {'type':'callout','callout':{'rich_text':[{'text':{'content':t}}],'icon':{'type':'emoji','emoji':e},'color':c}}
def dv(): return {'type':'divider','divider':{}}
def lk(pid,label): return {'type':'bulleted_list_item','bulleted_list_item':{'rich_text':[{
    'type':'mention','mention':{'type':'page','page':{'id':pid}},'plain_text':label,
    'href':f'https://notion.so/{pid.replace(chr(45),chr(45))}'}]}}
def cols(c1,c2): return {'type':'column_list','column_list':{'children':[
    {'type':'column','column':{'children':c1}},{'type':'column','column':{'children':c2}}]}}

# ── 옛 현황판/직원업무 DB 보관 처리 (돈 섞인 공개 보드 제거) ──
print("0. 옛 현황판·직원업무 보관 처리...")
api('PATCH',f'/databases/{OLD_BOARD}',{'archived':True})
api('PATCH',f'/databases/{OLD_STAFF}',{'archived':True})
print("   완료")

# ══ 1. 대시보드 페이지 ══
print("1. 🏠 통합 대시보드 페이지 생성...")
dash=page(HUB,'🏠 JM 통합 대시보드','🏠')
D=dash['id']; print("   ID:",D)
add(D,[
    co('회사 전체 현황을 한눈에. 이 페이지를 즐겨찾기 해두고 매일 여기서 시작하세요.','🏠','blue_background'),
    co('진행단계·업무를 바꾸면 모두에게 실시간 반영됩니다. 계약금액·수익 등 재무는 대표·이사 전용 페이지에 따로 있습니다.','ℹ️','gray_background'),
    dv(),
    h2('📍 진행중인 현장'),
    co('새 현장은 아래 + 새로 만들기. 진행단계를 바꾸면 현황이 갱신됩니다.','📍'),
])

# ── 현장 DB (공개, 돈 없음) ──
print("2. 현장 DB 생성...")
site=idb(D,'진행중인 현장','📍',{
    '현장명':{'title':{}},
    '진행단계':{'select':{'options':[
        {'name':'🔵 상담','color':'blue'},{'name':'🎨 디자인','color':'purple'},
        {'name':'📝 견적','color':'yellow'},{'name':'🟠 계약','color':'orange'},
        {'name':'🔨 시공','color':'red'},{'name':'✨ 마감','color':'pink'},
        {'name':'✅ 완공','color':'green'},{'name':'⏸️ 보류','color':'gray'}]}},
    '담당자':{'rich_text':{}},
    '고객명':{'rich_text':{}},
    '시작일':{'date':{}},
    '완료예정일':{'date':{}},
    '현장페이지':{'url':{}},
    '메모':{'rich_text':{}},
})
SITE=site['id']; print("   현장 DB:",SITE)

# ── 업무 DB (공개) ──
print("3. 업무 DB 생성...")
add(D,[dv(),h2('👷 업무 현황'),co('각자 맡은 업무와 진행상태. 본인 업무는 본인이 상태를 바꿔주세요.','👷')])
task=idb(D,'업무 현황','👷',{
    '업무내용':{'title':{}},
    '담당자':{'rich_text':{}},
    '구분':{'select':{'options':[
        {'name':'🎨 디자인','color':'purple'},{'name':'📝 견적','color':'yellow'},
        {'name':'🔨 시공','color':'red'},{'name':'✨ 마감','color':'pink'},
        {'name':'📋 기타','color':'gray'}]}},
    '진행상태':{'select':{'options':[
        {'name':'⚪ 대기','color':'gray'},{'name':'🔵 진행중','color':'blue'},{'name':'✅ 완료','color':'green'}]}},
    '예정일':{'date':{}},
    '현장연결':{'relation':{'database_id':SITE,'type':'dual_property','dual_property':{}}},
})
TASK=task['id']; print("   업무 DB:",TASK)

# ── 경비/출금 → 현장 연결 추가 ──
print("4. 경비·출금 → 현장 연결...")
for db in (EXPEN,PAYOU):
    api('PATCH',f'/databases/{db}',{'properties':{'현장연결':{'relation':{'database_id':SITE,'type':'dual_property','dual_property':{}}}}})
# 현장 DB의 synced 속성 이름 확인
s=api('GET',f'/databases/{SITE}')
relmap={}
for n,p in s['properties'].items():
    if p['type']=='relation': relmap[p['relation']['database_id'].replace('-','')]=n
exp_rel=relmap.get(EXPEN.replace('-','')); pay_rel=relmap.get(PAYOU.replace('-',''))
print("   경비연결=",exp_rel," 출금연결=",pay_rel)
# 현장 DB에 경비합계·출금합계 rollup (대표용 — 공개표엔 숨김 권장)
roll={}
if exp_rel: roll['경비합계']={'rollup':{'relation_property_name':exp_rel,'rollup_property_name':'금액','function':'sum'}}
if pay_rel: roll['출금합계']={'rollup':{'relation_property_name':pay_rel,'rollup_property_name':'금액','function':'sum'}}
if roll: api('PATCH',f'/databases/{SITE}',{'properties':roll})
print("   현장 DB rollup 추가:",list(roll.keys()))

# ── 빠른 이동 ──
add(D,[dv(),h2('🗂️ 빠른 이동'),cols(
    [h3('🔵 전 직원'),lk(SITE_HUB,'🏗️ 현장 자료실'),lk(RECEIPT,'📸 경비·영수증'),
     lk(PAYOUT_PG,'💸 출금 요청'),lk(SEC['crm'],'👥 고객 CRM'),lk(SEC['partner'],'🤝 협력업체'),
     lk(SEC['material'],'🛒 자재·발주')],
    [h3('🔵 전 직원'),lk(SEC['marketing'],'📣 마케팅'),lk(SEC['archive'],'📷 현장 아카이브'),
     lk(SEC['as'],'🔧 A/S'),lk(SEC['notice'],'📢 공지사항'),lk(SEC['company'],'🏢 회사 자료실'),
     lk(GUIDE,'⚙️ 설정·권한 가이드')])])

# ══ 5. 재무 현황 (대표·이사 전용) ══
print("5. 💰 재무 현황 페이지(대표·이사 전용) 생성...")
fin=page(HUB,'💰 재무 현황 (대표·이사 전용)','💰')
F=fin['id']; print("   ID:",F)
add(F,[co('⚠️ 대표·이사 전용. 직원(게스트)을 이 페이지에 초대하지 마세요.','🔒','red_background'),
    co('각 현장의 계약금액·경비·출금·수익을 자동 집계합니다. 현장 칸에서 현장을 선택하면 연동됩니다.','💰','blue_background'),
    dv(),h2('💰 현장별 재무')])
# 재무 DB: 현장(relation 1:1) + 계약금액 + rollup + 수익
findb=api('POST','/databases',{'parent':{'type':'page_id','page_id':F},
    'icon':{'type':'emoji','emoji':'💰'},'is_inline':True,'title':[{'text':{'content':'현장별 재무'}}],
    'properties':{
        '현장명':{'title':{}},
        '현장':{'relation':{'database_id':SITE,'type':'dual_property','dual_property':{}}},
        '계약금액':{'number':{'format':'won'}},
        '입금상태':{'select':{'options':[
            {'name':'🟡 계약금','color':'yellow'},{'name':'🔵 중도금','color':'blue'},
            {'name':'🟢 잔금완료','color':'green'},{'name':'🔴 미수금','color':'red'}]}},
    }})
FIN=findb['id']; print("   재무 DB:",FIN)
# 재무 DB의 현장 relation 이름 확인 후 rollup(경비합계/출금합계 via 현장)
fdb=api('GET',f'/databases/{FIN}')
fin_site_rel=None
for n,p in fdb['properties'].items():
    if p['type']=='relation' and p['relation']['database_id'].replace('-','')==SITE.replace('-',''):
        fin_site_rel=n
print("   재무→현장 연결속성:",fin_site_rel)
if fin_site_rel:
    r=api('PATCH',f'/databases/{FIN}',{'properties':{
        '경비합계':{'rollup':{'relation_property_name':fin_site_rel,'rollup_property_name':'경비합계','function':'sum'}},
        '출금합계':{'rollup':{'relation_property_name':fin_site_rel,'rollup_property_name':'출금합계','function':'sum'}},
    }})
    if r.get('object')!='error':
        print("   재무 rollup OK")
        api('PATCH',f'/databases/{FIN}',{'properties':{
            '수익':{'formula':{'expression':'prop("계약금액") - prop("경비합계") - prop("출금합계")'}}}})
        print("   수익 formula OK")

print("\n✅ 완료!")
print(f"🏠 통합 대시보드:  https://notion.so/{D.replace('-','')}")
print(f"💰 재무 현황:      https://notion.so/{F.replace('-','')}")
print(f"\nSITE_DB={SITE}\nTASK_DB={TASK}\nFIN_DB={FIN}")

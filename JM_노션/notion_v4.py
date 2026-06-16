"""
notion_v4.py — 권한 3단계 재편 (1단계: API)
- 진행단계/업무구분 9단계로 변경
- SNS 발행 현황 DB 신규
- 직원 명부(인사관리) DB 신규
- 권한 3폴더 생성 (전 직원 / 현장팀·경영자 / 경영자 전용)
"""
import urllib.request, json

from notion_auth import TOKEN
HUB='376089e9-0a52-8015-ba56-f0837a19d29a'
SITE_DB='37d089e9-0a52-81e7-834c-e9ef6fb235ea'   # 진행중인 현장
TASK_DB='37d089e9-0a52-8177-ab3c-e59e8e0a0862'   # 업무 현황

H={'Authorization':f'Bearer {TOKEN}','Notion-Version':'2022-06-28','Content-Type':'application/json'}
def api(m,e,d=None):
    b=json.dumps(d,ensure_ascii=False).encode() if d else None
    r=urllib.request.Request(f'https://api.notion.com/v1{e}',data=b,headers=H,method=m)
    try:
        with urllib.request.urlopen(r) as x: return json.loads(x.read())
    except urllib.error.HTTPError as ex:
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:120]); return err

def page(pid,title,emoji,blocks=None):
    d={'parent':{'type':'page_id','page_id':pid},'icon':{'type':'emoji','emoji':emoji},
       'properties':{'title':{'title':[{'text':{'content':title}}]}}}
    if blocks: d['children']=blocks
    return api('POST','/pages',d)
def idb(pid,title,emoji,props):
    return api('POST','/databases',{'parent':{'type':'page_id','page_id':pid},
      'icon':{'type':'emoji','emoji':emoji},'is_inline':True,
      'title':[{'text':{'content':title}}],'properties':props})
def co(t,e,c='gray_background'): return {'type':'callout','callout':{'rich_text':[{'text':{'content':t}}],'icon':{'type':'emoji','emoji':e},'color':c}}
def h2(t): return {'type':'heading_2','heading_2':{'rich_text':[{'text':{'content':t}}]}}

# 9단계 공정
PHASES=[('🔵 상담','blue'),('🎨 디자인','purple'),('📝 견적','yellow'),('🔧 설비','blue'),
        ('⚡ 전기','orange'),('🪵 목공','brown'),('🧱 수장작업','red'),('⬜ 바닥','default'),
        ('🛋️ 가구설치','green'),('🧹 입주청소','pink'),('✅ 완공','green')]
PHASE_OPTS=[{'name':n,'color':c} for n,c in PHASES]

print("1. 진행단계 9단계로 변경 (현장 DB)...")
# 기존 옵션 유지하며 신규 추가(in-use 제거 에러 방지)
api('PATCH',f'/databases/{SITE_DB}',{'properties':{'진행단계':{'select':{'options':PHASE_OPTS+[
    {'name':'🔨 시공','color':'red'},{'name':'✨ 마감','color':'pink'},{'name':'⏸️ 보류','color':'gray'}]}}}})
# 샘플 행 신규 단계로 업데이트
rows=api('POST',f'/databases/{SITE_DB}/query',{})
for r in rows.get('results',[]):
    st=r['properties'].get('진행단계',{}).get('select')
    if st and st['name'] in ('🔨 시공','✨ 마감'):
        api('PATCH','/pages/'+r['id'],{'properties':{'진행단계':{'select':{'name':'🪵 목공'}}}})
# 깔끔하게 9단계+보류만
api('PATCH',f'/databases/{SITE_DB}',{'properties':{'진행단계':{'select':{'options':PHASE_OPTS+[{'name':'⏸️ 보류','color':'gray'}]}}}})
print("   완료")

print("2. 업무 구분 9단계로 변경 (업무 DB)...")
api('PATCH',f'/databases/{TASK_DB}',{'properties':{'구분':{'select':{'options':PHASE_OPTS+[
    {'name':'🎨 디자인','color':'purple'},{'name':'🔨 시공','color':'red'},{'name':'✨ 마감','color':'pink'},
    {'name':'📋 기타','color':'gray'}]}}}})
rows=api('POST',f'/databases/{TASK_DB}/query',{})
mapping={'🔨 시공':'🪵 목공','✨ 마감':'🛋️ 가구설치'}
for r in rows.get('results',[]):
    g=r['properties'].get('구분',{}).get('select')
    if g and g['name'] in mapping:
        api('PATCH','/pages/'+r['id'],{'properties':{'구분':{'select':{'name':mapping[g['name']]}}}})
api('PATCH',f'/databases/{TASK_DB}',{'properties':{'구분':{'select':{'options':PHASE_OPTS+[{'name':'📋 기타','color':'gray'}]}}}})
print("   완료")

# ── 권한 3폴더 생성 ──
print("3. 권한 3폴더 생성...")
t1=page(HUB,'🟢 전 직원 공유','🟢',[co('전 직원이 보는 공간입니다. 직원을 이 폴더에 게스트로 초대하세요.','🟢','green_background')])
t2=page(HUB,'🟡 현장팀·경영자','🟡',[co('현장팀과 대표·이사만 봅니다. 영수증·출금 등 비용 관련.','🟡','yellow_background')])
t3=page(HUB,'🔴 경영자 전용','🔴',[co('⚠️ 대표·이사 전용. 직원을 초대하지 마세요. 매출·수익·인사·고객.','🔴','red_background')])
T1,T2,T3=t1['id'],t2['id'],t3['id']
print(f"   전직원={T1}\n   현장팀={T2}\n   경영자={T3}")

# ── SNS 발행 현황 DB (전 직원) ──
print("4. SNS 발행 현황 DB 생성...")
sns_pg=page(T1,'📱 SNS 발행 현황','📱',[co('블로그·인스타·페북 등 채널별로 어디까지 발행됐는지 한눈에. 현장별 마케팅 진행 상황.','📱','blue_background')])
idb(sns_pg['id'],'SNS 발행 현황','📱',{
    '제목':{'title':{}},
    '현장명':{'rich_text':{}},
    '채널':{'multi_select':{'options':[
        {'name':'블로그','color':'green'},{'name':'인스타그램','color':'pink'},
        {'name':'페이스북','color':'blue'},{'name':'유튜브','color':'red'},{'name':'카카오','color':'yellow'}]}},
    '상태':{'select':{'options':[
        {'name':'⚪ 예정','color':'gray'},{'name':'🔵 작성중','color':'blue'},
        {'name':'📷 촬영완료','color':'orange'},{'name':'✅ 발행완료','color':'green'}]}},
    '발행일':{'date':{}},
    '링크':{'url':{}},
    '담당자':{'rich_text':{}},
    '비고':{'rich_text':{}},
})
print("   완료")

# ── 직원 명부(인사관리) DB (경영자 전용) ──
print("5. 직원 명부(인사관리) DB 생성...")
hr_pg=page(T3,'👔 인사관리 (직원 명부)','👔',[co('직원 인적사항 관리. 사진·연락처·입사일·직무 등. 대표·이사 전용.','👔','red_background')])
idb(hr_pg['id'],'직원 명부','👔',{
    '이름':{'title':{}},
    '직무':{'select':{'options':[
        {'name':'대표','color':'red'},{'name':'이사','color':'orange'},{'name':'현장소장','color':'blue'},
        {'name':'디자이너','color':'purple'},{'name':'시공기사','color':'brown'},
        {'name':'사무','color':'green'},{'name':'기타','color':'gray'}]}},
    '연락처':{'phone_number':{}},
    '이메일':{'email':{}},
    '입사일':{'date':{}},
    '사진':{'files':{}},
    '비상연락처':{'rich_text':{}},
    '4대보험':{'checkbox':{}},
    '비고':{'rich_text':{}},
})
print("   완료")

print("\n✅ 1단계 완료!")
print(f"전직원 폴더:  https://notion.so/{T1.replace('-','')}")
print(f"현장팀 폴더:  https://notion.so/{T2.replace('-','')}")
print(f"경영자 폴더:  https://notion.so/{T3.replace('-','')}")
print(f"\nT1={T1}\nT2={T2}\nT3={T3}")


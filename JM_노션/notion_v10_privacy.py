"""
notion_v10_privacy.py — 권한 분리 수정
문제: 전직원 '진행중인 현장'에 경비/출금/재무 금액이 노출됨(노션은 열단위 권한 불가)
수정:
 1) 전직원 현장에서 경비합계·출금합계·총지출 삭제
 2) 경비/출금/재무/회계 → 현장 관계를 단방향으로 (현장 카드에 금액열 사라짐)
 3) 현장별 재무(관리자): 총지출=관리자 직접입력(number), 수익=계약금액-총지출
운영정보(공정/업무/SNS/자재/AS)는 유지(민감 아님)
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
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:170]); return err

SITE='381089e9-0a52-8197-9ffc-dc38e1265436'
EXP ='381089e9-0a52-8134-8fe2-c9dcc8721b54'
WDR ='381089e9-0a52-81bb-9808-ee7505300a94'
FIN ='381089e9-0a52-81df-8a75-e1fd3f8cce32'
ACC ='381089e9-0a52-81c2-9243-e09a77c3bac4'

# 1) 현장에서 금액 롤업/공식 삭제
print('1. 전직원 현장에서 경비합계·출금합계·총지출 삭제...')
api('PATCH','/databases/'+SITE,{'properties':{'경비합계':None,'출금합계':None,'총지출':None}})
print('   완료')

# 2) 금액 DB들의 현장 관계를 단방향으로 → 현장 카드의 back-relation 열 제거
print('2. 경비/출금/재무/회계 → 현장 관계를 단방향으로...')
for nm,dbid in [('경비',EXP),('출금',WDR),('재무',FIN),('회계',ACC)]:
    db=api('GET','/databases/'+dbid)['properties']
    relname=next((pn for pn,pv in db.items() if pv['type']=='relation' and pv['relation']['database_id'].replace('-','')==SITE.replace('-','')),None)
    if relname:
        r=api('PATCH','/databases/'+dbid,{'properties':{relname:{'relation':{'database_id':SITE,'type':'single_property','single_property':{}}}}})
        print(f'   {nm}: {relname} → 단방향 {"OK" if "properties" in r else "실패"}')
    else:
        print(f'   {nm}: 현장 관계 없음')

# 3) 재무: 총지출을 관리자 입력 number로, 수익 공식 유지
print('3. 현장별 재무: 총지출=number(관리자 입력), 수익=계약금액-총지출...')
# 기존 총지출이 rollup이면 삭제 후 number 재생성
fd=api('GET','/databases/'+FIN)['properties']
if fd.get('총지출',{}).get('type')=='rollup':
    api('PATCH','/databases/'+FIN,{'properties':{'총지출':None}})
api('PATCH','/databases/'+FIN,{'properties':{'총지출':{'number':{'format':'won'}}}})
api('PATCH','/databases/'+FIN,{'properties':{'수익':{'formula':{'expression':'prop("계약금액") - prop("총지출")'}}}})
print('   완료')

# 예시 재무행 총지출 값 채워서 데모 유지
rows=api('POST','/databases/'+FIN+'/query',{}).get('results',[])
if rows:
    api('PATCH','/pages/'+rows[0]['id'],{'properties':{'총지출':{'number':408000}}})
    print('   예시 재무행 총지출=408,000 입력')

# 검증
print('\n검증 — 전직원 현장에 남은 민감열:')
left=[pn for pn,pv in api('GET','/databases/'+SITE)['properties'].items()
      if pv['type'] in('rollup','formula') or (pv['type']=='relation' and any(k in pn for k in('경비','출금','재무','수입','지출')))]
print('   ', left if left else '✅ 없음 (금액/재무 열 모두 제거됨)')
print('전직원 현장 최종 열:')
for pn in api('GET','/databases/'+SITE)['properties']: print('   -',pn)


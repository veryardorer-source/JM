"""
notion_relations.py
─────────────────────────────────────────────
플러스 플랜 전용 — DB 연결(Relation) + 자동집계(Rollup)
현장 현황판(master)에서 각 현장의 경비합계·출금합계·업무건수를 자동 집계.
"""
import urllib.request, json

from notion_auth import TOKEN
BOARD='37d089e9-0a52-81d4-a300-db3a4016db73'   # 현장 현황판 (master)
STAFF='37d089e9-0a52-81b0-938f-f5ea760a77a5'   # 직원 업무 현황
EXPEN='37d089e9-0a52-814b-82bc-ff7dffbda124'   # 경비·영수증
PAYOU='37d089e9-0a52-818d-bc2d-de8f73abc1ac'   # 출금 요청

H={'Authorization':f'Bearer {TOKEN}','Notion-Version':'2022-06-28','Content-Type':'application/json'}
def api(m,e,d=None):
    b=json.dumps(d,ensure_ascii=False).encode() if d else None
    r=urllib.request.Request(f'https://api.notion.com/v1{e}',data=b,headers=H,method=m)
    try:
        with urllib.request.urlopen(r) as x: return json.loads(x.read())
    except urllib.error.HTTPError as ex:
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:120]); return err

# ── 1. board(현황판)에 계약금액·입금상태 필드 추가 ──
print("1. 현황판에 계약금액·입금상태 추가...")
api('PATCH', f'/databases/{BOARD}', {"properties": {
    "계약금액": {"number": {"format": "won"}},
    "입금상태": {"select": {"options": [
        {"name":"🟡 계약금","color":"yellow"},
        {"name":"🔵 중도금","color":"blue"},
        {"name":"🟢 잔금완료","color":"green"},
        {"name":"🔴 미수금","color":"red"}]}},
}})
print("   완료")

# ── 2. 경비·출금·직원업무 → 현황판 연결(Relation, dual) ──
print("2. DB 연결(Relation) 생성...")
for name, db, prop in [("경비",EXPEN,"연결현장"),("출금",PAYOU,"연결현장"),("직원업무",STAFF,"연결현장")]:
    r=api('PATCH', f'/databases/{db}', {"properties": {
        prop: {"relation": {"database_id": BOARD, "type":"dual_property", "dual_property": {}}}
    }})
    if r.get('object')!='error':
        print(f"   {name} → 현황판 연결 OK")

# ── 3. 현황판의 synced relation 속성 이름 확인 ──
print("3. 현황판 연결 속성 이름 확인...")
b=api('GET', f'/databases/{BOARD}')
rel_props=[n for n,p in b['properties'].items() if p['type']=='relation']
print("   연결 속성들:", rel_props)

# 각 연결이 어느 DB를 가리키는지 매핑
rel_map={}
for n,p in b['properties'].items():
    if p['type']=='relation':
        rel_map[p['relation']['database_id'].replace('-','')]=n
exp_rel=rel_map.get(EXPEN.replace('-',''))
pay_rel=rel_map.get(PAYOU.replace('-',''))
stf_rel=rel_map.get(STAFF.replace('-',''))
print(f"   경비연결={exp_rel} / 출금연결={pay_rel} / 업무연결={stf_rel}")

# ── 4. 현황판에 Rollup(자동집계) 추가 ──
print("4. 자동집계(Rollup) 추가...")
rollups={}
if exp_rel:
    rollups["경비 합계"]={"rollup":{"relation_property_name":exp_rel,"rollup_property_name":"금액","function":"sum"}}
if pay_rel:
    rollups["출금 합계"]={"rollup":{"relation_property_name":pay_rel,"rollup_property_name":"금액","function":"sum"}}
if stf_rel:
    rollups["업무 건수"]={"rollup":{"relation_property_name":stf_rel,"rollup_property_name":"업무내용","function":"count"}}
if rollups:
    r=api('PATCH', f'/databases/{BOARD}', {"properties": rollups})
    if r.get('object')!='error':
        print("   Rollup 추가 OK:", list(rollups.keys()))

print("\n✅ 완료! 현황판에서 각 현장의 경비·출금·업무가 자동 집계됩니다.")
print(f"현황판: https://notion.so/{BOARD.replace('-','')}")


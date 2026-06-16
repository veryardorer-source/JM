"""audit.py — 전체 워크스페이스 정밀 감사 (구조/중복/연결)"""
import urllib.request, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from notion_auth import TOKEN
H={'Authorization':f'Bearer {TOKEN}','Notion-Version':'2022-06-28','Content-Type':'application/json'}
def api(m,e,d=None):
    b=json.dumps(d).encode() if d else None
    r=urllib.request.Request('https://api.notion.com/v1'+e,data=b,headers=H,method=m)
    try:
        with urllib.request.urlopen(r) as x: return json.loads(x.read())
    except urllib.error.HTTPError as ex: return json.loads(ex.read())

def ptitle(b):
    return b.get('child_page',{}).get('title') or b.get('child_database',{}).get('title') or ''

DBNAMES={}  # id -> name 수집 (relation 해석용)

def tree(pid, depth=0, maxd=3):
    if depth>maxd: return
    r=api('GET',f'/blocks/{pid}/children?page_size=100')
    for b in r.get('results',[]):
        t=b['type']
        if t=='child_page':
            print('  '*depth+'📄 '+ptitle(b)+'  ['+b['id'][:8]+']')
            if b.get('has_children'): tree(b['id'],depth+1,maxd)
        elif t=='child_database':
            nm=ptitle(b); DBNAMES[b['id'].replace('-','')]=nm
            print('  '*depth+'🗄️ '+nm+'  [DB '+b['id'][:8]+']')

HUB='376089e9-0a52-8015-ba56-f0837a19d29a'
print('################ 전체 페이지 트리 ################')
tree(HUB)

print('\n\n################ 모든 DB 스키마 + 연결 ################')
# search 로 워크스페이스 모든 DB 수집
res=api('POST','/search',{'filter':{'property':'object','value':'database'},'page_size':100})
dbs=res.get('results',[])
print(f'총 DB {len(dbs)}개\n')
for db in dbs:
    nm=''.join(t.get('plain_text','') for t in db.get('title',[]))
    DBNAMES[db['id'].replace('-','')]=nm
# 두 번째 패스: relation 타깃 이름 해석
for db in dbs:
    nm=''.join(t.get('plain_text','') for t in db.get('title',[]))
    par=db.get('parent',{})
    print(f"=== {nm}  [{db['id'][:8]}]  parent={par.get('type')}:{(par.get('page_id') or par.get('workspace') or '')}")
    for pn,pv in db.get('properties',{}).items():
        ty=pv['type']
        if ty=='relation':
            tgt=pv['relation']['database_id'].replace('-','')
            print(f"    🔗 {pn}: relation → {DBNAMES.get(tgt,tgt[:8])}")
        elif ty=='rollup':
            ro=pv['rollup']
            print(f"    Σ {pn}: rollup({ro.get('relation_property_name')} . {ro.get('rollup_property_name')} / {ro.get('function')})")
        elif ty=='formula':
            print(f"    ƒ {pn}: {pv['formula'].get('expression','')[:60]}")


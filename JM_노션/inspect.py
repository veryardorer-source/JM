"""inspect.py — 현재 노션 구조 점검 (남은 작업 대조용)"""
import urllib.request, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

TOKEN='ntn_H23137511225x1Um9OQaYDJW1V7e0AGk3dAO7z2znnhewK'
H={'Authorization':f'Bearer {TOKEN}','Notion-Version':'2022-06-28','Content-Type':'application/json'}
def api(m,e,d=None):
    b=json.dumps(d).encode() if d else None
    r=urllib.request.Request(f'https://api.notion.com/v1{e}',data=b,headers=H,method=m)
    try:
        with urllib.request.urlopen(r) as x: return json.loads(x.read())
    except urllib.error.HTTPError as ex: return json.loads(ex.read())

def title(b):
    t=b.get('child_page',{}).get('title') or b.get('child_database',{}).get('title')
    return t or b['type']

def kids(pid,label):
    print(f'\n== {label} ({pid[:8]}) ==')
    r=api('GET',f'/blocks/{pid}/children?page_size=100')
    if 'results' not in r:
        print('  ERR:', r.get('message','')[:100]); return
    for b in r.get('results',[]):
        if b['type'] in ('child_page','child_database'):
            print('  ', '[DB]' if b['type']=='child_database' else '[PG]', title(b), b['id'][:8])

HUB='376089e9-0a52-8015-ba56-f0837a19d29a'
folders=[('🟢 전직원','37d089e9-0a52-81b9-8596-fb091a1bce36'),
         ('🟡 현장팀','37d089e9-0a52-8167-a383-ec9d88e3c1b6'),
         ('🔴 경영자','37d089e9-0a52-8107-a71f-ea1b7ce8682e')]
kids(HUB,'HUB 메인')
for n,i in folders: kids(i,'폴더:'+n)

# DB 행 수 점검
print('\n== DB 데이터 현황 ==')
dbs=[('진행중인 현장','37d089e9-0a52-81e7-834c-e9ef6fb235ea'),
     ('업무 현황','37d089e9-0a52-8177-ab3c-e59e8e0a0862'),
     ('현장별 재무','37d089e9-0a52-811c-bcef-e10e1d15bdbc'),
     ('경비','37d089e9-0a52-814b-82bc-ff7dffbda124'),
     ('출금','37d089e9-0a52-818d-bc2d-de8f73abc1ac')]
for n,i in dbs:
    r=api('POST',f'/databases/{i}/query',{})
    cnt=len(r.get('results',[])) if 'results' in r else '?'
    print(f'  {n}: {cnt}행')

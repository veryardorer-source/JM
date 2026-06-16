"""inspect_cols.py — 컬럼 안 내용 덤프"""
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
def rt(b):
    o=b.get(b['type'],{})
    txt=''.join(t.get('plain_text','') for t in o.get('rich_text',[]))
    ic=o.get('icon',{}).get('emoji','')
    return (ic+' '+txt).strip()
def dump(pid, d=0):
    r=api('GET',f'/blocks/{pid}/children?page_size=100')
    for b in r.get('results',[]):
        t=b['type']
        print('  '*d + f'[{t}] {rt(b)}'[:90])
        if b.get('has_children') and t in('column_list','column'):
            dump(b['id'], d+1)
print('===== HUB 메인: 3열 메뉴 =====')
# find the column_list in HUB
r=api('GET','/blocks/376089e9-0a52-8015-ba56-f0837a19d29a/children?page_size=100')
for b in r['results']:
    if b['type']=='column_list':
        print('column_list', b['id'])
        dump(b['id'],1)
print('\n===== 통합 대시보드: 2열 =====')
r=api('GET','/blocks/37d089e9-0a52-81a3-a7c5-cac25d3bfa87/children?page_size=100')
for b in r['results']:
    if b['type']=='column_list':
        print('column_list', b['id'])
        dump(b['id'],1)

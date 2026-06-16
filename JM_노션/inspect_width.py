"""inspect_width.py — 모바일에서 가로로 넓어지는 블록(컬럼/표) 탐색"""
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

def walk(pid, depth=0, path=''):
    r=api('GET',f'/blocks/{pid}/children?page_size=100')
    if 'results' not in r: return
    cols=[b for b in r['results'] if b['type']=='column_list']
    for b in r['results']:
        t=b['type']
        if t=='column_list':
            # count columns
            cc=api('GET',f"/blocks/{b['id']}/children?page_size=50")
            ncol=len([x for x in cc.get('results',[]) if x['type']=='column'])
            print(f"{'  '*depth}⚠️ COLUMN_LIST: {ncol}개 컬럼  block={b['id'][:8]}  (부모:{path})")
            # show column widths if any
            for col in cc.get('results',[]):
                if col['type']=='column':
                    w=col.get('column',{}).get('width_ratio')
                    print(f"{'  '*(depth+1)}- column {col['id'][:8]} width_ratio={w}")
        elif t=='table':
            tw=b.get('table',{}).get('table_width')
            print(f"{'  '*depth}⚠️ TABLE: {tw}열  block={b['id'][:8]}  (부모:{path})")
        elif t=='child_page':
            # recurse one level into important pages only at top
            pass

PAGES=[('🏠 통합 대시보드','37d089e9-0a52-81a3-a7c5-cac25d3bfa87'),
       ('HUB 메인','376089e9-0a52-8015-ba56-f0837a19d29a'),
       ('💰 재무 현황','37d089e9-0a52-817a-a639-f4f5376ca392'),
       ('🏗️ 현장 관리','37d089e9-0a52-815d-a402-db252a8959a8'),
       ('⚙️ 설정·권한 가이드','37d089e9-0a52-8189-b182-efb8e91b1c73')]
for n,i in PAGES:
    print(f"\n===== {n} =====")
    walk(i, path=n)

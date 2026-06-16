"""
notion_v5_mobile.py — 모바일 가로폭 수정
다단(column_list) 메뉴를 세로 1단으로 펼침 → 모바일 웹에서 가로 스크롤/넓음 해소.
링크(페이지 멘션) 보존. 추가 → 삭제 순서(안전).
대상:
  - HUB 메인 3열 메뉴
  - 🏠 통합 대시보드 2열 (헤딩 중복은 1개로 병합)
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
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:150]); return err
def kids(bid):
    return api('GET',f'/blocks/{bid}/children?page_size=100').get('results',[])

def clean_rt(rich):
    """rich_text 재구성 — text(링크) / page 멘션만 보존"""
    out=[]
    for t in rich:
        ann=t.get('annotations',{})
        if t['type']=='mention' and t.get('mention',{}).get('type')=='page':
            out.append({'type':'mention','mention':{'page':{'id':t['mention']['page']['id']}},'annotations':ann})
        elif t['type']=='text':
            txt=t['text']
            out.append({'type':'text','text':{'content':txt.get('content',''),'link':txt.get('link')},'annotations':ann})
        else:  # 기타 멘션/방정식 등 → plain_text로 폴백
            out.append({'type':'text','text':{'content':t.get('plain_text','')},'annotations':ann})
    return out

def rebuild_block(b):
    t=b['type']
    rt=clean_rt(b[t].get('rich_text',[]))
    if t=='heading_3': return {'type':'heading_3','heading_3':{'rich_text':rt}}
    if t=='bulleted_list_item': return {'type':'bulleted_list_item','bulleted_list_item':{'rich_text':rt}}
    if t=='heading_2': return {'type':'heading_2','heading_2':{'rich_text':rt}}
    if t=='paragraph': return {'type':'paragraph','paragraph':{'rich_text':rt}}
    return {'type':'paragraph','paragraph':{'rich_text':rt}}

def flatten_columns(col_list_id, merge_dup_heading=False):
    """column_list 안의 모든 컬럼 내용을 순서대로 평탄화"""
    cols=kids(col_list_id)
    blocks=[]; last_head=None
    for col in cols:
        if col['type']!='column': continue
        for b in kids(col['id']):
            rb=rebuild_block(b)
            # 중복 헤딩 병합(대시보드)
            if merge_dup_heading and b['type'] in ('heading_3','heading_2'):
                txt=''.join(t.get('plain_text','') for t in b[b['type']].get('rich_text',[]))
                if txt==last_head: continue
                last_head=txt
            blocks.append(rb)
    return blocks

def fix(page_id, col_list_id, label, merge_dup=False):
    print(f'\n== {label} ==')
    blocks=flatten_columns(col_list_id, merge_dup)
    print(f'  평탄화 블록 {len(blocks)}개 → 추가 중...')
    r=api('PATCH',f'/blocks/{page_id}/children',{'children':blocks,'after':col_list_id})
    if 'results' not in r:
        print('  ❌ 추가 실패 — 삭제 생략'); return
    print(f'  ✅ 추가 완료 ({len(r["results"])}개). 기존 다단 삭제...')
    d=api('DELETE',f'/blocks/{col_list_id}')
    print('  ✅ 다단 삭제 완료' if d.get('id') else '  ⚠️ 삭제 확인 필요')

HUB='376089e9-0a52-8015-ba56-f0837a19d29a'
DASH='37d089e9-0a52-81a3-a7c5-cac25d3bfa87'

def find_col_list(pid):
    for b in kids(pid):
        if b['type']=='column_list': return b['id']
    return None

hub_cl=find_col_list(HUB)
dash_cl=find_col_list(DASH)
print('HUB column_list:', hub_cl)
print('DASH column_list:', dash_cl)
if hub_cl: fix(HUB, hub_cl, 'HUB 메인 3열 → 1단')
if dash_cl: fix(DASH, dash_cl, '통합 대시보드 2열 → 1단 (헤딩 병합)', merge_dup=True)
print('\n✅ 완료. 모바일에서 다시 확인해보세요.')


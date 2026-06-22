"""notion_decorate.py — 메인 대시보드 꾸미기 (커버/환영배너/바로가기)"""
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

ROOT='381089e9-0a52-81b5-83a3-c42ce799c0d6'

def find_child_page(parent_id, keyword):
    r=api('GET','/blocks/'+parent_id+'/children?page_size=100')
    for b in r.get('results',[]):
        if b['type']=='child_page' and keyword in b['child_page']['title']:
            return b['id']
    raise RuntimeError(f'페이지를 찾지 못했습니다: {keyword}')

def first_callout(page_id):
    r=api('GET','/blocks/'+page_id+'/children?page_size=50')
    for b in r.get('results',[]):
        if b['type']=='callout':
            return b['id']
    return None

def block_text(block):
    block_type=block['type']
    rich=block.get(block_type,{}).get('rich_text',[])
    return ''.join(t.get('plain_text','') for t in rich)

def has_heading(page_id, text):
    r=api('GET','/blocks/'+page_id+'/children?page_size=100')
    for b in r.get('results',[]):
        if b['type'] in ('heading_1','heading_2','heading_3') and text in block_text(b):
            return True
    return False

def top_blocks(page_id):
    return api('GET','/blocks/'+page_id+'/children?page_size=100').get('results',[])

def patch_mobile_section(page_id, blocks_to_apply):
    blocks=top_blocks(page_id)
    heading_index=next((i for i,b in enumerate(blocks)
        if b['type'] in ('heading_1','heading_2','heading_3') and '모바일 바로 시작' in block_text(b)), None)
    if heading_index is None:
        return False
    callouts=[b for b in blocks[heading_index+1:heading_index+5] if b['type']=='callout']
    desired=[b for b in blocks_to_apply if b['type']=='callout']
    for existing, target in zip(callouts, desired):
        api('PATCH','/blocks/'+existing['id'],{'callout':target['callout']})
    return True

DASH=find_child_page(ROOT, '메인 대시보드')
F_ALL=find_child_page(ROOT, '전 직원 공유')
F_SITE=find_child_page(ROOT, '현장팀')
F_MGR=find_child_page(ROOT, '관리자 전용')

# 1) 커버 이미지 (노션 그라데이션)
print('1. 커버 이미지...')
r=api('PATCH','/pages/'+DASH,{'cover':{'type':'external','external':{'url':'https://www.notion.so/images/page-cover/gradients_8.png'}}})
print('   '+('OK' if 'id' in r else '실패'))

# 2) 상단 환영 배너 콜아웃 교체
print('2. 환영 배너...')
welcome={'type':'callout','callout':{
    'rich_text':[{'type':'text','text':{'content':'제이엠건축인테리어 업무 시스템입니다. 직원은 휴대폰에서 이 화면만 열고 진행중인 현장, 공정 일정, 업무 현황 순서로 확인하면 됩니다.'}}],
    'icon':{'type':'emoji','emoji':'👋'},'color':'blue_background'}}
TOP_CALLOUT=first_callout(DASH)
r=api('PATCH','/blocks/'+TOP_CALLOUT,{'callout':welcome['callout']}) if TOP_CALLOUT else api('PATCH','/blocks/'+DASH+'/children',{'children':[welcome]})
print('   '+('OK' if 'id' in r else '실패'))

# 3) 모바일 직원용 상단 안내
def link(pid): return {'type':'link_to_page','link_to_page':{'type':'page_id','page_id':pid}}
print('3. 모바일 직원 안내...')
mobile_blocks=[
 {'type':'divider','divider':{}},
 {'type':'heading_2','heading_2':{'rich_text':[{'text':{'content':'📱 모바일 바로 시작'}}]}},
 {'type':'callout','callout':{'icon':{'type':'emoji','emoji':'📌'},'color':'green_background',
   'rich_text':[{'text':{'content':'직원용 순서: 1) 진행중인 현장 확인 2) 공정 일정 확인 3) 내 업무 확인 4) 영수증·출금은 현장팀·관리팀 폴더에서 등록'}}]}},
 {'type':'callout','callout':{'icon':{'type':'emoji','emoji':'🖼️'},'color':'yellow_background',
   'rich_text':[{'text':{'content':'사진 수정: 현장 카드 본문의 시공전 사진, 시공중 사진, 완성 사진 섹션에 올리고 지웁니다. 잘못 올린 파일은 해당 섹션에서 파일 메뉴를 열어 삭제하세요.'}}]}},
]
if has_heading(DASH,'모바일 바로 시작'):
    patch_mobile_section(DASH, mobile_blocks)
    print('   이미 있음 — 안내문 업데이트')
else:
    r=api('PATCH','/blocks/'+DASH+'/children',{'children':mobile_blocks})
    print('   '+('OK' if 'results' in r else '실패'))

# 4) 맨 아래 바로가기 섹션
print('4. 폴더 바로가기...')
blocks=[
 {'type':'divider','divider':{}},
 {'type':'heading_2','heading_2':{'rich_text':[{'text':{'content':'🔗 바로가기'}}]}},
 {'type':'callout','callout':{'icon':{'type':'emoji','emoji':'🗂️'},'color':'gray_background',
   'rich_text':[{'text':{'content':'경비·출금·고객·매출 등은 아래 폴더에서. 권한에 맞는 폴더만 보여요.'}}]}},
 link(F_ALL), link(F_SITE), link(F_MGR),
]
if has_heading(DASH,'바로가기'):
    print('   이미 있음 — 건너뜀')
else:
    r=api('PATCH','/blocks/'+DASH+'/children',{'children':blocks})
    print('   '+('OK' if 'results' in r else '실패'))
print('\n✅ 꾸미기 완료. 노션 새로고침(Ctrl+R)하세요.')

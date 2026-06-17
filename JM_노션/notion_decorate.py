"""notion_decorate.py — 메인 대시보드 꾸미기 (커버/환영배너/바로가기)"""
import urllib.request, json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
TOKEN=os.environ['NOTION_TOKEN']
H={'Authorization':f'Bearer {TOKEN}','Notion-Version':'2022-06-28','Content-Type':'application/json'}
def api(m,e,d=None):
    b=json.dumps(d,ensure_ascii=False).encode() if d else None
    r=urllib.request.Request('https://api.notion.com/v1'+e,data=b,headers=H,method=m)
    try:
        with urllib.request.urlopen(r) as x: return json.loads(x.read())
    except urllib.error.HTTPError as ex:
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:160]); return err

DASH='381089e9-0a52-81a1-90d5-e5a8bf179e8c'
TOP_CALLOUT='381089e9-0a52-8106-805d-ce335b58eea9'
F_ALL='381089e9-0a52-8136-9e65-e0302f005a5f'
F_SITE='381089e9-0a52-81b0-9b43-f88d12ea3b2b'
F_MGR='381089e9-0a52-8129-96e6-c5b028be93e7'

# 1) 커버 이미지 (노션 그라데이션)
print('1. 커버 이미지...')
r=api('PATCH','/pages/'+DASH,{'cover':{'type':'external','external':{'url':'https://www.notion.so/images/page-cover/gradients_8.png'}}})
print('   '+('OK' if 'id' in r else '실패'))

# 2) 상단 환영 배너 콜아웃 교체
print('2. 환영 배너...')
r=api('PATCH','/blocks/'+TOP_CALLOUT,{'callout':{
    'rich_text':[{'type':'text','text':{'content':'제이엠건축인테리어 업무 시스템에 오신 걸 환영합니다. 매일 여기서 시작하세요 — 진행중인 현장 → 공정 일정 → 업무 순으로 한눈에 봅니다.'}}],
    'icon':{'type':'emoji','emoji':'👋'},'color':'blue_background'}})
print('   '+('OK' if 'id' in r else '실패'))

# 3) 맨 아래 바로가기 섹션
print('3. 폴더 바로가기...')
def link(pid): return {'type':'link_to_page','link_to_page':{'type':'page_id','page_id':pid}}
blocks=[
 {'type':'divider','divider':{}},
 {'type':'heading_2','heading_2':{'rich_text':[{'text':{'content':'🔗 바로가기'}}]}},
 {'type':'callout','callout':{'icon':{'type':'emoji','emoji':'🗂️'},'color':'gray_background',
   'rich_text':[{'text':{'content':'경비·출금·고객·매출 등은 아래 폴더에서. 권한에 맞는 폴더만 보여요.'}}]}},
 link(F_ALL), link(F_SITE), link(F_MGR),
]
r=api('PATCH','/blocks/'+DASH+'/children',{'children':blocks})
print('   '+('OK' if 'results' in r else '실패'))
print('\n✅ 꾸미기 완료. 노션 새로고침(Ctrl+R)하세요.')

"""notion_applicants.py — 채용 지원자 이력서 DB 신규 + 직원명부 이력서칸 제거(되돌리기)"""
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
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:150]); return err
def opt(n,c='default'): return {'name':n,'color':c}

F_MGR='381089e9-0a52-8129-96e6-c5b028be93e7'  # 🔴 관리자 전용
EMP='381089e9-0a52-81db-83de-f502d3b4ba64'    # 직원 명부

# 1) 직원 명부에서 잘못 넣은 이력서 칸 제거 + 안내문 원복
print('1. 직원 명부 이력서 칸 제거...')
api('PATCH','/databases/'+EMP,{'properties':{
    '📄 이력서':None,'🎓 학력':None,'💼 주요 경력':None,'📜 자격증':None,'📎 관련 서류':None}})
emp_page=api('GET','/databases/'+EMP)['parent']['page_id']
for b in api('GET','/blocks/'+emp_page+'/children?page_size=30').get('results',[]):
    if b['type']=='callout':
        api('PATCH','/blocks/'+b['id'],{'callout':{'rich_text':[{'type':'text','text':{'content':
          '📖 사용법(관리자): 재직 직원의 인적사항·계좌·입퇴사·계약·근태를 관리. 사진·연락처·4대보험 등 인사정보. 🔴 대표·이사만 봅니다.'}}],
          'icon':{'type':'emoji','emoji':'📖'},'color':'blue_background'}})
        break
print('   완료')

# 2) 지원자 이력서 DB 신규 (관리자 전용)
print('2. 지원자 이력서(채용) DB 생성...')
page=api('POST','/pages',{'parent':{'type':'page_id','page_id':F_MGR},
  'icon':{'type':'emoji','emoji':'📋'},
  'properties':{'title':{'title':[{'text':{'content':'📋 지원자 이력서 (채용)'}}]}},
  'children':[{'type':'callout','callout':{'icon':{'type':'emoji','emoji':'📖'},'color':'blue_background',
    'rich_text':[{'text':{'content':'📖 사용법(관리자): 채용 지원자 이력서를 여기에 올립니다. ① "새로 만들기" → ② 이력서 파일 첨부 + 이름·지원직무·연락처 입력 → ③ 이사님이 보고 "이사 코멘트"와 전형상태를 갱신. 🔴 대표·이사만 봅니다.'}}]}}]})
pid=page['id']
db=api('POST','/databases',{'parent':{'type':'page_id','page_id':pid},
  'icon':{'type':'emoji','emoji':'📋'},'is_inline':True,
  'title':[{'text':{'content':'지원자 이력서'}}],
  'properties':{
    '이름':{'title':{}},
    '지원 직무':{'select':{'options':[opt('디자이너','purple'),opt('시공기사','brown'),opt('현장소장','blue'),opt('사무','green'),opt('기타','gray')]}},
    '📄 이력서':{'files':{}},
    '📎 포트폴리오·자소서':{'files':{}},
    '연락처':{'phone_number':{}},
    '이메일':{'email':{}},
    '지원일':{'date':{}},
    '학력':{'rich_text':{}},
    '경력':{'rich_text':{}},
    '전형상태':{'select':{'options':[opt('🆕 신규접수','gray'),opt('📄 서류검토','blue'),opt('📞 면접예정','yellow'),
        opt('🤝 면접완료','orange'),opt('✅ 합격','green'),opt('❌ 불합격','red'),opt('⏸️ 보류','default')]}},
    '이사 코멘트':{'rich_text':{}},
    '비고':{'rich_text':{}},
  }})
print('   ✅ 생성' if 'id' in db else '   실패')
print('\n✅ 완료. 관리자 전용 폴더에 "📋 지원자 이력서 (채용)" 생겼어요.')

"""
notion_build.py — JM 업무 시스템 깨끗한 재구축 (14개 필수항목 기준)
기존 허브 아래 새 루트 생성 → 사이드바 최상위로 드래그하면 됨. 기존은 백업 보존.
구조: 메인 대시보드(현장/공정/업무) + 🟢전직원 / 🟡현장팀·관리 / 🔴관리자
"""
import urllib.request, json, sys, io, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
TOKEN='ntn_H23137511225x1Um9OQaYDJW1V7e0AGk3dAO7z2znnhewK'
HUB='376089e9-0a52-8015-ba56-f0837a19d29a'
H={'Authorization':f'Bearer {TOKEN}','Notion-Version':'2022-06-28','Content-Type':'application/json'}
def api(m,e,d=None):
    b=json.dumps(d,ensure_ascii=False).encode() if d else None
    r=urllib.request.Request('https://api.notion.com/v1'+e,data=b,headers=H,method=m)
    try:
        with urllib.request.urlopen(r) as x: return json.loads(x.read())
    except urllib.error.HTTPError as ex:
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:170]); return err

def page(parent,title,emoji,blocks=None,color=None):
    d={'parent':{'type':'page_id','page_id':parent},'icon':{'type':'emoji','emoji':emoji},
       'properties':{'title':{'title':[{'text':{'content':title}}]}}}
    if blocks: d['children']=blocks
    return api('POST','/pages',d)['id']
def db(parent,title,emoji,props,inline=True):
    r=api('POST','/databases',{'parent':{'type':'page_id','page_id':parent},
      'icon':{'type':'emoji','emoji':emoji},'is_inline':inline,
      'title':[{'text':{'content':title}}],'properties':props})
    return r['id']
def co(t,e,c='gray_background'):
    return {'type':'callout','callout':{'rich_text':[{'text':{'content':t}}],'icon':{'type':'emoji','emoji':e},'color':c}}
def h2(t): return {'type':'heading_2','heading_2':{'rich_text':[{'text':{'content':t}}]}}
def div(): return {'type':'divider','divider':{}}
def toggle(t): return {'type':'toggle','toggle':{'rich_text':[{'text':{'content':t}}],'children':[{'type':'paragraph','paragraph':{'rich_text':[{'text':{'content':'(작성)'}}]}}]}}
def sel(opts): return {'select':{'options':opts}}
def opt(n,c='default'): return {'name':n,'color':c}
def rel(target): return {'relation':{'database_id':target,'type':'dual_property','dual_property':{}}}
def won(): return {'number':{'format':'won'}}

PHASE=[opt('🔵 상담','blue'),opt('🎨 디자인','purple'),opt('📝 견적','yellow'),opt('🔧 설비','blue'),
 opt('⚡ 전기','orange'),opt('🪵 목공','brown'),opt('🧱 수장','red'),opt('⬜ 바닥','default'),
 opt('🛋️ 가구','green'),opt('🧹 입주청소','pink'),opt('✅ 완공','green')]

print('=== 1. 루트 + 대시보드 + 폴더 ===')
ROOT=page(HUB,'🏢 JM 업무 시스템','🏢',[co('회사 전체 업무 통합 시스템. 이 페이지를 사이드바 최상위로 드래그하세요.','🏢','blue_background')])
DASH=page(ROOT,'🏠 메인 대시보드','🏠',[
    co('매일 여기서 시작하세요. 현장 현황 → 공정 일정 → 업무를 한눈에.','🏠','blue_background')])
F_ALL=page(ROOT,'🟢 전 직원 공유','🟢',[co('전 직원이 보는 공간. 직원을 게스트로 초대하세요.','🟢','green_background')])
F_SITE=page(ROOT,'🟡 현장팀·관리팀','🟡',[co('현장팀과 관리팀(대표·이사)만. 영수증·출금.','🟡','yellow_background')])
F_MGR=page(ROOT,'🔴 관리자 전용','🔴',[co('⚠️ 대표·이사 전용. 직원/고객/매출/매입. 직원 초대 금지.','🔴','red_background')])
print('ROOT',ROOT)

print('=== 2. 현장 마스터 DB (대시보드, ①②) ===')
api('PATCH','/blocks/'+DASH+'/children',{'children':[div(),h2('🏗️ 진행중인 현장'),co('현장을 클릭하면 자료·공정·경비·업무가 모두 보입니다. 새 현장은 + 새로 만들기.','🏗️','gray_background')]})
SITE=db(DASH,'진행중인 현장','🏗️',{
  '현장명':{'title':{}},
  '📍 현장주소':{'rich_text':{}},
  '진행단계':sel(PHASE),
  '담당자':{'rich_text':{}},
  '시작일':{'date':{}},
  '완료예정일':{'date':{}},
  '📷 비포 사진':{'files':{}},
  '📷 현장 사진':{'files':{}},
  '📐 도면 PDF':{'files':{}},
  '🧊 3D 이미지':{'files':{}},
  '🎨 컨셉 사진(고객제공)':{'files':{}},
  '📎 고객 제공 자료':{'files':{}},
  '📝 미팅 정리':{'rich_text':{}},
  '🛒 구매물품 링크':{'url':{}},
  '메모':{'rich_text':{}},
})
print('SITE',SITE)

print('=== 3. 공정 일정 / 업무 현황 (대시보드, ③) ===')
api('PATCH','/blocks/'+DASH+'/children',{'children':[div(),h2('🗓️ 공정 일정'),co('A현장 목공 6/4, 타일 6/16처럼 현장별 공정 예정일·담당자.','🗓️','gray_background')]})
SCH=db(DASH,'공정 일정','🗓️',{
  '공정':{'title':{}},
  '현장':rel(SITE),
  '공정종류':sel([opt(p['name'],p['color']) for p in PHASE[:-1]]),
  '예정일':{'date':{}},
  '완료일':{'date':{}},
  '담당자':{'rich_text':{}},
  '상태':sel([opt('⚪ 예정','gray'),opt('🔵 진행중','blue'),opt('🟢 완료','green'),opt('🔴 지연','red')]),
  '비고':{'rich_text':{}},
})
api('PATCH','/blocks/'+DASH+'/children',{'children':[div(),h2('✅ 업무 현황'),co('각자 맡은 업무와 진행 상태. 본인 업무는 본인이 갱신.','✅','gray_background')]})
TASK=db(DASH,'업무 현황','✅',{
  '업무':{'title':{}},
  '현장':rel(SITE),
  '담당자':{'rich_text':{}},
  '구분':sel([opt('🎨 디자인','purple'),opt('🔨 시공','red'),opt('📋 행정','gray'),opt('📣 마케팅','pink'),opt('🔧 기타','default')]),
  '진행상태':sel([opt('⚪ 대기','gray'),opt('🔵 진행중','blue'),opt('🟢 완료','green'),opt('🔴 보류','red')]),
  '마감일':{'date':{}},
})
print('SCH',SCH,'TASK',TASK)

print('=== 4. 🟡 현장팀·관리 (⑬⑭) ===')
EXP=db(page(F_SITE,'📸 현장 경비·영수증','📸',[co('카드/현금 영수증 사진 업로드. 용도·현장 기록. 현장팀+관리팀.','📸','yellow_background')]),
  '현장 경비·영수증','📸',{
  '항목':{'title':{}},'현장':rel(SITE),'사용일':{'date':{}},'금액':won(),
  '결제수단':sel([opt('법인카드','blue'),opt('개인카드','orange'),opt('개인현금','gray')]),
  '사용처':{'rich_text':{}},'사용자':{'rich_text':{}},'영수증':{'files':{}},
  '정산상태':sel([opt('🔴 미정산','red'),opt('🟡 확인중','yellow'),opt('🟢 정산완료','green')]),'비고':{'rich_text':{}},
})
WDR=db(page(F_SITE,'💸 출금 요청','💸',[co('일용직 임금·거래처 출금 요청. 현장팀·이사 올리면 대표 처리(결제=경리나라).','💸','yellow_background')]),
  '출금 요청 관리','💸',{
  '항목':{'title':{}},'현장':rel(SITE),'요청일':{'date':{}},'금액':won(),
  '유형':sel([opt('일용직 임금','orange'),opt('자재비','blue'),opt('외주비','purple'),opt('거래처 대금','green'),opt('기타','gray')]),
  '수령인':{'rich_text':{}},'계좌번호':{'rich_text':{}},'요청자':{'rich_text':{}},'증빙':{'files':{}},
  '상태':sel([opt('🔴 요청','red'),opt('🟡 확인중','yellow'),opt('🟢 출금완료','green')]),'비고':{'rich_text':{}},
})
print('EXP',EXP,'WDR',WDR)

print('=== 5. 🔴 관리자 전용 (⑥⑦⑧⑨) ===')
EMP=db(page(F_MGR,'👥 직원 명부','👥',[co('직원 인적사항·계좌·계약. 관리자 전용.','👥','red_background')]),
  '직원 명부','👥',{
  '이름':{'title':{}},'직무':sel([opt('대표','red'),opt('이사','orange'),opt('현장소장','blue'),opt('디자이너','purple'),opt('시공기사','brown'),opt('사무','green'),opt('기타','gray')]),
  '연락처':{'phone_number':{}},'이메일':{'email':{}},'입사일':{'date':{}},'퇴사일':{'date':{}},
  '계좌번호':{'rich_text':{}},'계약형태':sel([opt('정규직','blue'),opt('계약직','yellow'),opt('일용직','gray')]),
  '기본급':won(),'4대보험':{'checkbox':{}},'사진':{'files':{}},'비상연락처':{'rich_text':{}},'비고':{'rich_text':{}},
})
ATT=db(EMP and page(F_MGR,'🕐 근태 기록','🕐',[co('출퇴근·조퇴·결근·연차. 관리자 전용.','🕐','red_background')]),
  '근태 기록','🕐',{
  '기록':{'title':{}},'직원':rel(EMP),'날짜':{'date':{}},
  '근무유형':sel([opt('정상','green'),opt('지각','yellow'),opt('조퇴','orange'),opt('반차','blue'),opt('연차','purple'),opt('결근','red'),opt('출장','gray')]),
  '출근시간':{'rich_text':{}},'퇴근시간':{'rich_text':{}},'메모':{'rich_text':{}},
})
ACC=db(page(F_MGR,'💰 매출·매입 (회계)','💰',[co('세부는 경리나라. 여기는 고정비·변동비·현장원가 흐름. 관리자 전용.','💰','red_background')]),
  '수입·지출 내역','💰',{
  '내용':{'title':{}},'날짜':{'date':{}},'금액':won(),
  '구분':sel([opt('수입','green'),opt('지출','red')]),
  '비용성격':sel([opt('고정비','red'),opt('변동비','orange'),opt('현장원가','blue'),opt('해당없음','gray')]),
  '카테고리':sel([opt('공사대금','green'),opt('자재비','blue'),opt('인건비','orange'),opt('외주비','purple'),opt('임대료','red'),opt('운영비','gray'),opt('기타','default')]),
  '현장':rel(SITE),'결제수단':sel([opt('법인카드','blue'),opt('계좌이체','green'),opt('현금','gray')]),'증빙':{'files':{}},
})
FIN=db(page(F_MGR,'📊 현장별 재무','📊',[co('현장별 계약금액·총지출·수익. 관리자 전용.','📊','red_background')]),
  '현장별 재무','📊',{
  '현장명':{'title':{}},'현장':rel(SITE),'계약금액':won(),
  '입금상태':sel([opt('🟡 계약금','yellow'),opt('🔵 중도금','blue'),opt('🟢 잔금완료','green'),opt('🔴 미수금','red')]),
})
CRM=db(page(F_MGR,'👤 고객 관리 (CRM)','👤',[co('의뢰현장·계약여부·일정·연락처. 관리자 전용.','👤','red_background')]),
  '고객 CRM','👤',{
  '고객명':{'title':{}},'연락처':{'phone_number':{}},'이메일':{'email':{}},'현장주소':{'rich_text':{}},
  '상담상태':sel([opt('첫 문의','gray'),opt('상담중','blue'),opt('견적 발송','yellow'),opt('계약 완료','green'),opt('진행중','orange'),opt('완공','purple'),opt('취소','red')]),
  '유입경로':sel([opt('네이버 블로그','green'),opt('인스타그램','pink'),opt('지인 소개','blue'),opt('직접 문의','gray'),opt('재계약','purple')]),
  '예산규모':sel([opt('1천만원 미만'),opt('1천~3천'),opt('3천~5천'),opt('5천~1억'),opt('1억 이상')]),
  '계약일':{'date':{}},'희망 완공일':{'date':{}},'담당자':{'rich_text':{}},'메모':{'rich_text':{}},
})
QUO=db(page(F_MGR,'📐 견적 현황','📐',[co('견적 작성·발송·성사 관리. 관리자 전용.','📐','red_background')]),
  '견적 현황','📐',{
  '현장명':{'title':{}},'고객명':{'rich_text':{}},'견적금액':won(),'면적':{'rich_text':{}},
  '견적상태':sel([opt('작성중','gray'),opt('발송완료','blue'),opt('협의중','yellow'),opt('계약성사','green'),opt('미성사','red')]),
  '견적일':{'date':{}},'유효기간':{'date':{}},'견적서파일':{'files':{}},'담당자':{'rich_text':{}},'메모':{'rich_text':{}},
})
ARC=db(page(F_MGR,'📁 공사 아카이브 (완료 공사리스트)','📁',[co('JM이 진행한 전체 공사 기록. 진행시기·현장·항목. 관리자 전용.','📁','red_background')]),
  '공사 아카이브','📁',{
  '현장명':{'title':{}},'위치':{'rich_text':{}},'완공년월':{'date':{}},'면적':{'rich_text':{}},
  '공종':{'multi_select':{'options':[opt('목공'),opt('타일'),opt('도장'),opt('전기'),opt('설비'),opt('가구'),opt('필름'),opt('철거')]}},
  '스타일태그':{'multi_select':{'options':[opt('모던'),opt('인더스트리얼'),opt('내추럴'),opt('클래식')]}},
  '마감사진':{'files':{}},'도면':{'files':{}},'마케팅활용':{'checkbox':{}},'설명':{'rich_text':{}},
})
SET=page(F_MGR,'⚙️ 설정·권한 가이드','⚙️',[
  co('권한 3단계: 🟢전직원 / 🟡현장팀·관리 / 🔴관리자','⚙️','gray_background'),
  toggle('게스트·멤버 초대 방법'),toggle('뷰(타임라인/갤러리/보드) 추가 방법'),toggle('현장 DB 템플릿 설정 방법')])
print('관리자 DB 완료')

print('=== 6. 🟢 전 직원 (④⑤⑩⑪⑫ + 운영) ===')
SNS=db(page(F_ALL,'📱 SNS·블로그 발행','📱',[co('블로그(디자인·시공·마감)·인스타 계획과 실행 체크.','📱','green_background')]),
  'SNS·블로그 발행','📱',{
  '제목':{'title':{}},'현장':rel(SITE),
  '채널':{'multi_select':{'options':[opt('블로그','green'),opt('인스타그램','pink'),opt('유튜브','red'),opt('카카오','yellow')]}},
  '포스팅 종류':sel([opt('디자인','purple'),opt('시공','orange'),opt('마감','green'),opt('인스타피드','pink'),opt('릴스','red'),opt('기타','gray')]),
  '상태':sel([opt('⚪ 예정','gray'),opt('🔵 작성중','blue'),opt('📷 촬영완료','orange'),opt('✅ 발행완료','green')]),
  '발행일':{'date':{}},'링크':{'url':{}},'담당자':{'rich_text':{}},'비고':{'rich_text':{}},
})
MAT=db(page(F_ALL,'📦 자재·발주','📦',[co('현장별 자재 발주·입고 관리.','📦','green_background')]),
  '자재·발주 관리','📦',{
  '품목명':{'title':{}},'현장':rel(SITE),'발주업체':{'rich_text':{}},
  '카테고리':sel([opt('타일'),opt('목재'),opt('도장재'),opt('전기자재'),opt('설비자재'),opt('창호'),opt('가구·가전'),opt('철물'),opt('기타')]),
  '수량':{'number':{}},'단가':won(),'발주일':{'date':{}},'납기일':{'date':{}},
  '상태':sel([opt('발주 전','gray'),opt('발주완료','blue'),opt('입고완료','green'),opt('반품','red')]),'담당자':{'rich_text':{}},
})
ASD=db(page(F_ALL,'🔧 A/S 관리','🔧',[co('하자보수·민원 접수와 처리.','🔧','green_background')]),
  'A/S 관리','🔧',{
  'AS내용':{'title':{}},'현장':rel(SITE),'고객명':{'rich_text':{}},'고객연락처':{'phone_number':{}},
  'AS유형':sel([opt('하자보수'),opt('단순AS'),opt('추가공사'),opt('민원')]),'접수일':{'date':{}},'처리예정일':{'date':{}},'처리완료일':{'date':{}},
  '접수상태':sel([opt('접수','gray'),opt('처리중','blue'),opt('처리완료','green'),opt('보류','red')]),'처리내용':{'rich_text':{}},'사진':{'files':{}},
})
VEN=db(page(F_ALL,'🤝 협력업체','🤝',[co('전기·설비·타일 등 협력업체 연락처·단가.','🤝','green_background')]),
  '협력업체 관리','🤝',{
  '업체명':{'title':{}},'업종':sel([opt('전기'),opt('설비'),opt('배관'),opt('타일'),opt('목공'),opt('도장'),opt('철거'),opt('창호'),opt('가구'),opt('자재납품'),opt('기타')]),
  '담당자명':{'rich_text':{}},'연락처':{'phone_number':{}},'사업자번호':{'rich_text':{}},'계좌정보':{'rich_text':{}},
  '거래상태':sel([opt('주거래','green'),opt('가끔 사용','yellow'),opt('비추천','red'),opt('거래중단','gray')]),
  '평점':sel([opt('★★★★★'),opt('★★★★'),opt('★★★'),opt('★★'),opt('★')]),'단가표':{'files':{}},'메모':{'rich_text':{}},
})
NOT=db(page(F_ALL,'📢 공지사항·매뉴얼','📢',[co('신입도 한눈에 보는 회사 공지·운영 매뉴얼.','📢','green_background')]),
  '공지사항','📢',{
  '제목':{'title':{}},'공지일':{'date':{}},
  '중요도':sel([opt('긴급 🔴','red'),opt('중요 🟡','yellow'),opt('일반 🟢','green')]),
  '대상':{'multi_select':{'options':[opt('전직원'),opt('현장팀'),opt('디자인팀'),opt('관리팀')]}},
  '내용':{'rich_text':{}},'확인여부':{'checkbox':{}},'작성자':{'rich_text':{}},
})
DMAN=page(F_ALL,'🎨 디자인팀 매뉴얼','🎨',[co('신입 디자이너용 업무 매뉴얼.','📖','gray_background'),
  toggle('상담·미팅 진행 방법'),toggle('실측·도면 작성 기준'),toggle('3D·컨셉 제안 프로세스'),toggle('견적 산출 기준'),toggle('고객 자료 정리/공유 규칙'),toggle('자주 쓰는 자재·마감재')])
CMAN=page(F_ALL,'🔧 시공팀 매뉴얼','🔧',[co('신입 시공팀용 업무 매뉴얼.','📖','gray_background'),
  toggle('공정 순서 표준(상담~입주청소)'),toggle('현장 안전 수칙'),toggle('공종별 시공 체크리스트'),toggle('자재 발주·입고 절차'),toggle('영수증·출금 처리 방법'),toggle('하자/AS 대응 절차')])
LIB=page(F_ALL,'📚 회사 자료실','📚',[co('서식·양식·계약서 등 공용 자료.','📚','green_background')])
print('전직원 DB 완료')

print('=== 7. 롤업/수익 (현장·재무 집계) ===')
# 현장 back-relation 이름 찾기
sd=api('GET','/databases/'+SITE)['properties']
def backrel(toname):
    for pn,pv in sd.items():
        if pv['type']=='relation' and pv['relation']['database_id'].replace('-','') in (toname.replace('-',''),):
            return pn
    return None
rel_exp=backrel(EXP); rel_wdr=backrel(WDR); rel_fin=backrel(FIN)
api('PATCH','/databases/'+SITE,{'properties':{
  '경비합계':{'rollup':{'relation_property_name':rel_exp,'rollup_property_name':'금액','function':'sum'}} if rel_exp else None,
  '출금합계':{'rollup':{'relation_property_name':rel_wdr,'rollup_property_name':'금액','function':'sum'}} if rel_wdr else None,
}})
sd=api('GET','/databases/'+SITE)['properties']
import re
def pid(name):
    return sd[name]['id']
# 총지출 formula = 경비합계 + 출금합계
api('PATCH','/databases/'+SITE,{'properties':{'총지출':{'formula':{'expression':f'prop("경비합계") + prop("출금합계")'}}}})
# 재무: 총지출 rollup(현장.총지출) + 수익 formula
fd=api('GET','/databases/'+FIN)['properties']
fin_site=[pn for pn,pv in fd.items() if pv['type']=='relation'][0]
api('PATCH','/databases/'+FIN,{'properties':{'총지출':{'rollup':{'relation_property_name':fin_site,'rollup_property_name':'총지출','function':'sum'}}}})
api('PATCH','/databases/'+FIN,{'properties':{'수익':{'formula':{'expression':'prop("계약금액") - prop("총지출")'}}}})
print('   집계 완료')

print('=== 8. 예시 1행 ===')
def row(dbid,props): return api('POST','/pages',{'parent':{'database_id':dbid},'properties':props})['id']
def T(s): return {'title':[{'text':{'content':s}}]}
def RT(s): return {'rich_text':[{'text':{'content':s}}]}
def S(s): return {'select':{'name':s}}
def D(s): return {'date':{'start':s}}
def N(n): return {'number':n}
site1=row(SITE,{'현장명':T('오늘은 반찬데이 (예시)'),'📍 현장주소':RT('창원시 성산구 ○○로 12'),'진행단계':S('🪵 목공'),'담당자':RT('홍길동'),'시작일':D('2026-06-01'),'완료예정일':D('2026-06-25')})
for nm,ph,dt,who,st in [('목공','🪵 목공','2026-06-04','김목수','🟢 완료'),('타일','🧱 수장','2026-06-16','이타일','🔵 진행중'),('입주청소','🧹 입주청소','2026-06-20','청소팀','⚪ 예정')]:
    row(SCH,{'공정':T(nm),'현장':{'relation':[{'id':site1}]},'공정종류':S(ph),'예정일':D(dt),'담당자':RT(who),'상태':S(st)})
row(TASK,{'업무':T('주방 상부장 도면 확정'),'현장':{'relation':[{'id':site1}]},'담당자':RT('홍길동'),'구분':S('🎨 디자인'),'진행상태':S('🟢 완료'),'마감일':D('2026-06-03')})
row(SNS,{'제목':T('반찬데이 시공편 포스팅'),'현장':{'relation':[{'id':site1}]},'채널':{'multi_select':[{'name':'블로그'}]},'포스팅 종류':S('시공'),'상태':S('🔵 작성중'),'담당자':RT('마케팅')})
row(EXP,{'항목':T('타일 본드 구매'),'현장':{'relation':[{'id':site1}]},'사용일':D('2026-06-15'),'금액':N(48000),'결제수단':S('법인카드'),'사용처':RT('○○철물'),'사용자':RT('이타일'),'정산상태':S('🔴 미정산')})
row(WDR,{'항목':T('일용직 일당 (목공 2명)'),'현장':{'relation':[{'id':site1}]},'요청일':D('2026-06-04'),'금액':N(360000),'유형':S('일용직 임금'),'수령인':RT('김목수 외 1'),'요청자':RT('홍길동'),'상태':S('🔴 요청')})
row(FIN,{'현장명':T('오늘은 반찬데이 (예시)'),'현장':{'relation':[{'id':site1}]},'계약금액':N(28000000),'입금상태':S('🟡 계약금')})
row(EMP,{'이름':T('홍길동 (예시)'),'직무':S('현장소장'),'연락처':{'phone_number':'010-1234-5678'},'입사일':D('2024-03-02'),'계약형태':S('정규직'),'4대보험':{'checkbox':True}})
row(CRM,{'고객명':T('김소연 (예시)'),'연락처':{'phone_number':'010-9876-5432'},'현장주소':RT('창원시 성산구 ○○로 12'),'상담상태':S('진행중'),'유입경로':S('네이버 블로그')})
print('   예시 완료')

print('\n✅ 전체 구축 완료')
print('새 시스템 루트:', 'https://notion.so/'+ROOT.replace('-',''))
print('IDs:',json.dumps({'ROOT':ROOT,'DASH':DASH,'SITE':SITE,'SCH':SCH,'TASK':TASK,'EXP':EXP,'WDR':WDR,'EMP':EMP,'FIN':FIN,'ACC':ACC,'CRM':CRM},ensure_ascii=False))

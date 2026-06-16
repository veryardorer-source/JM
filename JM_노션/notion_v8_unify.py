"""
notion_v8_unify.py — 현장 DB 단일화(통합)
마스터 = '진행중인 현장' (데이터·집계·relation 보유)
- 자료 필드 추가: 현장주소/사진/도면PDF/3D/컨셉사진/고객자료/미팅정리
- 민감정보 제거: 고객명 (샘플값만 존재 → 경영자 CRM에 별도 보관)
- 중복 '현장 목록' DB(0행) 삭제
- 🏗️ 현장 관리 페이지에 마스터 DB 링크 추가
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
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:160]); return err

SITE='37d089e9-0a52-81e7-834c-e9ef6fb235ea'   # 진행중인 현장 (마스터)
LIST='37d089e9-0a52-811a-9c34-df78c34564a3'   # 현장 목록 (중복, 삭제 대상)
SITE_MGMT='37d089e9-0a52-815d-a402-db252a8959a8'  # 🏗️ 현장 관리 페이지

# 1) 마스터에 자료 필드 추가 + 고객명 제거
print("1. 마스터에 자료 필드 추가 / 고객명 제거...")
props={
    '고객명':None,
    '📍 현장주소':{'rich_text':{}},
    '📷 현장 사진':{'files':{}},
    '📐 도면 PDF':{'files':{}},
    '🧊 3D 이미지':{'files':{}},
    '🎨 컨셉 사진(고객제공)':{'files':{}},
    '📎 고객 제공 자료':{'files':{}},
    '📝 미팅 정리':{'rich_text':{}},
}
r=api('PATCH','/databases/'+SITE,{'properties':props})
print("   완료" if 'properties' in r else "   실패")

# 2) 현장 관리 페이지에 마스터 DB 링크 + 안내
print("2. 현장 관리 페이지에 마스터 DB 링크 추가...")
blocks=[
 {'type':'divider','divider':{}},
 {'type':'heading_2','heading_2':{'rich_text':[{'text':{'content':'🏗️ 현장 자료실 (전 직원 공유)'}}]}},
 {'type':'callout','callout':{'icon':{'type':'emoji','emoji':'📌'},'color':'green_background','rich_text':[{'text':{'content':'현장은 아래 "진행중인 현장" 한 곳에서만 관리합니다. 현장을 클릭하면 사진·도면·3D·컨셉·고객자료·미팅이 그 안에 모여요. (계약금액·고객정보는 경영자 전용 재무·CRM에 별도)'}}]}},
 {'type':'link_to_page','link_to_page':{'type':'database_id','database_id':SITE}},
 {'type':'callout','callout':{'icon':{'type':'emoji','emoji':'💡'},'color':'gray_background','rich_text':[{'text':{'content':'TIP: 이 페이지에서 위 DB를 "데이터베이스 링크 복사 → 링크된 보기로 붙여넣기"하면, 재무 컬럼을 숨긴 자료 전용 보기를 만들 수 있어요(앱).'}}]}},
]
r=api('PATCH','/blocks/'+SITE_MGMT+'/children',{'children':blocks})
print("   완료" if 'results' in r else "   실패(링크블록 미지원 가능)")

# 3) 중복 현장 목록 DB 삭제
print("3. 중복 '현장 목록' DB 삭제...")
d=api('DELETE','/blocks/'+LIST)
print("   ✅ 삭제됨" if d.get('id') else "   ⚠️ 확인 필요")

print("\n✅ 통합 완료. 현장 = '진행중인 현장' 하나로 단일화.")
print("최종 마스터 속성:")
for pn,pv in api('GET','/databases/'+SITE).get('properties',{}).items():
    print(f'   - {pn} ({pv["type"]})')


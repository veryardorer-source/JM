"""
notion_v7_sitedata.py — 현장 목록 → '현장 자료실'(전 직원 공유) 재구성
- 민감정보 제거: 고객명, 고객연락처, 계약금액
- 자료 공유 필드 추가: 현장사진/도면PDF/3D/컨셉사진/고객자료(files) + 미팅 정리(text)
- 유지: 현장명, 현장주소, 단계, 담당자, 시작일, 완료예정일, 메모, 공유링크, Drive폴더
※ 현장 목록은 0행(데이터 없음) → 안전
"""
import urllib.request, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
TOKEN='ntn_H23137511225x1Um9OQaYDJW1V7e0AGk3dAO7z2znnhewK'
H={'Authorization':f'Bearer {TOKEN}','Notion-Version':'2022-06-28','Content-Type':'application/json'}
def api(m,e,d=None):
    b=json.dumps(d,ensure_ascii=False).encode() if d else None
    r=urllib.request.Request('https://api.notion.com/v1'+e,data=b,headers=H,method=m)
    try:
        with urllib.request.urlopen(r) as x: return json.loads(x.read())
    except urllib.error.HTTPError as ex:
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:160]); return err

LIST='37d089e9-0a52-811a-9c34-df78c34564a3'  # 현장 목록

props={
    # 삭제(민감정보)
    '고객명':None,
    '고객연락처':None,
    '계약금액':None,
    # 추가 — 자료 공유(파일 여러 개 첨부 가능)
    '📷 현장 사진':{'files':{}},
    '📐 도면 PDF':{'files':{}},
    '🧊 3D 이미지':{'files':{}},
    '🎨 컨셉 사진(고객제공)':{'files':{}},
    '📎 고객 제공 자료':{'files':{}},
    # 추가 — 미팅 정리(텍스트)
    '📝 미팅 정리':{'rich_text':{}},
}
print('현장 목록 → 현장 자료실 재구성 중...')
r=api('PATCH','/databases/'+LIST,{'properties':props})
if 'properties' in r:
    print('\n✅ 적용 완료. 최종 속성:')
    for pn,pv in r['properties'].items():
        print(f'   - {pn} ({pv["type"]})')
else:
    print('실패')

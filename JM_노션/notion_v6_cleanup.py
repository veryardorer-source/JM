"""
notion_v6_cleanup.py — 안전 정리(데이터 무영향)
1) 경비·출금 DB의 죽은 '연결현장' relation 제거 (정상 '현장연결'만 남김)
※ 빈 중복 DB(현장 목록 등) 삭제는 사용자 확정 후 별도 진행
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
        err=json.loads(ex.read()); print('  ERR:',err.get('message','')[:150]); return err

EXPENSE='37d089e9-0a52-814b-82bc-ff7dffbda124'  # 현장 경비·영수증
WITHDRAW='37d089e9-0a52-818d-bc2d-de8f73abc1ac'  # 출금 요청 관리

for nm,dbid in [('현장 경비·영수증',EXPENSE),('출금 요청 관리',WITHDRAW)]:
    db=api('GET','/databases/'+dbid)
    has=' 연결현장' .strip() in db.get('properties',{})
    print(f'{nm}: 연결현장 존재={has}')
    if has:
        r=api('PATCH','/databases/'+dbid,{'properties':{'연결현장':None}})
        print('  →', '✅ 제거됨' if '연결현장' not in r.get('properties',{}) else '⚠️ 확인필요')
print('\n완료. 남은 현장 relation = 현장연결(→진행중인 현장) 하나로 정리됨.')

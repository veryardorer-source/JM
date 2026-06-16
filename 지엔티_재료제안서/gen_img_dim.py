"""_user_imgs의 모든 이미지를 스캔해 실제 픽셀 크기 JSON 생성."""
import os, json
from PIL import Image

SRC = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\_user_imgs"

dim = {}
for fn in sorted(os.listdir(SRC)):
    if not fn.lower().endswith((".jpg", ".jpeg", ".png")):
        continue
    p = os.path.join(SRC, fn)
    with Image.open(p) as im:
        w, h = im.size
    dim[fn] = {"w": w, "h": h}

out = os.path.join(SRC, "img_dim.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(dim, f, ensure_ascii=False, indent=2)
print(f"Saved {len(dim)} entries → {out}")

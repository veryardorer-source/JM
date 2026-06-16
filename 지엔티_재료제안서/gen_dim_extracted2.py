"""_extracted2 이미지의 픽셀 크기 JSON 생성."""
import os, json
from PIL import Image

SRC = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\_extracted2"
dim = {}
for fn in sorted(os.listdir(SRC)):
    if not fn.lower().endswith((".jpg", ".jpeg", ".png")):
        continue
    with Image.open(os.path.join(SRC, fn)) as im:
        dim[fn] = {"w": im.width, "h": im.height}
out = os.path.join(SRC, "img_dim.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(dim, f, ensure_ascii=False, indent=2)
print(f"Saved {len(dim)} entries → {out}")

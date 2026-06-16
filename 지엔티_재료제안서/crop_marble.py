"""인조대리석 이미지 3장을 정사각으로 크롭."""
import os
from PIL import Image

SRC_DIRS = [
    r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\_user_imgs",
    r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\_extracted",
]
OUT = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\_user_imgs"

files = ["p07-1.jpeg", "p07-2.jpeg", "p07-3.jpeg"]
for fname in files:
    src_path = None
    for d in SRC_DIRS:
        p = os.path.join(d, fname)
        if os.path.exists(p):
            src_path = p
            break
    if not src_path:
        print(f"NOT FOUND: {fname}")
        continue
    img = Image.open(src_path)
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    cropped = img.crop((left, top, left + side, top + side))
    out_name = fname.replace(".jpeg", "-sq.jpeg")
    cropped.save(os.path.join(OUT, out_name), quality=95)
    print(f"{fname}  {w}×{h}  →  {out_name}  {side}×{side}")

"""슬라이드 6 (하이그로시) 이미지 3장을 정사각으로 크롭 (중앙 기준)"""

import os
from PIL import Image

SRC = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\_extracted"

files = ["s04-img1.jpg", "s04-img2.jpg", "s04-img3.jpg"]

for fname in files:
    img = Image.open(os.path.join(SRC, fname))
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    cropped = img.crop((left, top, left + side, top + side))
    out_name = fname.replace(".jpg", "-sq.jpg")
    cropped.save(os.path.join(SRC, out_name), quality=95)
    print(f"{fname}: {w}×{h}  →  {out_name}: {side}×{side}")

"""블라인드 이미지에서 위쪽 블라인드 부분만 크롭."""
from PIL import Image
import os

SRC = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\_extracted2\s17-img1.jpg"
OUT = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\_user_imgs\blind-crop.jpg"

img = Image.open(SRC)
w, h = img.size
print(f"원본: {w}×{h}")

# 위에서 60% 정도 (블라인드 + 천장 약간) 크롭
# 좌우는 약간 안쪽으로 들어가서 벽 부분 제거
top = int(h * 0.05)
bottom = int(h * 0.62)
left = int(w * 0.05)
right = int(w * 0.95)

cropped = img.crop((left, top, right, bottom))
cropped.save(OUT, quality=92)
print(f"크롭: {cropped.size[0]}×{cropped.size[1]}  →  {OUT}")

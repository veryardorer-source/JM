"""0527 PDF의 각 페이지를 PNG로 추출."""
import os, fitz

SRC = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\0527_지엔티 마감재 제안서.pdf"
OUT = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\_pdf_pages_0527"
os.makedirs(OUT, exist_ok=True)

doc = fitz.open(SRC)
print(f"Pages: {len(doc)}")
for i, page in enumerate(doc, start=1):
    pix = page.get_pixmap(dpi=120)
    pix.save(os.path.join(OUT, f"p{i:02d}.png"))
    print(f"  p{i:02d}: {pix.width}×{pix.height}")
doc.close()

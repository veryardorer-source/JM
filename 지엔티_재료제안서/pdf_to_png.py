"""PDF의 각 페이지를 PNG로 추출."""
import os
import fitz  # pymupdf

SRC = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\0526_지엔티_마감재_제안서.pdf"
OUT = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\_pdf_pages"
os.makedirs(OUT, exist_ok=True)

doc = fitz.open(SRC)
print(f"Pages: {len(doc)}")

for i, page in enumerate(doc, start=1):
    pix = page.get_pixmap(dpi=120)
    out_path = os.path.join(OUT, f"p{i:02d}.png")
    pix.save(out_path)
    print(f"  saved p{i:02d}.png  ({pix.width}×{pix.height})")

doc.close()

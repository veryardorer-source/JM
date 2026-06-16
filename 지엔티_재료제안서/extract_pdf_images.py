"""사용자 PDF의 각 페이지에서 임베드된 이미지를 추출."""
import os
import fitz

SRC = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\0526_지엔티_마감재_제안서.pdf"
OUT = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\_user_imgs"
os.makedirs(OUT, exist_ok=True)

doc = fitz.open(SRC)
print(f"Total pages: {len(doc)}")

manifest = []

for page_idx in range(len(doc)):
    page = doc[page_idx]
    img_list = page.get_images(full=True)
    page_no = page_idx + 1

    for img_no, img_info in enumerate(img_list, start=1):
        xref = img_info[0]
        base = doc.extract_image(xref)
        ext = base["ext"]
        img_bytes = base["image"]
        w_px = base.get("width", "?")
        h_px = base.get("height", "?")

        fname = f"p{page_no:02d}-{img_no}.{ext}"
        with open(os.path.join(OUT, fname), "wb") as f:
            f.write(img_bytes)

        manifest.append({"page": page_no, "n": img_no, "file": fname, "w": w_px, "h": h_px})
        print(f"  p{page_no:02d}-{img_no}: {fname}  ({w_px}×{h_px})")

doc.close()

# 저장 manifest
import json
with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"\n총 이미지 {len(manifest)}장 추출")
print(f"저장 위치: {OUT}")

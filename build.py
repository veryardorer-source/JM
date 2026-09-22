from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent
def quote(s): return '"'+s.replace('\\','\\\\').replace('"','\\"')+'"'
base=(root/'src/JM_Quantity.lsp').read_text(encoding='utf-8')
addon=(root/'src/JM_ListQuantity.lsp').read_text(encoding='utf-8')
ps=(root/'src/JM_ListBridge.ps1').read_text(encoding='utf-8')
embedded='''
(defun jl:bridge-script (/ p f line)
  (setq p (vl-filename-mktemp "JM_ExcelBridge_" nil ".ps1") f (open p "w" "utf8-bom"))
  (foreach line '(
'''+ '\n'.join(quote(line) for line in ps.splitlines())+'''
  ) (write-line line f)) (close f) p)
'''
ui=(root/'src/JM_ListUI.ps1').read_text(encoding='utf-8-sig')
ui_embedded='''
(defun jl:ui-script (/ p f line)
  (setq p (vl-filename-mktemp "JM_ListUI_" nil ".ps1") f (open p "w" "utf8-bom"))
  (foreach line '(
'''+ '\n'.join(quote(line) for line in ui.splitlines())+'''
  ) (write-line line f)) (close f) p)
'''
text=base+'\n'+addon+'\n'+embedded+'\n'+ui_embedded
depth=0; string=False; escaped=False
for number,line in enumerate(text.splitlines(),1):
 for c in line:
  if string:
   if escaped: escaped=False
   elif c=='\\': escaped=True
   elif c=='"': string=False
  elif c==';': break
  elif c=='"': string=True
  elif c=='(': depth+=1
  elif c==')':
   depth-=1
   assert depth>=0,number
assert depth==0 and not string,(depth,string)
out=root/'배포'; out.mkdir(exist_ok=True)
(out/'JM_ListQuantity.lsp').write_bytes(text.encode('cp949'))
if (root/'사용방법.md').exists():
 (out/'사용방법.md').write_bytes((root/'사용방법.md').read_bytes())
 with zipfile.ZipFile(root/'JM_내역연결_20260922.zip','w',zipfile.ZIP_DEFLATED) as z:
  for path in out.iterdir(): z.write(path,'JM_내역연결/'+path.name)
print('Lisp balance and CP949: PASS')

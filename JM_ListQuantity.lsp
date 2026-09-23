; JM wall quantities 2026-09-15i. Source UTF-8, distribute CP949.
; JMQTY adds a linked row. JMQTABLE reviews, recalculates and exports CSV.
(vl-load-com)
(defun jq:fail (s) (if (not jq:quiet) (princ (strcat "\n" s))) (exit))
(defun jq:get (r k) (cdr (assoc k r)))
(defun jq:set (r k v) (if (assoc k r) (subst (cons k v) (assoc k r) r) (append r (list (cons k v)))))
(defun jq:fmt (n) (rtos n 2 3))
(defun jq:ceil (n / k)
  (setq k (fix n)) (if (> (- n k) 1e-9) (1+ k) k))
(defun jq:stock (row)
  (if (member (jq:get row 'stock) '(2400 2700 3000 3600)) (jq:get row 'stock) 2700))
(defun jq:material-numbers (width height stock / vertical horizontal sheets)
  (setq vertical (1+ (jq:ceil (/ width 450.0)))
        horizontal (* 4 (jq:ceil (/ width (float stock))))
        sheets (* (jq:ceil (/ width 900.0)) (jq:ceil (/ height 1800.0))))
  (list vertical horizontal (+ vertical horizontal) sheets))
(defun jq:materials (row / c)
  (setq c (jq:calc row))
  (if (= (nth 3 c) "정상") (jq:material-numbers (* (car c) 1000.0) (jq:get row 'height) (jq:stock row))))
(defun jq:ply-width (row / w)
  (setq w (jq:get row 'plywidth))
  (if (and (numberp w) (> w 0.0) (<= w 1220.0)) w 80.0))
(defun jq:ply-numbers (length height width / positions levels yield strips)
  (if (and (> length 0.0) (> height 0.0) (> width 0.0) (<= width 1220.0))
    (progn
      (setq positions (1+ (jq:ceil (/ length 450.0)))
            levels (jq:ceil (/ height 2440.0))
            yield (fix (/ 1220.0 width)) strips (* positions levels))
      (list positions levels yield strips (jq:ceil (/ (float strips) yield))))))
(defun jq:plywood (row / c)
  (setq c (jq:calc row))
  (if (and (= (jq:get row 'plywood) 1) (= (nth 3 c) "정상"))
    (jq:ply-numbers (* 1000.0 (car c)) (jq:get row 'height) (jq:ply-width row))))
(defun jq:ply-text (m)
  (if m (strcat "합판: " (itoa (nth 0 m)) "자리 x " (itoa (nth 1 m))
    "단 = 띠 " (itoa (nth 3 m)) "개 / 장당 " (itoa (nth 2 m))
    "개 = " (itoa (nth 4 m)) "장 (이어붙임 포함)") "합판 미선택"))
(defun jq:finish-numbers (length height skirting / area pyeong)
  (setq area (* length (/ height 1000.0)) pyeong (/ area (/ 400.0 121.0)))
  (list area pyeong (jq:ceil (/ pyeong 5.0))
    (if (= skirting 1) (jq:ceil (/ (* length 1000.0) 2400.0)) 0)))
(defun jq:finishes (row / c)
  (setq c (jq:calc row))
  (if (= (nth 3 c) "정상")
    (jq:finish-numbers (car c) (jq:get row 'height) (jq:get row 'skirting))))
(defun jq:finish-text (m skirting)
  (if m (strcat "도배 " (jq:fmt (car m)) "㎡ / " (jq:fmt (cadr m)) "평 / "
    (itoa (nth 2 m)) "롤 (5평/롤) / 걸레받이 "
    (if (= skirting 1) (strcat (itoa (nth 3 m)) "개") "미선택")) "마감: 경계를 확인하세요."))
(defun jq:material-text (m)
  (if m (strcat "각재 세로 " (itoa (nth 0 m)) " + 가로 " (itoa (nth 1 m)) " = " (itoa (nth 2 m)) "개 / 석고 " (itoa (nth 3 m)) "장") "자재: 경계를 확인하세요."))
(defun jq:xy (p) (list (car p) (cadr p)))
(defun jq:seglen (a b bulge / chord theta)
  (setq chord (distance (jq:xy a) (jq:xy b)))
  (if (< (abs bulge) 1e-10) chord
    (progn (setq theta (* 4.0 (atan (abs bulge))))
      (/ (* chord theta) (* 2.0 (sin (/ theta 2.0)))))))
(defun jq:polylen (pts bulges closed / i n total)
  (setq i 0 n (length pts) total 0.0)
  (repeat (if closed n (max 0 (1- n)))
    (setq total (+ total (jq:seglen (nth i pts) (nth (rem (1+ i) n) pts) (nth i bulges))) i (1+ i))) total)
(defun jq:length (e / d typ pts bulges p bulge a v q flags total)
  (setq d (entget e) typ (cdr (assoc 0 d)))
  (cond
    ((= typ "LINE")
     (if (not (equal (caddr (cdr (assoc 10 d))) (caddr (cdr (assoc 11 d))) 0.01))
       (jq:fail "높이가 달라지는 3D 선은 벽 길이로 사용할 수 없습니다."))
     (distance (cdr (assoc 10 d)) (cdr (assoc 11 d))))
    ((= typ "ARC")
     (if (not (equal (cdr (assoc 210 d)) '(0.0 0.0 1.0) 1e-6)) (jq:fail "기울어진 호는 지원하지 않습니다."))
     (setq a (- (cdr (assoc 51 d)) (cdr (assoc 50 d))))
     (if (< a 0.0) (setq a (+ a (* 2.0 pi)))) (* (cdr (assoc 40 d)) a))
    ((= typ "LWPOLYLINE")
     (if (and (assoc 210 d) (not (equal (cdr (assoc 210 d)) '(0.0 0.0 1.0) 1e-6)))
       (jq:fail "기울어진 폴리선은 지원하지 않습니다."))
     (foreach a d
       (cond ((= (car a) 10)
              (if p (setq pts (cons p pts) bulges (cons bulge bulges))) (setq p (cdr a) bulge 0.0))
             ((= (car a) 42) (setq bulge (cdr a)))))
     (if p (setq pts (cons p pts) bulges (cons bulge bulges)))
     (jq:polylen (reverse pts) (reverse bulges) (= 1 (logand 1 (cdr (assoc 70 d))))))
    ((= typ "POLYLINE")
     (setq flags (cdr (assoc 70 d)))
     (if (or (/= 0 (logand flags 126))
             (and (assoc 210 d) (not (equal (cdr (assoc 210 d)) '(0.0 0.0 1.0) 1e-6))))
       (jq:fail "3D/곡선맞춤 폴리선은 지원하지 않습니다."))
     (setq q (entnext e))
     (while (and q (= "VERTEX" (cdr (assoc 0 (setq v (entget q))))))
       (setq pts (cons (cdr (assoc 10 v)) pts) bulges (cons (cond ((cdr (assoc 42 v))) (0.0)) bulges) q (entnext q)))
     (jq:polylen (reverse pts) (reverse bulges) (= 1 (logand flags 1))))
    (T (jq:fail "일반 LINE/ARC/2D 폴리선을 선택하세요. 블록 내부 선은 이번 버전에서 제외됩니다."))))

; Records live in the drawing's named-object dictionary and contain entity handles.
; Strings are parsed as data only, never evaluated as executable Lisp.
(defun jq:dict (create / d e)
  (if (setq d (dictsearch (namedobjdict) "JM_QUANTITY_V1")) (cdr (assoc -1 d))
    (if create
      (progn (setq e (entmakex '((0 . "DICTIONARY") (100 . "AcDbDictionary") (281 . 1))))
        (if (not (dictadd (namedobjdict) "JM_QUANTITY_V1" e)) (jq:fail "물량 저장 공간을 만들지 못했습니다.")) e))))
(defun jq:new-id (/ dict i key)
  ; HANDSEED is a DXF header field, not an AutoCAD system variable.
  ; Allocate an unused record key without changing the drawing before confirmation.
  (setq dict (jq:dict nil) i 1 key "Q1")
  (while (and dict (dictsearch dict key)) (setq i (1+ i) key (strcat "Q" (itoa i)))) key)
(defun jq:decode (d / s a r)
  (setq s "") (foreach a d (if (= (car a) 1) (setq s (strcat s (cdr a)))))
  (setq r (vl-catch-all-apply 'read (list s)))
  (if (or (vl-catch-all-error-p r) (not (listp r))) nil r))
(defun jq:valid (r)
  (and (= (jq:get r 'version) 1) (= (type (jq:get r 'id)) 'STR)
       (= (type (jq:get r 'room)) 'STR) (= (type (jq:get r 'item)) 'STR)
       (numberp (jq:get r 'height)) (> (jq:get r 'height) 0.0)
       (numberp (jq:get r 'factor)) (> (jq:get r 'factor) 0.0)
       (member (jq:get r 'sides) '(1 2)) (numberp (jq:get r 'deduct)) (>= (jq:get r 'deduct) 0.0)
       (listp (jq:get r 'handles)) (jq:get r 'handles)
       (vl-every '(lambda (h) (= (type h) 'STR)) (jq:get r 'handles))
       (or (not (= (jq:get r 'mode) "SIDE"))
           (and (member (jq:get r 'side) '(0 1 2 3)) (= 4 (length (jq:get r 'corners)))))))
(defun jq:rows (/ dict d a row out)
  (if (setq dict (jq:dict nil))
    (foreach a (entget dict)
      (if (= (car a) 3)
        (progn (setq d (dictsearch dict (cdr a)) row (jq:decode d))
          (if (and (jq:valid row) (= (cdr a) (jq:get row 'id))) (setq out (cons row out)))))))
  (reverse out))
(defun jq:store (row / dict key old data s e result)
  (setq dict (jq:dict T) key (jq:get row 'id) old (dictsearch dict key)
        s (vl-prin1-to-string row) data '((0 . "XRECORD") (100 . "AcDbXrecord") (280 . 1)))
  (while (> (strlen s) 0) (setq data (append data (list (cons 1 (substr s 1 80)))) s (substr s 81)))
  (setq e (entmakex data)) (if (not e) (jq:fail "물량 정보를 만들지 못했습니다."))
  (if old (dictremove dict key))
  (if (not (dictadd dict key e))
    (progn (if old (dictadd dict key (cdr (assoc -1 old)))) (entdel e) (jq:fail "물량 저장에 실패했습니다.")))
  (if old (entdel (cdr (assoc -1 old))))
  (jq:panel-notify) row)
(defun jq:remove (row / dict e)
  (setq dict (jq:dict nil))
  (if (and dict (setq e (dictremove dict (jq:get row 'id)))) (progn (entdel e) (jq:panel-notify))))
(defun jq:roomtitle (row)
  (strcat (jq:get row 'room) (if (= (jq:get row 'mode) "SIDE") (strcat "-" (nth (jq:get row 'side) '("A" "B" "C" "D"))) "")))
(defun jq:corner-data (pts)
  (mapcar '(lambda (p) (list (rtos (car p) 2 8) (rtos (cadr p) 2 8))) pts))
(defun jq:boundary-points (handles / e h edges)
  (foreach h handles
    (if (not (and (setq e (handent h)) (entget e))) (jq:fail "면 경계에 연결된 선이 누락되었습니다."))
    (setq edges (append edges (qb:entityedges e))))
  (qb:validate (qb:clean (qb:chain edges))))
(defun jq:sidepath (row / pts ids near p)
  (setq pts (jq:boundary-points (jq:get row 'handles)))
  (foreach p (jq:get row 'corners)
    (if (= (type (car p)) 'STR) (setq p (mapcar '(lambda (v) (distof v 2)) p)))
    (setq near (qb:nearest p pts))
    (if (or (> (cadr near) 0.1) (member (car near) ids))
      (jq:fail "A/B/C/D 시작 모서리가 변경되었습니다. 해당 면을 다시 등록하세요."))
    (setq ids (append ids (list (car near)))))
  (if (/= (length ids) 4) (jq:fail "면 구분 정보가 손상되었습니다."))
  (nth (jq:get row 'side) (qb:split pts ids)))
(defun jq:side-rawlength (row)
  (apply '+ (mapcar '(lambda (edge) (distance (car edge) (cadr edge))) (qb:edges (jq:sidepath row) nil))))
(defun jq:calc (row / total bad handle e n metres gross net)
  (setq total 0.0 bad 0)
  (if (= (jq:get row 'mode) "SIDE")
    (progn (setq n (vl-catch-all-apply 'jq:side-rawlength (list row)))
      (if (vl-catch-all-error-p n) (setq bad 1) (setq total n)))
    (foreach handle (jq:get row 'handles)
    (if (and (setq e (handent handle)) (entget e))
      (progn (setq n (vl-catch-all-apply 'jq:length (list e)))
        (if (vl-catch-all-error-p n) (setq bad (1+ bad)) (setq total (+ total n))))
      (setq bad (1+ bad)))))
  (setq metres (/ (* total (jq:get row 'factor)) 1000.0)
        gross (* metres (/ (jq:get row 'height) 1000.0) (jq:get row 'sides))
        net (- gross (jq:get row 'deduct)))
  (list metres gross net
    (cond ((and (> bad 0) (= (jq:get row 'mode) "SIDE")) "확인필요: 면 경계 누락/모서리 변경")
          ((> bad 0) (strcat "확인필요: 선 누락/변경 " (itoa bad) "개"))
          ((< net -1e-8) "확인필요: 공제가 총면적보다 큼") (T "정상"))))
(defun jq:side-overlap (row other / p q a b found)
  (setq p (qb:edges (jq:sidepath row) nil) q (qb:edges (jq:sidepath other) nil))
  (foreach a p (foreach b q (if (qb:overlap a b) (setq found T)))) found)
(defun jq:duplicate (row rows / found other overlap)
  (foreach other rows
    (if (and (/= (jq:get row 'id) (jq:get other 'id))
             (= (jq:get row 'room) (jq:get other 'room)) (= (jq:get row 'item) (jq:get other 'item))
             (vl-some '(lambda (h) (member h (jq:get other 'handles))) (jq:get row 'handles)))
      (if (and (= (jq:get row 'mode) "SIDE") (= (jq:get other 'mode) "SIDE"))
        (progn (setq overlap (vl-catch-all-apply 'jq:side-overlap (list row other)))
          (if (or (vl-catch-all-error-p overlap) overlap) (setq found T)))
        (setq found T)))) found)

(defun jq:write-dcl (/ p f s)
  (setq p (vl-filename-mktemp "JM_Quantity_" nil ".dcl") f (open p "w"))
  (foreach s
    '("jqinput : dialog { label = \"JM 벽체·도배·도장 물량\";"
      ": text { key = \"face\"; width = 65; }"
      ": edit_box { key = \"room\"; label = \"방 번호 / 이름\"; edit_width = 30; }"
      ": popup_list { key = \"item\"; label = \"산출 항목\"; edit_width = 30; }"
      ": edit_box { key = \"height\"; label = \"높이 (mm)\"; edit_width = 20; }"
      ": popup_list { key = \"sides\"; label = \"산출 면\"; edit_width = 30; }"
      ": popup_list { key = \"stock\"; label = \"주문 각재 길이 (mm)\"; edit_width = 30; }"
      ": toggle { key = \"plywood\"; label = \"각재 사이 보강 합판 포함 (1220 x 2440)\"; }"
      ": edit_box { key = \"plywidth\"; label = \"합판 띠 폭(mm), 100mm 벽은 80\"; edit_width = 15; }"
      ": toggle { key = \"skirting\"; label = \"걸레받이 포함 (2400mm/개, 면별 올림)\"; }"
      ": edit_box { key = \"factor\"; label = \"원본 1단위의 실제 길이 (mm)\"; edit_width = 20; }"
      ": edit_box { key = \"deduct\"; label = \"공제할 전체 면적 (㎡)\"; edit_width = 20; }"
      ": text { label = \"공제는 선택한 모든 면의 합계입니다. 양면이면 양쪽 공제를 합산하세요.\"; }"
      ": edit_box { key = \"note\"; label = \"비고\"; edit_width = 40; }"
      ": text { key = \"length\"; width = 65; }"
      ": text { key = \"result\"; width = 65; }"
      ": text { key = \"materials\"; width = 65; }"
      ": text { key = \"plyresult\"; width = 80; }"
      ": text { key = \"finishes\"; width = 80; }"
      ": text { label = \"도배·걸레받이는 한 면 기준, 공제 전 수량입니다. 도배 1롤 = 5평.\"; }"
      ": text { label = \"자재는 1면·석고 1겹 기준, 공제 전 길이/높이로 각 나눗셈을 올림합니다.\"; }"
      ": text { key = \"stockwarn\"; width = 65; }"
      ": text { key = \"error\"; width = 65; }"
      "ok_cancel; }"
      "jqtable : dialog { label = \"JM 물량표 - 현재 선 길이로 계산\";"
      ": text { label = \"방 / 항목 / 길이(m) / 높이(mm) / 면수 / 순면적(㎡) / 상태 / 각재규격 / 자재수량\"; }"
      ": list_box { key = \"rows\"; width = 135; height = 16; }"
      ": text { key = \"total\"; width = 110; }"
      ": row {"
      ": button { key = \"edit\"; label = \"항목 수정\"; }"
      ": button { key = \"show\"; label = \"선택 선 표시\"; }"
      ": button { key = \"export\"; label = \"CSV 내보내기\"; }"
      ": button { key = \"remove\"; label = \"항목 삭제\"; }"
      ": button { key = \"cancel\"; label = \"닫기\"; is_cancel = true; }"
      "} }" ) (write-line s f))
  (close f) p)
(defun jq:input-values (/ h fac ded room pw ply)
  (setq pw (distof (get_tile "plywidth") 2) ply (atoi (get_tile "plywood")))
  (setq h (distof (get_tile "height") 2) fac (distof (get_tile "factor") 2)
        ded (distof (get_tile "deduct") 2) room (vl-string-trim " " (get_tile "room")))
  (if (and (or (= ply 0) (and pw (> pw 0.0) (<= pw 1220.0))) h fac ded (> h 0.0) (> fac 0.0) (>= ded 0.0) (/= room ""))
    (list room (nth (atoi (get_tile "item")) '("벽체" "도배" "도장")) h
          (1+ (atoi (get_tile "sides"))) fac ded (get_tile "note") (nth (atoi (get_tile "stock")) '(2400 2700 3000 3600)) (atoi (get_tile "skirting")) ply (if (and pw (> pw 0.0) (<= pw 1220.0)) pw 80.0))))
(defun jq:preview (/ values len gross net m)
  (if (setq values (jq:input-values))
    (progn (setq len (/ (* jq:raw (nth 4 values)) 1000.0)
                 gross (* len (/ (nth 2 values) 1000.0) (nth 3 values)) net (- gross (nth 5 values)))
      (set_tile "length" (strcat "선택 길이: " (jq:fmt len) " m"))
      (set_tile "result" (strcat "총면적 " (jq:fmt gross) " - 공제 " (jq:fmt (nth 5 values)) " = " (jq:fmt net) " ㎡"))
      (setq m (jq:material-numbers (* len 1000.0) (nth 2 values) (nth 7 values)))
      (set_tile "materials" (jq:material-text m))
      (set_tile "plyresult" (jq:ply-text (if (= (nth 9 values) 1) (jq:ply-numbers (* len 1000.0) (nth 2 values) (nth 10 values)))))
      (set_tile "finishes" (jq:finish-text (jq:finish-numbers len (nth 2 values) (nth 8 values)) (nth 8 values)))
      (set_tile "stockwarn" (if (> (nth 2 values) (nth 7 values)) "벽 높이가 주문 각재 길이보다 큽니다. 세로재의 주문 규격을 확인하세요." ""))
      (set_tile "error" (if (< net 0.0) "공제 면적이 총면적보다 큽니다." "")))
    (progn (set_tile "plyresult" "") (set_tile "finishes" "") (set_tile "materials" "") (set_tile "stockwarn" "") (set_tile "result" "방 이름과 숫자 입력을 확인하세요.") (set_tile "error" "높이·단위계수는 양수, 공제는 0 이상, 합판 띠 폭은 0 초과 1220 이하입니다."))))
(defun jq:accept (/ values)
  (setq values (jq:input-values))
  (if (and values (>= (- (* (/ (* jq:raw (nth 4 values)) 1000.0) (/ (nth 2 values) 1000.0) (nth 3 values)) (nth 5 values)) 0.0))
    (progn (setq jq:values values) (done_dialog 1)) (jq:preview)))
(defun jq:input (row / id status jq:values jq:raw calc a)
  (setq calc (jq:calc row))
  (if (wcmatch (nth 3 calc) "*누락*") (jq:fail "연결된 선이 누락되었습니다. 해당 항목을 삭제하고 선을 다시 선택하세요."))
  (setq jq:raw (/ (* 1000.0 (car calc)) (jq:get row 'factor)) id (load_dialog jq:dcl))
  (if (or (< id 0) (not (new_dialog "jqinput" id))) (jq:fail "물량 입력창을 열지 못했습니다."))
  (set_tile "face" (if (= (jq:get row 'mode) "SIDE") (strcat "현재 입력: " (nth (jq:get row 'side) '("A" "B" "C" "D")) "면 / 이 면에 해당하는 높이와 공제만 입력하세요.") "선택한 선 전체의 물량"))
  (set_tile "room" (jq:get row 'room)) (start_list "item") (mapcar 'add_list '("벽체" "도배" "도장")) (end_list)
  (set_tile "item" (itoa (cond ((vl-position (jq:get row 'item) '("벽체" "도배" "도장"))) (0))))
  (start_list "sides") (mapcar 'add_list '("한쪽 면 (1면)" "양쪽 면 (2면)")) (end_list)
  (set_tile "sides" (itoa (1- (jq:get row 'sides))))
  (start_list "stock") (mapcar 'add_list '("2400" "2700" "3000" "3600")) (end_list)
  (set_tile "stock" (itoa (vl-position (jq:stock row) '(2400 2700 3000 3600))))
  (set_tile "plywood" (if (= (jq:get row 'plywood) 1) "1" "0"))
  (set_tile "plywidth" (rtos (jq:ply-width row) 2 3))
  (set_tile "skirting" (if (= (jq:get row 'skirting) 1) "1" "0"))
  (set_tile "height" (rtos (jq:get row 'height) 2 2))
  (set_tile "factor" (rtos (jq:get row 'factor) 2 6))
  (set_tile "deduct" (rtos (jq:get row 'deduct) 2 6))
  (set_tile "note" (cond ((jq:get row 'note)) ("")))
  (foreach a '("room" "height" "factor" "deduct" "sides" "item" "stock" "skirting" "plywood" "plywidth") (action_tile a "(jq:preview)"))
  (action_tile "accept" "(jq:accept)") (action_tile "cancel" "(done_dialog 0)") (jq:preview)
  (setq status (start_dialog)) (unload_dialog id)
  (if (= status 1)
    (progn
      (foreach a (mapcar 'cons '(room item height sides factor deduct note stock skirting plywood plywidth) jq:values) (setq row (jq:set row (car a) (cdr a)))) row)))
(defun jq:csvfield (s / i out c)
  (if (not (= (type s) 'STR)) (setq s (vl-princ-to-string s)))
  (if (and (> (strlen s) 0) (member (substr s 1 1) '("=" "+" "-" "@"))) (setq s (strcat "'" s)))
  (setq i 1 out "\"")
  (while (<= i (strlen s)) (setq c (substr s i 1) out (strcat out (if (= c "\"") "\"\"" c)) i (1+ i)))
  (strcat out "\""))
(defun jq:csvline (values / out v)
  (setq out "") (foreach v values (setq out (strcat out (if (= out "") "" ",") (jq:csvfield v)))) out)
(defun jq:export (rows path / f row c total item sums bad m finish ply)
  (setq f (vl-catch-all-apply 'open (list path "w" "utf8-bom")))
  (if (vl-catch-all-error-p f) (setq f (open path "w")))
  (if (not f) (jq:fail "CSV를 저장하지 못했습니다. 엑셀에서 파일을 닫고 다시 시도하세요."))
  (write-line (jq:csvline '("방 번호/이름" "항목" "길이(m)" "높이(mm)" "면수" "총면적(㎡)" "공제합계(㎡)" "순면적(㎡)" "상태" "비고" "도면" "주문각재(mm)" "세로각재(개)" "가로각재(개)" "각재합계(개)" "석고900x1800(장,1면1겹)" "자재기준" "도배면적(㎡,1면공제전)" "도배면적(평)" "도배(롤,5평)" "걸레받이선택" "걸레받이2400(개)" "합판선택" "합판띠폭(mm)" "합판연결자리" "합판높이단수" "합판장당띠수" "합판필요띠수" "합판1220x2440(장)")) f)
  (setq bad 0)
  (foreach row rows
    (setq c (jq:calc row) m (jq:materials row) finish (jq:finishes row) ply (jq:plywood row))
    (write-line (jq:csvline (list (jq:roomtitle row) (jq:get row 'item)
      (if (= (nth 3 c) "정상") (jq:fmt (car c)) "") (jq:fmt (jq:get row 'height))
      (itoa (jq:get row 'sides)) (if (= (nth 3 c) "정상") (jq:fmt (cadr c)) "")
      (jq:fmt (jq:get row 'deduct)) (if (= (nth 3 c) "정상") (jq:fmt (nth 2 c)) "")
      (nth 3 c) (cond ((jq:get row 'note)) ("")) (getvar "DWGNAME") (itoa (jq:stock row))
      (if m (itoa (nth 0 m)) "") (if m (itoa (nth 1 m)) "") (if m (itoa (nth 2 m)) "") (if m (itoa (nth 3 m)) "")
      (if (> (jq:get row 'height) (jq:stock row)) "1면1겹/공제전/세로재길이 확인" "1면1겹/공제전")
      (if finish (jq:fmt (car finish)) "") (if finish (jq:fmt (cadr finish)) "")
      (if finish (itoa (nth 2 finish)) "")
      (if (= (jq:get row 'skirting) 1) "포함" "미선택")
      (if (and finish (= (jq:get row 'skirting) 1)) (itoa (nth 3 finish)) "")
      (if (= (jq:get row 'plywood) 1) "포함" "미선택")
      (if (= (jq:get row 'plywood) 1) (jq:fmt (jq:ply-width row)) "")
      (if ply (itoa (nth 0 ply)) "") (if ply (itoa (nth 1 ply)) "")
      (if ply (itoa (nth 2 ply)) "") (if ply (itoa (nth 3 ply)) "")
      (if ply (itoa (nth 4 ply)) ""))) f)
    (if (= (nth 3 c) "정상")
      (progn (setq item (jq:get row 'item)) (setq sums (jq:set sums item (+ (cond ((jq:get sums item)) (0.0)) (nth 2 c)))))
      (setq bad (1+ bad))))
  (write-line "" f)
  (foreach item '("벽체" "도배" "도장")
    (write-line (jq:csvline (list "정상 항목 소계" item "" "" "" "" "" (jq:fmt (cond ((jq:get sums item)) (0.0))) "㎡")) f))
  (if (> bad 0) (write-line (jq:csvline (list "주의" (strcat "확인필요 " (itoa bad) "개 항목은 소계에서 제외했습니다."))) f))
  (close f) path)
(defun jq:show (row / ss h e path a)
  (if (= (jq:get row 'mode) "SIDE")
    (progn (setq path (vl-catch-all-apply 'jq:sidepath (list row)))
      (if (vl-catch-all-error-p path) (jq:fail "경계가 변경되어 면을 표시하지 못했습니다."))
      (redraw)
      (foreach a (qb:edges path nil) (grdraw (trans (qb:p3 (car a)) 0 1) (trans (qb:p3 (cadr a)) 0 1) 1 1))
      (princ (strcat "\n" (jq:roomtitle row) " 구간을 빨간색으로 표시했습니다. 화면 재생성 시 사라집니다.")))
    (progn
  (setq ss (ssadd))
  (foreach h (jq:get row 'handles) (if (and (setq e (handent h)) (entget e)) (ssadd e ss)))
  (if (> (sslength ss) 0) (progn (sssetfirst nil ss) (princ "\n물량 항목에 연결된 선을 선택 표시했습니다.")) (princ "\n연결된 선이 없습니다.")))))
(defun jq:table (/ rows id status jq:index row changed c path sums item bad)
  (setq status 1 jq:index 0)
  (while (= status 1)
    (setq rows (jq:rows)) (if (not rows) (jq:fail "저장된 물량이 없습니다. JMQTY로 먼저 추가하세요."))
    (setq jq:index (min jq:index (1- (length rows))) id (load_dialog jq:dcl))
    (if (or (< id 0) (not (new_dialog "jqtable" id))) (jq:fail "물량표를 열지 못했습니다."))
    (start_list "rows") (setq sums nil bad 0)
    (foreach row rows
      (setq c (jq:calc row))
      (add_list (strcat (jq:roomtitle row) " / " (jq:get row 'item) " / " (jq:fmt (car c)) " / "
        (rtos (jq:get row 'height) 2 0) " / " (itoa (jq:get row 'sides)) " / "
        (if (= (nth 3 c) "정상") (jq:fmt (nth 2 c)) "--") " / " (nth 3 c) " / " (itoa (jq:stock row)) " / " (jq:material-text (jq:materials row))))
      (if (= (nth 3 c) "정상")
        (progn (setq item (jq:get row 'item)) (setq sums (jq:set sums item (+ (cond ((jq:get sums item)) (0.0)) (nth 2 c)))))
        (setq bad (1+ bad))))
    (end_list) (set_tile "rows" (itoa jq:index))
    (set_tile "total" (strcat "정상 항목: 벽체 " (jq:fmt (cond ((jq:get sums "벽체")) (0.0))) " / 도배 "
      (jq:fmt (cond ((jq:get sums "도배")) (0.0))) " / 도장 " (jq:fmt (cond ((jq:get sums "도장")) (0.0)))
      " ㎡   | 확인필요 " (itoa bad) "개 (소계 제외)"))
    (action_tile "rows" "(setq jq:index (atoi $value))")
    (action_tile "edit" "(done_dialog 2)") (action_tile "show" "(done_dialog 3)")
    (action_tile "export" "(done_dialog 4)") (action_tile "remove" "(done_dialog 5)")
    (action_tile "cancel" "(done_dialog 0)")
    (setq status (start_dialog)) (unload_dialog id) (setq row (nth jq:index rows))
    (cond ((= status 2)
           (if (setq changed (jq:input row))
             (if (jq:duplicate changed rows) (alert "같은 방/항목에 이미 포함된 선이 있습니다.") (jq:store changed))) (setq status 1))
          ((= status 3) (jq:show row))
          ((= status 4)
           (setq path (getfiled "물량 CSV 저장" (strcat (getvar "DWGPREFIX") "벽체_도배_도장_물량.csv") "csv" 1))
           (if path (progn (jq:export rows path) (princ (strcat "\nCSV 저장: " path)))) (setq status 1))
          ((= status 5) (jq:remove row) (setq status 1)))))
(defun jq:cleanup () (if (and jq:dcl (findfile jq:dcl)) (vl-file-delete jq:dcl)))
(defun c:JMQADD (/ *error* jq:dcl ss i handles row calc result n e)
  (defun *error* (msg) (jq:cleanup) (if (and msg (not (wcmatch (strcase msg) "*CANCEL*,*QUIT*,*EXIT*"))) (princ (strcat "\nJMQTY: " msg))) (princ))
  (if (/= (getvar "CTAB") "Model") (jq:fail "모형(Model) 탭에서 실행하세요."))
  (princ "\n산출할 벽 기준선만 선택하세요. 벽 두께 양쪽 선을 함께 선택하지 마세요.")
  (setq ss (ssget '((0 . "LINE,ARC,LWPOLYLINE,POLYLINE") (410 . "Model"))))
  (if (not ss) (jq:fail "선택한 선이 없습니다.")) (setq i 0)
  (repeat (sslength ss)
    (setq e (ssname ss i) n (jq:length e))
    (if (<= n 0.0) (jq:fail "길이가 0인 선이 있습니다."))
    (setq handles (cons (cdr (assoc 5 (entget e))) handles) i (1+ i)))
  (setq row (list '(version . 1) (cons 'id (jq:new-id))
    '(room . "101 사무공간") '(item . "도배") '(height . 2580.0) '(factor . 1.0) '(sides . 1) '(deduct . 0.0) '(note . "")
    (cons 'handles (reverse handles))) jq:dcl (jq:write-dcl))
  (if (setq result (jq:input row))
    (if (jq:duplicate result (jq:rows)) (jq:fail "같은 방/항목에 이미 산출한 선이 포함되어 있습니다. JMQEDIT에서 기존 항목을 수정하세요.")
      (progn (jq:store result) (setq calc (jq:calc result))
        (princ (strcat "\n저장: " (jq:get result 'room) " / " (jq:get result 'item) " / " (jq:fmt (nth 2 calc)) " ㎡"))
        (princ "\nJMQTABLE로 물량표 확인, JMQEDIT로 수정. DWG를 저장해야 물량 정보가 보존됩니다."))))
  (jq:cleanup) (princ))
(defun c:JMQEDIT (/ *error* jq:dcl)
  (defun *error* (msg) (jq:cleanup) (if (and msg (not (wcmatch (strcase msg) "*CANCEL*,*QUIT*,*EXIT*"))) (princ (strcat "\nJMQTABLE: " msg))) (princ))
  (setq jq:dcl (jq:write-dcl)) (jq:table) (jq:cleanup) (princ))
(princ "\nJM 물량 2026-09-15i 로드 완료. JMQTY: 물량표 열기 및 면별 물량 / JMQTABLE: 물량표")
(princ)

; Shared, embedded boundary geometry. No elevation Lisp dependency.
(defun qb:fail (s) (if (not jq:quiet) (princ (strcat "\n" s))) (exit))
(defun qb:p2 (p) (list (car p) (cadr p)))
(defun qb:p3 (p) (list (car p) (cadr p) 0.0))
(defun qb:near (a b) (equal a b 0.1))
(defun qb:cross (a b) (- (* (car a) (cadr b)) (* (cadr a) (car b))))
(defun qb:vec (a b) (mapcar '- b a))
(defun qb:dot (a b) (+ (* (car a) (car b)) (* (cadr a) (cadr b))))
(defun qb:turn (a b c / u v)
  (setq u (qb:vec a b) v (qb:vec b c))
  (* (/ 180.0 pi) (atan (abs (qb:cross u v)) (qb:dot u v))))
(defun qb:rotate (pts n / i out)
  (setq i 0)
  (repeat (length pts) (setq out (cons (nth (rem (+ n i) (length pts)) pts) out) i (1+ i)))
  (reverse out))
(defun qb:slice (pts a b / out)
  (while (<= a b) (setq out (cons (nth a pts) out) a (1+ a))) (reverse out))
(defun qb:edges (pts closed / out q)
  (setq q pts)
  (while (cdr q) (setq out (cons (list (car q) (cadr q)) out) q (cdr q)))
  (if closed (setq out (cons (list (last pts) (car pts)) out)))
  (reverse out))

; Read straight segments in WCS. Curves/3D meshes are explicitly rejected.
(defun qb:entityedges (e / d typ pts q vd closed flags p z bulge)
  (setq d (entget e) typ (cdr (assoc 0 d)))
  (cond
    ((= typ "LINE") (setq pts (list (cdr (assoc 10 d)) (cdr (assoc 11 d)))))
    ((= typ "LWPOLYLINE")
     (if (vl-some '(lambda (a) (and (= (car a) 42) (> (abs (cdr a)) 1e-9))) d)
       (qb:fail "곡선이 포함된 경계입니다. 첫 버전은 직선 경계만 지원합니다."))
     (setq z (cond ((cdr (assoc 38 d))) (0.0)))
     (foreach q d (if (= (car q) 10) (setq pts (cons (trans (list (cadr q) (caddr q) z) e 0) pts))))
     (setq pts (reverse pts) closed (= 1 (logand 1 (cdr (assoc 70 d))))))
    ((= typ "POLYLINE")
     (setq flags (cdr (assoc 70 d)))
     (if (/= 0 (logand flags 126)) (qb:fail "곡선 맞춤/3D 폴리선은 지원하지 않습니다."))
     (setq closed (= 1 (logand flags 1)) q (entnext e) z (caddr (cdr (assoc 10 d))))
     (while (and q (= "VERTEX" (cdr (assoc 0 (setq vd (entget q))))))
       (if (and (assoc 42 vd) (> (abs (cdr (assoc 42 vd))) 1e-9)) (qb:fail "곡선 경계는 지원하지 않습니다."))
       (setq p (cdr (assoc 10 vd)) pts (cons (trans (list (car p) (cadr p) z) e 0) pts) q (entnext q)))
     (setq pts (reverse pts)))
    (T (qb:fail "LINE 또는 2D 폴리선을 선택하세요.")))
  (if (< (length pts) 2) (qb:fail "길이가 있는 벽선을 선택하세요."))
  (if (not (vl-every '(lambda (p) (equal (caddr p) (caddr (car pts)) 0.01)) pts))
    (qb:fail "평면이 기울어진 3D 경계는 지원하지 않습니다."))
  (qb:edges (mapcar 'qb:p2 pts) closed))

; Every vertex must have degree two: no gaps, branches, duplicate lines or extra loops.
(defun qb:chain (edges / ed p degree rest found current start out pair)
  (if (or (< (length edges) 4) (> (length edges) 600))
    (qb:fail "4~600개 직선 구간으로 이루어진 방 하나의 경계를 선택하세요."))
  (foreach ed edges
    (if (qb:near (car ed) (cadr ed)) (qb:fail "길이가 0에 가까운 선이 있습니다."))
    (foreach p ed
      (setq degree 0)
      (foreach pair edges (foreach current pair (if (qb:near p current) (setq degree (1+ degree)))))
      (if (/= degree 2) (qb:fail "벽선이 끊기거나 겹치거나 갈라집니다. 방 안쪽 경계 한 줄만 선택하거나 점찍기 방식을 사용하세요."))))
  (setq start (caar edges) current (cadar edges) out (list start current) rest (cdr edges))
  (while rest
    (setq found nil)
    (foreach ed rest (if (or (qb:near current (car ed)) (qb:near current (cadr ed))) (setq found ed)))
    (if (not found) (qb:fail "서로 떨어진 경계가 여러 개 있습니다. 방 하나만 선택하세요."))
    (setq current (if (qb:near current (car found)) (cadr found) (car found))
          out (append out (list current)) rest (vl-remove found rest)))
  (if (not (qb:near current start)) (qb:fail "닫힌 경계가 아닙니다."))
  (reverse (cdr (reverse out))))

(defun qb:clean (pts / changed n i a b c out)
  (setq changed T)
  (while (and changed (> (length pts) 3))
    (setq changed nil n (length pts) i 0 out nil)
    (repeat n
      (setq a (nth (rem (+ i n -1) n) pts) b (nth i pts) c (nth (rem (1+ i) n) pts))
      (if (or (qb:near a b) (< (qb:turn a b c) 0.01))
        (setq changed T) (setq out (cons b out)))
      (setq i (1+ i)))
    (setq pts (reverse out))) pts)

(defun qb:overlap (a b / v w len low high)
  (setq v (qb:vec (car a) (cadr a)) len (distance (car a) (cadr a)))
  (if (and (> len 0.1)
           (< (abs (qb:cross v (qb:vec (car a) (car b)))) (* len 0.01))
           (< (abs (qb:cross v (qb:vec (car a) (cadr b)))) (* len 0.01)))
    (progn
      (setq low (/ (qb:dot v (qb:vec (car a) (car b))) len)
            high (/ (qb:dot v (qb:vec (car a) (cadr b))) len))
      (> (- (min len (max low high)) (max 0.0 (min low high))) 0.01))))

(defun qb:validate (pts / edges n i j a b area)
  (setq edges (qb:edges pts T) n (length pts) area 0.0 i 0)
  (if (< n 4) (qb:fail "네 면으로 나눌 수 있는 닫힌 경계가 필요합니다."))
  (foreach a edges (setq area (+ area (qb:cross (car a) (cadr a)))))
  (if (< (abs area) 1.0) (qb:fail "방 경계의 면적이 너무 작습니다."))
  (repeat n
    (setq j (+ i 2) a (nth i edges))
    (while (< j n)
      (if (not (and (= i 0) (= j (1- n))))
        (progn (setq b (nth j edges))
          (if (or (inters (car a) (cadr a) (car b) (cadr b) T) (qb:overlap a b))
            (qb:fail "경계가 서로 교차합니다. 방 둘레를 순서대로 연결하세요."))))
      (setq j (1+ j)))
    (if (> (qb:turn (nth i pts) (nth (rem (1+ i) n) pts) (nth (rem (+ i 2) n) pts)) 179.9)
      (qb:fail "되돌아가는 중복 구간이 있습니다."))
    (setq i (1+ i))) pts)

(defun qb:nearest (p pts / i best dist d q)
  (setq i 0 dist 1e99)
  (foreach q pts (setq d (distance p q)) (if (< d dist) (setq best i dist d)) (setq i (1+ i)))
  (list best dist))
(defun qb:corner (label pts used / p result done idx per tol)
  (setq per (apply '+ (mapcar '(lambda (e) (distance (car e) (cadr e))) (qb:edges pts T))))
  (setq tol (max 0.5 (* per 0.002)))
  (while (not done)
    (setq p (getpoint (strcat "\n" label "면 시작 모서리(벽 경계의 꼭짓점): ")))
    (if (not p) (qb:fail "취소했습니다."))
    (setq result (qb:nearest (qb:p2 (trans p 1 0)) pts) idx (car result))
    (cond ((> (cadr result) tol) (princ "\n선택한 방 경계의 모서리를 정확히 찍으세요."))
          ((member idx used) (princ "\n이미 지정한 모서리입니다. 다음 면의 시작점을 찍으세요."))
          (T (setq done T)))) idx)

; The picked cyclic order defines viewing order; jogs remain within their parent wall.
(defun qb:split (pts ids / n a offs work k result signedarea)
  (setq n (length pts) a (car ids) offs (mapcar '(lambda (i) (rem (+ (- i a) n) n)) ids))
  (cond
    ((and (< (cadr offs) (caddr offs)) (< (caddr offs) (cadddr offs))) (setq work (qb:rotate pts a)))
    ((and (> (cadr offs) (caddr offs)) (> (caddr offs) (cadddr offs)))
     (setq work (cons (nth a pts) (reverse (cdr (qb:rotate pts a))))
           offs (cons 0 (mapcar '(lambda (i) (- n i)) (cdr offs)))))
    (T (qb:fail "A, B, C, D를 방 둘레의 같은 방향으로 순서대로 지정하세요.")))
  (setq signedarea (apply '+ (mapcar '(lambda (e) (qb:cross (car e) (cadr e))) (qb:edges work T))))
  (setq work (append work (list (car work))) offs (append offs (list n)) k 0)
  (repeat 4 (setq result (cons (qb:slice work (nth k offs) (nth (1+ k) offs)) result) k (1+ k)))
  (setq result (reverse result))
  ; A wall viewed from inside reads left-to-right in clockwise boundary order.
  (if (> signedarea 0.0) (mapcar 'reverse result) result))

(defun c:JMQSIDES (/ *error* jq:dcl jq:batch ss i e handles pts ids idx corners base row result pending stored all a)
  (defun *error* (msg)
    (foreach a stored (jq:remove a))
    (setq jq:batch nil) (jq:panel-notify)
    (jq:cleanup) (redraw)
    (if (and msg (not (wcmatch (strcase msg) "*CANCEL*,*QUIT*,*EXIT*"))) (princ (strcat "\nJMQTY: " msg)))
    (princ "\n면별 산출을 중단했습니다. 이번 네 면은 저장하지 않았습니다.") (princ))
  (if (/= (getvar "CTAB") "Model") (jq:fail "모형(Model) 탭에서 실행하세요."))
  (setq jq:batch T)
  (princ "\n방 하나의 안쪽 닫힌 경계를 선택하세요. 폴리선은 해체하지 않습니다.")
  (setq ss (ssget '((0 . "LINE,LWPOLYLINE,POLYLINE") (410 . "Model"))))
  (if (not ss) (jq:fail "선택한 경계가 없습니다."))
  (setq i 0)
  (repeat (sslength ss)
    (setq e (ssname ss i) handles (append handles (list (cdr (assoc 5 (entget e))))) i (1+ i)))
  (setq pts (jq:boundary-points handles))
  (princ "\n방 둘레를 따라 A → B → C → D 시작 모서리를 같은 방향으로 찍으세요.")
  (princ "\nA~B는 A면, B~C는 B면, C~D는 C면, D~A는 D면입니다. 기둥 꺾임은 면 안에 포함하세요.")
  (foreach a '("A" "B" "C" "D")
    (setq idx (qb:corner a pts ids) ids (append ids (list idx))))
  (qb:split pts ids)
  (setq corners (jq:corner-data (mapcar '(lambda (j) (nth j pts)) ids))
        jq:dcl (jq:write-dcl)
        base (list '(version . 1) '(room . "101 사무공간") '(item . "도배")
          '(height . 2580.0) '(factor . 1.0) '(sides . 1) '(deduct . 0.0) '(note . "")
          '(mode . "SIDE") (cons 'handles handles) (cons 'corners corners)) i 0)
  (princ "\nA/B/C/D 입력창을 차례로 확인합니다. 중간에 취소하면 네 면 모두 저장하지 않습니다.")
  (repeat 4
    (setq row (jq:set (jq:set base 'side i) 'id (strcat "PENDING_" (itoa i))))
    (setq row (jq:set row 'deduct 0.0))
    (if (not (setq result (jq:input row))) (jq:fail "면별 입력을 취소했습니다."))
    (if (jq:duplicate result (append (jq:rows) pending))
      (jq:fail "같은 방/항목에 이미 산출한 구간이 포함되어 있습니다. 기존 항목을 확인하세요."))
    (setq pending (append pending (list result)) base result i (1+ i)))
  (foreach row pending
    (setq row (jq:set row 'id (jq:new-id))) (jq:store row) (setq stored (cons row stored)))
  (setq stored nil jq:batch nil) (jq:panel-notify)
  (jq:cleanup) (redraw)
  (princ "\n완료: A/B/C/D 네 면을 각각 저장했습니다. JMQTABLE에서 확인하세요. DWG도 저장해 주세요.") (princ))
(defun c:JMQTY (/ mode)
  (c:JMQTABLE)
  (initget "Sides Whole")
  (setq mode (getkword "\n산출 방식 [면별ABCD(Sides)/선전체(Whole)] <Sides>: "))
  (if (= mode "Whole") (c:JMQADD) (c:JMQSIDES)) (princ))

; Modeless panel runs outside AutoCAD's modal DCL loop.
; Command-ended reactors only read geometry and write a private snapshot.
(defun jq:panel-refresh (/ jq:quiet stage)
  (setq jq:quiet T stage (strcat jq:panel-path ".next.csv"))
  (jq:export (jq:rows) stage)
  (if (findfile jq:panel-path) (vl-file-delete jq:panel-path))
  (if (not (vl-file-rename stage jq:panel-path)) (jq:fail "물량표 갱신 파일을 교체하지 못했습니다.")) T)
(defun jq:panel-notify (/ result)
  (if (and jq:panel-path (not jq:batch) (not jq:panel-updating) (not (findfile (strcat jq:panel-path ".closed"))))
    (progn (setq jq:panel-updating T)
      (setq result (vl-catch-all-apply 'jq:panel-refresh nil))
      (setq jq:panel-updating nil)
      (if (vl-catch-all-error-p result) (princ "\n물량은 저장됐지만 표 갱신에 실패했습니다. JMQTABLE을 실행해 다시 읽어주세요.")))))
(defun jq:panel-command-ended (reactor params) (jq:panel-notify))
(defun c:JMQTABLE (/ *error* exe script args closed)
  (defun *error* (msg)
    (setq jq:panel-updating nil)
    (if (and msg (not (wcmatch (strcase msg) "*CANCEL*,*QUIT*,*EXIT*"))) (princ (strcat "\n물량표: " msg))) (princ))
  (if (not jq:panel-path) (setq jq:panel-path (vl-filename-mktemp "JM_QuantityView_" nil ".csv")))
  (setq closed (strcat jq:panel-path ".closed"))
  (if (findfile closed) (vl-file-delete closed))
  (jq:panel-refresh)
  (setq script (jq:panel-write-script)
        exe (strcat (getenv "WINDIR") "\\System32\\WindowsPowerShell\\v1.0\\powershell.exe")
        args (strcat "-NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File \"" script "\" -CsvPath \"" jq:panel-path "\""))
  (if (not (startapp exe args)) (jq:fail "별도 물량표 창을 시작하지 못했습니다. JMQEDIT로 기존 표를 사용할 수 있습니다."))
  (if (not jq:panel-reactor)
    (setq jq:panel-reactor (vlr-command-reactor nil '((:vlr-commandEnded . jq:panel-command-ended) (:vlr-commandCancelled . jq:panel-command-ended)))))
  (princ "\n물량표는 별도 창에 계속 표시됩니다. CAD 명령 완료 후 자동 갱신됩니다.")
  (princ "\n물량 수정/연결선 표시: JMQEDIT / 물량 추가: JMQTY") (princ))







; BEGIN EMBEDDED QUANTITY PANEL
(defun jq:panel-write-script (/ path f line)
  (setq path (vl-filename-mktemp "JM_QuantityPanel_" nil ".ps1"))
  (setq f (vl-catch-all-apply 'open (list path "w" "utf8-bom")))
  (if (vl-catch-all-error-p f) (setq f (open path "w")))
  (if (not f) (jq:fail "물량표 실행 파일을 만들지 못했습니다."))
  (foreach line '(
    "param([Parameter(Mandatory=$true)][string]$CsvPath, [switch]$SmokeTest)"
    "$ErrorActionPreference = 'Stop'"
    "Add-Type -AssemblyName System.Windows.Forms"
    "Add-Type -AssemblyName System.Drawing"
    "[System.Windows.Forms.Application]::EnableVisualStyles()"
    "$qtyDigest = [System.Security.Cryptography.SHA256]::Create()"
    "$qtyKey = [BitConverter]::ToString($qtyDigest.ComputeHash([Text.Encoding]::UTF8.GetBytes($CsvPath))).Replace('-','')"
    "$qtyMutex = New-Object System.Threading.Mutex($false, ('Local\\JMQuantity_' + $qtyKey))"
    "if (-not $qtyMutex.WaitOne(0)) { $qtyMutex.Dispose(); exit }"
    "$script:qtyStamp = ''"
    "$script:qtyCount = 0"
    "$script:qtyFailure = ''"
    "$script:qtyForm = New-Object Windows.Forms.Form"
    "$qtyForm.Text = 'JM 면별 물량표'"
    "$qtyForm.Size = New-Object Drawing.Size(1160, 600)"
    "$qtyForm.MinimumSize = New-Object Drawing.Size(540, 320)"
    "$qtyForm.StartPosition = 'CenterScreen'"
    "$qtyForm.Font = New-Object Drawing.Font('맑은 고딕', 9)"
    "$qtyToolbar = New-Object Windows.Forms.FlowLayoutPanel"
    "$qtyToolbar.Dock = 'Top'; $qtyToolbar.Height = 42; $qtyToolbar.Padding = New-Object Windows.Forms.Padding(8)"
    "$qtyReload = New-Object Windows.Forms.Button"
    "$qtyReload.Text = '표 다시 읽기'; $qtyReload.Width = 110"
    "$qtySave = New-Object Windows.Forms.Button"
    "$qtySave.Text = 'CSV 저장'; $qtySave.Width = 100"
    "$qtyTop = New-Object Windows.Forms.CheckBox"
    "$qtyTop.Text = '항상 위에'; $qtyTop.AutoSize = $true; $qtyTop.Margin = New-Object Windows.Forms.Padding(12,5,3,3)"
    "$qtyTop.Checked = $true; $qtyForm.TopMost = $true"
    "$qtyHint = New-Object Windows.Forms.Label"
    "$qtyHint.Text = '수정은 CAD에서 JMQEDIT / 추가는 JMQTY'; $qtyHint.AutoSize = $true"
    "$qtyHint.Margin = New-Object Windows.Forms.Padding(16,5,3,3)"
    "$qtyToolbar.Controls.AddRange(@($qtyReload,$qtySave,$qtyTop,$qtyHint))"
    "$script:qtyStatus = New-Object Windows.Forms.Label"
    "$qtyStatus.Dock = 'Bottom'; $qtyStatus.Height = 52; $qtyStatus.Padding = New-Object Windows.Forms.Padding(8)"
    "$qtyStatus.Text = '도면의 물량 정보를 기다리는 중입니다.'"
    "$script:qtyGrid = New-Object Windows.Forms.DataGridView"
    "$qtyGrid.Dock = 'Fill'; $qtyGrid.ReadOnly = $true; $qtyGrid.AllowUserToAddRows = $false"
    "$qtyGrid.AllowUserToDeleteRows = $false; $qtyGrid.RowHeadersVisible = $false"
    "$qtyGrid.SelectionMode = 'FullRowSelect'; $qtyGrid.MultiSelect = $false"
    "$qtyGrid.BackgroundColor = [Drawing.Color]::White; $qtyGrid.AutoGenerateColumns = $false"
    "$qtyGrid.AutoSizeRowsMode = 'AllCells'; $qtyGrid.AllowUserToOrderColumns = $true"
    "$script:qtyTable = New-Object Data.DataTable"
    "$qtyColumns = @("
    " @('방 번호/이름','방 / 면',170), @('항목','항목',60), @('길이(m)','길이(m)',72),"
    " @('높이(mm)','높이(mm)',75), @('주문각재(mm)','각재 규격',78),"
    " @('세로각재(개)','세로 각재',75), @('가로각재(개)','가로 각재',75),"
    " @('각재합계(개)','각재 합계',75), @('석고900x1800(장,1면1겹)','석고 장수',78),"
    " @('도배면적(㎡,1면공제전)','도배(㎡)',85), @('도배면적(평)','도배(평)',80),"
    " @('도배(롤,5평)','도배(롤)',80), @('걸레받이선택','걸레받이 선택',95), @('걸레받이2400(개)','걸레받이(개)',95),"
    " @('합판선택','합판 선택',85), @('합판띠폭(mm)','합판 띠 폭',90),"
    " @('합판높이단수','합판 단수',80), @('합판필요띠수','합판 띠 수',90), @('합판1220x2440(장)','합판(장)',80),"
    " @('순면적(㎡)','순면적(㎡)',85), @('상태','상태',230))"
    "foreach ($qtyDef in $qtyColumns) {"
    " [void]$qtyTable.Columns.Add($qtyDef[0], [string])"
    " $qtyColumn = New-Object Windows.Forms.DataGridViewTextBoxColumn"
    " $qtyColumn.Name = $qtyDef[0]; $qtyColumn.DataPropertyName = $qtyDef[0]"
    " $qtyColumn.HeaderText = $qtyDef[1]; $qtyColumn.Width = $qtyDef[2]"
    " $qtyColumn.SortMode = 'NotSortable'"
    " [void]$qtyGrid.Columns.Add($qtyColumn)"
    "}"
    "$qtyGrid.DataSource = $qtyTable"
    "$qtyForm.Controls.Add($qtyGrid); $qtyForm.Controls.Add($qtyToolbar); $qtyForm.Controls.Add($qtyStatus)"
    "function Read-QuantitySnapshot {"
    " try {"
    "  if (-not (Test-Path -LiteralPath $CsvPath)) { return }"
    "  $qtyFile = Get-Item -LiteralPath $CsvPath"
    "  $qtyCurrentStamp = $qtyFile.LastWriteTimeUtc.Ticks.ToString() + ':' + $qtyFile.Length"
    "  if ($qtyCurrentStamp -eq $script:qtyStamp) { return }"
    "  $qtyBytes = [IO.File]::ReadAllBytes($CsvPath)"
    "  if ($qtyBytes.Length -lt 5) { return }"
    "  $qtyEncoding = [Text.Encoding]::Default"
    "  if ($qtyBytes[0] -eq 239 -and $qtyBytes[1] -eq 187 -and $qtyBytes[2] -eq 191) { $qtyEncoding = [Text.Encoding]::UTF8 }"
    "  $qtyText = $qtyEncoding.GetString($qtyBytes).TrimStart([char]0xFEFF)"
    "  $qtyAll = @($qtyText | ConvertFrom-Csv)"
    "  $qtyRows = @($qtyAll | Where-Object { $_.'상태' -and $_.'방 번호/이름' -ne '정상 항목 소계' })"
    "  $qtyTable.BeginLoadData()"
    "  $qtyTable.Clear()"
    "  foreach ($qtyRecord in $qtyRows) {"
    "   $qtyDataRow = $qtyTable.NewRow()"
    "   foreach ($qtyCol in $qtyTable.Columns) { $qtyDataRow[$qtyCol.ColumnName] = [string]$qtyRecord.($qtyCol.ColumnName) }"
    "   $qtyTable.Rows.Add($qtyDataRow)"
    "  }"
    "  $qtyTable.EndLoadData()"
    "  foreach ($qtyGridRow in $qtyGrid.Rows) {"
    "   if ($qtyGridRow.Cells['상태'].Value -ne '정상') { $qtyGridRow.DefaultCellStyle.BackColor = [Drawing.Color]::MistyRose }"
    "  }"
    "  $script:qtyCount = $qtyRows.Count"
    "  $qtyDoc = if ($qtyRows.Count) { $qtyRows[0].'도면' } else { '등록된 물량 없음' }"
    "  $qtyBad = @($qtyRows | Where-Object { $_.'상태' -ne '정상' }).Count"
    "  $qtyStatus.Text = $qtyDoc + ' | ' + $qtyRows.Count + '개 항목 | 확인필요 ' + $qtyBad + '개 | 갱신 ' + $qtyFile.LastWriteTime.ToString('HH:mm:ss') + \"`r`nCAD 명령이 끝나면 갱신됩니다. 자재는 면당 1면·석고 1겹·공제 전 기준입니다.\""
    "  $script:qtyStamp = $qtyCurrentStamp; $script:qtyFailure = ''"
    " } catch {"
    "  $script:qtyFailure = $_.Exception.Message"
    "  $qtyStatus.Text = '갱신을 기다리는 중입니다. 이전 표시값을 확인하세요. ' + $script:qtyFailure"
    " }"
    "}"
    "$qtyReload.Add_Click({ $script:qtyStamp=''; Read-QuantitySnapshot })"
    "$qtyTop.Add_CheckedChanged({ $qtyForm.TopMost = $qtyTop.Checked })"
    "$qtySave.Add_Click({"
    " $qtyDialog = New-Object Windows.Forms.SaveFileDialog"
    " $qtyDialog.Filter='CSV 파일 (*.csv)|*.csv'; $qtyDialog.FileName='면별_각재_석고_물량.csv'"
    " if ($qtyDialog.ShowDialog($qtyForm) -eq 'OK') {"
    "  try { [IO.File]::Copy($CsvPath,$qtyDialog.FileName,$true) }"
    "  catch { [void][Windows.Forms.MessageBox]::Show($qtyForm,$_.Exception.Message,'CSV 저장 실패') }"
    " }"
    " $qtyDialog.Dispose()"
    "})"
    "$qtyTimer = New-Object Windows.Forms.Timer"
    "$qtyTimer.Interval=1000"
    "$script:qtyTicks=0"
    "$qtyTimer.Add_Tick({"
    " Read-QuantitySnapshot"
    " if ($SmokeTest) { $script:qtyTicks++; if ($script:qtyTicks -ge 2) { $qtyForm.Close() } }"
    "})"
    "$qtyForm.Add_Shown({ Read-QuantitySnapshot; if ($SmokeTest) { $qtyForm.Hide() }; $qtyTimer.Start() })"
    "$qtyForm.Add_FormClosed({"
    " $qtyTimer.Stop()"
    " try { [IO.File]::WriteAllText($CsvPath+'.closed','closed') } catch {}"
    "})"
    "try { [Windows.Forms.Application]::Run($qtyForm) }"
    "finally { $qtyTimer.Dispose(); $qtyForm.Dispose(); $qtyMutex.ReleaseMutex(); $qtyMutex.Dispose() }"
    "if ($SmokeTest) { @{rows=$script:qtyCount; error=$script:qtyFailure; columns=$qtyColumns.Count} | ConvertTo-Json -Compress }"
  ) (write-line line f))
  (close f) path)
(princ)

; JM estimate-to-CAD links 2026-09-23a. UTF-8 source; CP949 distribution.
(vl-load-com)
(defun jl:g (r k) (cdr (assoc k r)))
(defun jl:s (r k v) (if (assoc k r) (subst (cons k v) (assoc k r) r) (append r (list (cons k v)))))
(defun jl:fail (s) (princ (strcat "\n" s)) (exit))
(defun jl:dict (/ d e)
  (if (setq d (dictsearch (namedobjdict) "JM_ESTIMATE_LINKS_V1")) (cdr (assoc -1 d))
    (progn (setq e (entmakex '((0 . "DICTIONARY") (100 . "AcDbDictionary") (281 . 1))))
      (dictadd (namedobjdict) "JM_ESTIMATE_LINKS_V1" e) e)))
(defun jl:read-state (/ d x)
  (if (setq d (dictsearch (namedobjdict) "JM_ESTIMATE_LINKS_V1"))
    (if (setq x (dictsearch (cdr (assoc -1 d)) "STATE")) (jq:decode x))))
(defun jl:save (state / dict old data s e)
  (setq dict (jl:dict) old (dictsearch dict "STATE") s (vl-prin1-to-string state)
        data '((0 . "XRECORD") (100 . "AcDbXrecord") (280 . 1)))
  (while (> (strlen s) 0) (setq data (append data (list (cons 1 (substr s 1 80)))) s (substr s 81)))
  (setq e (entmakex data))
  (if (not e) (jl:fail "연결 정보를 저장하지 못했습니다."))
  (if old (dictremove dict "STATE"))
  (if (not (dictadd dict "STATE" e))
    (progn (if old (dictadd dict "STATE" (cdr (assoc -1 old)))) (entdel e) (jl:fail "연결 사전 저장 실패")))
  (if old (entdel (cdr (assoc -1 old))))
  (setq jl:state state))
(defun jl:q (s) (strcat "\"" s "\""))
(defun jl:bridge (mode book request output / result exe shell args code f msg value)
  (setq result (vl-filename-mktemp "JM_estimate_" nil ".dat")
        exe (strcat (getenv "WINDIR") "/System32/WindowsPowerShell/v1.0/powershell.exe")
        args (strcat (jl:q exe) " -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "
         (jl:q (jl:bridge-script)) " -Mode " mode " -Book " (jl:q book) " -Result " (jl:q result)))
  (if request (setq args (strcat args " -Request " (jl:q request))))
  (if output (setq args (strcat args " -Output " (jl:q output))))
  (princ "\n내역서를 처리하고 있습니다. 잠시 기다려 주세요...")
  (setq shell (vlax-create-object "WScript.Shell"))
  (setq code (vl-catch-all-apply 'vlax-invoke-method (list shell 'Run args 0 :vlax-true)))
  (vlax-release-object shell)
  (if (or (vl-catch-all-error-p code) (/= code 0) (findfile (strcat result ".error")))
    (progn
      (setq msg "엑셀 처리 실패. Microsoft Excel 설치와 파일 경로를 확인하세요.")
      (if (setq f (open (strcat result ".error") "r")) (progn (setq msg (read-line f)) (close f)))
      (jl:fail msg)))
  result)
(defun c:JMIMPORT (/ *error* path result f line meta items r)
  (defun *error* (msg) (if f (close f)) (if msg (princ (strcat "\n" msg))) (princ))
  (if (jl:g (jl:read-state) 'items) (jl:fail "이 도면에는 이미 내역서가 있습니다. 다른 내역서는 별도 DWG에서 가져오세요."))
  (if (setq path (getfiled "수량을 연결할 내역서 선택 (내역서 시트)" "" "" 0))
    (progn
      (setq result (jl:bridge "Import" path nil nil) f (open result "r") meta (read (read-line f)))
      (while (setq line (read-line f))
        (setq r (read line))
        (if (and (jl:g r 'id) (jl:g r 'row) (jl:g r 'name)) (setq items (cons r items))))
      (close f) (setq f nil)
      (if (not items) (jl:fail "가져온 항목이 없습니다."))
      (jl:save (append meta (list (cons 'items (reverse items)))))
      (princ (strcat "\n" (itoa (length items)) "개 내역을 가져왔습니다. JMLIST로 연결하세요. DWG를 저장하세요.")))) (princ))

; Source identity: one whole entity or one explicit polyline segment.
; Segment fingerprints prevent silent reassignment after a vertex edit.
(defun jl:signature (e / d out a)
  (setq d (entget e))
  (foreach a d (if (member (car a) '(10 38 42 70 90 210)) (setq out (cons a out))))
  (vl-prin1-to-string (reverse out)))
(defun jl:source (e seg)
  (append (list (cons 'handle (cdr (assoc 5 (entget e)))) (cons 'seg seg))
    (if seg (list (cons 'signature (jl:signature e))))))
(defun jl:overlap (a b)
  (and (= (jl:g a 'handle) (jl:g b 'handle))
    (or (null (jl:g a 'seg)) (null (jl:g b 'seg)) (= (jl:g a 'seg) (jl:g b 'seg)))))
(defun jl:entity (source / e)
  (setq e (handent (jl:g source 'handle)))
  (if (not (and e (entget e))) (jl:raise "연결된 객체가 삭제되었습니다."))
  (if (and (jl:g source 'seg) (/= (jl:g source 'signature) (jl:signature e)))
    (jl:raise "폴리선 모서리가 변경되었습니다. 해당 연결을 삭제하고 다시 선택하세요.")) e)
(defun jl:length (source / e i)
  (setq e (jl:entity source) i (jl:g source 'seg))
  (if i (- (vlax-curve-getDistAtParam e (1+ i)) (vlax-curve-getDistAtParam e i))
    (vlax-curve-getDistAtParam e (vlax-curve-getEndParam e))))
(defun jl:area (source / e d)
  (setq e (jl:entity source) d (entget e))
  (if (not (or (= (cdr (assoc 0 d)) "CIRCLE")
      (and (member (cdr (assoc 0 d)) '("LWPOLYLINE" "POLYLINE")) (vlax-curve-isClosed e))))
    (jl:raise "면적은 닫힌 폴리선 또는 원을 선택하세요."))
  (if (jl:g source 'seg) (jl:raise "면적은 전체 경계로 선택하세요."))
  (abs (vlax-curve-getArea e)))
(setq jl:modes '("길이(m)" "닫힌 경계 면적(㎡)" "벽 길이×높이(㎡)" "블록 개수(EA/SET)" "수동 수량(식/인 등)" "각재 합계(EA)" "석고보드(EA)" "보강 합판(EA)" "벽지(롤)" "천장지(롤)" "걸레받이(개)" "면적→BOX"))
(defun jl:number (link / mode factor height stock width pack source total len area)
  (setq mode (jl:g link 'mode) factor (jl:g link 'factor) height (jl:g link 'height)
        stock (jl:g link 'stock) width (jl:g link 'width) pack (jl:g link 'pack) total 0.0)
  (if (= mode 4) (jl:g link 'manual)
    (progn
      (if (not (jl:g link 'sources)) (jl:raise "연결 대상이 없습니다."))
      (foreach source (jl:g link 'sources)
        (cond
          ((= mode 3)
            (if (/= (cdr (assoc 0 (entget (jl:entity source)))) "INSERT") (jl:raise "개수는 블록을 선택하세요."))
            (setq total (1+ total)))
          ((member mode '(1 9 11))
            (setq area (/ (* (jl:area source) factor factor) 1000000.0))
            (setq total (+ total (cond ((= mode 1) area) ((= mode 9) (jq:ceil (/ (* area (/ 121.0 400.0)) 5.0))) ((= mode 11) (jq:ceil (/ area pack)))))))
          (T
            (setq len (* (jl:length source) factor))
            (setq total (+ total
              (cond ((= mode 0) (/ len 1000.0))
                ((= mode 2) (/ (* len height) 1000000.0))
                ((= mode 5) (nth 2 (jq:material-numbers len height stock)))
                ((= mode 6) (nth 3 (jq:material-numbers len height stock)))
                ((= mode 7) (nth 4 (jq:ply-numbers len height width)))
                ((= mode 8) (nth 2 (jq:finish-numbers (/ len 1000.0) height 0)))
                ((= mode 10) (jq:ceil (/ len 2400.0)))
                (T (jl:raise "계산 방식을 확인하세요.")))))))) total)))
(defun jl:summary (item / sum bad r link)
  (setq sum 0.0)
  (foreach link (jl:g item 'links)
    (setq r (vl-catch-all-apply 'jl:number (list link)))
    (if (vl-catch-all-error-p r) (setq bad T) (setq sum (+ sum r))))
  (list sum (cond (bad "INVALID") ((jl:g item 'links) "OK") (T "UNLINKED"))))
(defun jl:put-item (item / items)
  (setq items (mapcar '(lambda (x) (if (= (jl:g x 'id) (jl:g item 'id)) item x)) (jl:g jl:state 'items)))
  (jl:save (jl:s jl:state 'items items)))
(defun jl:pick-sources (mode / kind ss sources picked e p i n d source)
  (if (member mode '(0 2 5 6 7 8 10))
    (progn (initget "Segment Objects") (setq kind (getkword "\n선택 [폴리선 한 변(Segment)/객체 전체(Objects)] <Segment>: ")))
    (setq kind "Objects"))
  (if (/= kind "Objects")
    (while (setq picked (entsel "\n벽 선 또는 폴리선의 해당 변 선택 (Enter 완료): "))
      (setq e (car picked) d (entget e) source nil)
      (cond ((= (cdr (assoc 0 d)) "LWPOLYLINE")
        (setq p (vlax-curve-getClosestPointTo e (trans (cadr picked) 1 0))
              i (min (fix (vlax-curve-getParamAtPoint e p)) (1- (fix (vlax-curve-getEndParam e))))
              source (jl:source e i)))
        ((member (cdr (assoc 0 d)) '("LINE" "ARC")) (setq source (jl:source e nil)))
        (T (princ "\nLINE/ARC/LWPOLYLINE만 선택하세요.")))
      (if (and source (not (vl-some '(lambda (x) (jl:overlap source x)) sources))) (setq sources (cons source sources))))
    (progn
      (princ "\n대상을 선택하세요. 객체 전체 길이/면적을 사용합니다.")
      (setq ss (ssget (list (cons 0 (cond ((= mode 3) "INSERT") ((member mode '(1 9 11)) "LWPOLYLINE,POLYLINE,CIRCLE") (T "LINE,ARC,LWPOLYLINE,POLYLINE,CIRCLE"))))))
      (if ss (progn (setq i 0) (repeat (sslength ss) (setq sources (cons (jl:source (ssname ss i) nil) sources) i (1+ i)))))))
  (reverse sources))
(defun jl:default-mode (item / name unit)
  (setq name (jl:g item 'name) unit (strcase (jl:g item 'unit)))
  (cond ((= name "각재") 5) ((= name "석고보드") 6) ((= name "오징어합판") 7)
    ((= name "벽지") 8) ((= name "천장지") 9) ((= unit "M") 0)
    ((member unit '("M2" "㎡")) 1) ((= unit "BOX") 11) ((member unit '("EA" "SET")) 3) (T 4)))
(defun jl:write-dcl (/ path f line)
  (setq path (vl-filename-mktemp "JM_list_" nil ".dcl") f (open path "w"))
  (foreach line '(
    "jllist:dialog {label=\"JM 내역서와 도면 연결\";"
    ":text {label=\"공종 / 품명 / 규격 / 단위 / CAD 수량 / 연결 상태\";}"
    ":edit_box {key=\"filter\";label=\"공종·품명 검색\";edit_width=35;}"
    ":list_box {key=\"items\";width=140;height=22;}"
    ":text {label=\"미연결은 빈칸으로 내보냅니다. 확인필요 항목은 연결을 복구하세요.\";}"
    ":row {:button {key=\"add\";label=\"도면 연결/추가\";} :button {key=\"show\";label=\"연결 위치 보기\";} :button {key=\"check\";label=\"누락 후보 확인\";} }"
    ":row {:button {key=\"links\";label=\"연결 내역/삭제\";} :button {key=\"export\";label=\"새 엑셀 저장\";} :button {key=\"cancel\";label=\"닫기\";is_cancel=true;} } }"
    "jlinput:dialog {label=\"내역 산출 설정\";"
    ":text {key=\"title\";width=85;}"
    ":popup_list {key=\"mode\";label=\"계산 방식\";edit_width=35;}"
    ":edit_box {key=\"label\";label=\"위치/방/면 이름\";edit_width=35;}"
    ":edit_box {key=\"factor\";label=\"CAD 1단위 = 실제 mm\";edit_width=15;}"
    ":edit_box {key=\"height\";label=\"벽 높이(mm)\";edit_width=15;}"
    ":popup_list {key=\"stock\";label=\"각재 주문 길이(mm)\";edit_width=20;}"
    ":edit_box {key=\"width\";label=\"보강 합판 띠 폭(mm)\";edit_width=15;}"
    ":edit_box {key=\"pack\";label=\"BOX당 면적(㎡), 직접 입력\";edit_width=15;}"
    ":edit_box {key=\"manual\";label=\"수동 수량\";edit_width=15;}"
    ":text {label=\"자재는 선택한 각 선/변마다 올림. 면적 공제·잔재 재사용은 미포함.\";}"
    ":text {label=\"벽지·천장지 EA는 롤로 계산(5평/롤). 블록 하나는 1개입니다.\";}"
    ":text {key=\"error\";width=85;} ok_cancel; }"
    "jllinks:dialog {label=\"선택 항목의 연결 내역\";"
    ":list_box {key=\"links\";width=110;height=18;}"
    ":row {:button {key=\"show\";label=\"위치 보기\";} :button {key=\"remove\";label=\"선택 연결 삭제\";} :button {key=\"cancel\";label=\"닫기\";is_cancel=true;}} }"
  ) (write-line line f)) (close f) path)
(defun jl:accept-input (/ mode factor height width pack manual label)
  (setq mode (atoi (get_tile "mode")) factor (distof (get_tile "factor") 2)
    height (distof (get_tile "height") 2) width (distof (get_tile "width") 2)
    pack (distof (get_tile "pack") 2) manual (distof (get_tile "manual") 2) label (get_tile "label"))
  (if (and factor (> factor 0) height (> height 0) width (> width 0) (<= width 1220)
      (or (/= mode 11) (and pack (> pack 0))) (or (/= mode 4) (and manual (>= manual 0))) (/= label ""))
    (progn (setq jl:input (list (cons 'mode mode) (cons 'factor factor) (cons 'height height)
      (cons 'width width) (cons 'pack (if pack pack 1.0)) (cons 'manual (if manual manual 0.0))
      (cons 'stock (nth (atoi (get_tile "stock")) '(2400 2700 3000 3600))) (cons 'label label))) (done_dialog 1))
    (set_tile "error" "위치명과 양수 치수를 확인하세요. BOX 면적은 필수, 수동 수량은 0 이상입니다.")))
(defun jl:input-dialog (item / status)
  (setq jl:input nil)
  (if (not (new_dialog "jlinput" jl:dclid)) (jl:fail "산출 입력창을 열지 못했습니다."))
  (set_tile "title" (strcat (jl:g item 'name) " / " (jl:g item 'spec) " / " (jl:g item 'unit)))
  (start_list "mode") (mapcar 'add_list jl:modes) (end_list)
  (set_tile "mode" (itoa (jl:default-mode item)))
  (start_list "stock") (mapcar 'add_list '("2400" "2700" "3000" "3600")) (end_list)
  (set_tile "stock" "1") (set_tile "height" "2580") (set_tile "width" "80") (set_tile "factor" "1")
  (set_tile "manual" "1") (set_tile "pack" "") (set_tile "label" "101-A")
  (action_tile "accept" "(jl:accept-input)") (action_tile "cancel" "(done_dialog 0)")
  (if (= (start_dialog) 1) jl:input))
(defun jl:add (item / link sources existing clash r s)
  (if (setq link (jl:input-dialog item))
    (progn
      (if (/= (jl:g link 'mode) 4) (setq sources (jl:pick-sources (jl:g link 'mode))))
      (if (or sources (= (jl:g link 'mode) 4))
        (progn
          (foreach existing (jl:g item 'links)
            (foreach s sources (if (vl-some '(lambda (x) (jl:overlap s x)) (jl:g existing 'sources)) (setq clash T))))

          (if clash (princ "\n같은 항목에 이미 연결한 구간이 포함되어 있습니다. 추가하지 않았습니다.")
            (progn
              (setq link (jl:s link 'sources sources) r (vl-catch-all-apply 'jl:number (list link)))
              (if (vl-catch-all-error-p r) (alert (if jl:last-error jl:last-error (vl-catch-all-error-message r)))
                (progn (jl:put-item (jl:s item 'links (append (jl:g item 'links) (list link))))
                  (princ (strcat "\n추가 수량: " (rtos r 2 3) " " (jl:g item 'unit) ". DWG를 저장하세요.")))))))))))
(defun jl:all-sources (item / out link)
  (foreach link (jl:g item 'links) (setq out (append out (jl:g link 'sources)))) out)
(defun jl:paint (source color / e a b p q i n)
  (setq e (jl:entity source))
  (if (= (cdr (assoc 0 (entget e))) "INSERT") (redraw e 3)
    (progn
      (setq a (if (jl:g source 'seg) (jl:g source 'seg) (vlax-curve-getStartParam e))
            b (if (jl:g source 'seg) (1+ a) (vlax-curve-getEndParam e)) n (max 24 (* 8 (fix (- b a)))) i 0)
      (repeat n
        (setq p (vlax-curve-getPointAtParam e (+ a (* (- b a) (/ (float i) n))))
              q (vlax-curve-getPointAtParam e (+ a (* (- b a) (/ (float (1+ i)) n)))))
        (grdraw (trans p 0 1) (trans q 0 1) color 1) (setq i (1+ i))))))
(defun jl:show (sources / ss source e)
  (redraw) (setq ss (ssadd))
  (foreach source sources (if (setq e (handent (jl:g source 'handle))) (ssadd e ss)))
  (if (> (sslength ss) 0) (command-s "_.ZOOM" "_Object" ss ""))
  (foreach source sources (vl-catch-all-apply 'jl:paint (list source 3)))
  (princ "\n연결 위치를 표시했습니다. 확대/재생성하면 표시가 지워집니다. JMLIST로 다시 확인하세요."))
(defun jl:covered (source linked)
  (vl-some '(lambda (x)
    (and (jl:overlap source x)
      (or (jl:g source 'seg) (null (jl:g x 'seg)))
      (not (vl-catch-all-error-p (vl-catch-all-apply 'jl:entity (list x)))))) linked))
(defun jl:audit (item / mode sources linked missing hit s e i n candidates ss)
  (if (not (jl:g item 'links)) (princ "\n현재 항목에는 연결된 구간이 없습니다."))
  (princ "\n이 항목에서 검사할 대상만 선택하세요. 관련 없는 벽·기호는 제외하세요.")
  (initget "Segments Objects") (setq mode (getkword "\n검사 단위 [폴리선 각 변(Segments)/객체 전체(Objects)] <Segments>: "))
  (setq ss (ssget '((0 . "LINE,ARC,LWPOLYLINE,POLYLINE,CIRCLE,INSERT"))) linked (jl:all-sources item))
  (if ss
    (progn
      (setq i 0)
      (repeat (sslength ss)
        (setq e (ssname ss i) i (1+ i))
        (if (and (/= mode "Objects") (= (cdr (assoc 0 (entget e))) "LWPOLYLINE"))
          (progn (setq n 0) (repeat (fix (vlax-curve-getEndParam e)) (setq candidates (cons (jl:source e n) candidates) n (1+ n))))
          (setq candidates (cons (jl:source e nil) candidates))))
      (redraw)
      (foreach s candidates
        (setq hit (jl:covered s linked))
        (if (not hit) (setq missing (cons s missing)))
        (vl-catch-all-apply 'jl:paint (list s (if hit 3 1))))
      (princ (strcat "\n검사 " (itoa (length candidates)) "개 / 미연결 후보 " (itoa (length missing)) "개. 초록=연결, 빨강=미연결. 블록은 선택 강조로 표시."))
      (if missing (progn (setq ss (ssadd)) (foreach s missing (ssadd (handent (jl:g s 'handle)) ss)) (sssetfirst nil ss)))
      (princ "\n이 검사는 직접 지정한 대상 안에서만 유효합니다. 미연결 후보가 실제 누락인지는 확인하세요."))))
(defun jl:links-dialog (item / link r status idx i)
  (if (not (jl:g item 'links)) (alert "연결 내역이 없습니다.")
    (progn
      (new_dialog "jllinks" jl:dclid) (start_list "links")
      (foreach link (jl:g item 'links)
        (setq r (vl-catch-all-apply 'jl:number (list link)))
        (add_list (strcat (jl:g link 'label) " / " (nth (jl:g link 'mode) jl:modes) " / "
          (if (vl-catch-all-error-p r) (strcat "확인필요: " (if jl:last-error jl:last-error (vl-catch-all-error-message r))) (rtos r 2 3)))))
      (end_list) (set_tile "links" "0") (setq jl:link-index 0)
      (action_tile "links" "(setq jl:link-index (atoi $value))")
      (action_tile "show" "(done_dialog 1)") (action_tile "remove" "(done_dialog 2)") (action_tile "cancel" "(done_dialog 0)")
      (setq status (start_dialog) idx jl:link-index link (nth idx (jl:g item 'links)))
      (cond ((= status 1) (jl:show (jl:g link 'sources)) (setq jl:exit T))
        ((= status 2)
          (setq i -1)
          (jl:put-item (jl:s item 'links (vl-remove-if '(lambda (x) (= (setq i (1+ i)) idx)) (jl:g item 'links))))
          (princ "\n선택한 연결만 삭제했습니다. 도면 객체는 유지됩니다."))))))
(defun jl:csv (value / out i c)
  (setq out "\"" i 1)
  (while (<= i (strlen value)) (setq c (substr value i 1) out (strcat out (if (= c "\"") "\"\"" c)) i (1+ i)))
  (strcat out "\""))
(defun jl:csvline (values / out v)
  (setq out "") (foreach v values (setq out (strcat out (if (= out "") "" ",") (jl:csv v)))) out)
(defun c:JMEXCEL (/ *error* state book output request f item r invalid)
  (defun *error* (msg) (if f (close f)) (if msg (princ (strcat "\n" msg))) (princ))
  (setq state (jl:read-state) book (jl:g state 'book))
  (if (not book) (jl:fail "JMIMPORT로 내역서를 먼저 가져오세요."))
  (if (not (findfile book)) (setq book (getfiled "이동된 원본 내역서를 다시 선택하세요" "" "" 0)))
  (if (not book) (jl:fail "원본 선택을 취소했습니다."))
  (foreach item (jl:g state 'items) (if (= (cadr (jl:summary item)) "INVALID") (setq invalid T)))
  (if invalid (jl:fail "확인필요 연결이 있습니다. 복구 또는 연결 삭제 후 내보내세요."))
  (if (setq output (getfiled "새 내역서 저장 (원본/기존 파일 덮어쓰기 불가)"
    (strcat (vl-filename-directory book) "/" (vl-filename-base book) "_CAD산출" (vl-filename-extension book)) (substr (vl-filename-extension book) 2) 1))
    (progn
      (setq request (vl-filename-mktemp "JM_estimate_export_" nil ".csv") f (open request "w"))
      (write-line "row,name,spec,unit,quantity,state" f)
      (foreach item (jl:g state 'items)
        (setq r (jl:summary item))
        (write-line (jl:csvline (list (itoa (jl:g item 'row)) (jl:g item 'name) (jl:g item 'spec) (jl:g item 'unit) (rtos (car r) 2 8) (cadr r))) f))
      (close f) (setq f nil)
      (jl:bridge "Export" book request output)
      (jl:save (jl:s state 'book book))
      (princ (strcat "\n저장 완료: " output " / 미연결 항목 수량은 빈칸입니다.")))) (princ))
(defun jl:fill (/ item r filter)
  (setq filter (strcase (get_tile "filter")) jl:visible nil)
  (start_list "items")
  (foreach item (jl:g jl:state 'items)
    (if (or (= filter "") (vl-string-search filter (strcase (strcat (jl:g item 'group) " " (jl:g item 'name) " " (jl:g item 'spec)))))
      (progn
        (setq jl:visible (append jl:visible (list item)) r (jl:summary item))
        (add_list (strcat (jl:g item 'group) " / " (jl:g item 'name) " / " (jl:g item 'spec) " / " (jl:g item 'unit) " / "
          (if (= (cadr r) "OK") (rtos (car r) 2 3) "--") " / "
          (cond ((= (cadr r) "OK") "연결됨") ((= (cadr r) "INVALID") "확인필요") (T "미연결")))))))
  (end_list) (setq jl:index 0) (if jl:visible (set_tile "items" "0")))
(defun c:JMLISTCLASSIC (/ *error* jl:state jl:dcl jl:dclid jl:visible jl:index jl:exit status item)
  (defun *error* (msg)
    (if jl:dclid (unload_dialog jl:dclid)) (if jl:dcl (vl-file-delete jl:dcl))
    (if msg (princ (strcat "\n내역 연결: " msg))) (princ))
  (setq jl:state (jl:read-state))
  (if (not (jl:g jl:state 'items)) (progn (c:JMIMPORT) (setq jl:state (jl:read-state))))
  (if (jl:g jl:state 'items)
    (progn
      (setq jl:dcl (jl:write-dcl) jl:dclid (load_dialog jl:dcl))
      (if (< jl:dclid 0) (jl:fail "내역 목록 창을 열지 못했습니다."))
      (while (not jl:exit)
        (if (not (new_dialog "jllist" jl:dclid)) (jl:fail "내역 목록 창 오류"))
        (jl:fill) (action_tile "filter" "(jl:fill)") (action_tile "items" "(setq jl:index (atoi $value))")
        (action_tile "add" "(done_dialog 1)") (action_tile "show" "(done_dialog 2)")
        (action_tile "check" "(done_dialog 3)") (action_tile "links" "(done_dialog 4)")
        (action_tile "export" "(done_dialog 5)") (action_tile "cancel" "(done_dialog 0)")
        (setq status (start_dialog) item (nth jl:index jl:visible))
        (cond ((= status 0) (setq jl:exit T))
          ((= status 5) (c:JMEXCEL))
          ((null item) (alert "목록에서 항목을 선택하세요."))
          ((= status 1) (jl:settings-open item) (setq jl:exit T))
          ((= status 2) (jl:show (jl:all-sources item)) (setq jl:exit T))
          ((= status 3) (jl:audit item) (setq jl:exit T))
          ((= status 4) (jl:links-dialog item))))
      (unload_dialog jl:dclid) (vl-file-delete jl:dcl))) (princ))
(princ "\nJM 내역 연결 2026-09-23a: JMLIST / JMIMPORT / JMEXCEL") (princ)

(defun jl:raise (s) (setq jl:last-error s) (exit))

(defun jl:write-snapshot (/ f item r)
  (if (not jl:ui-snapshot) (setq jl:ui-snapshot (vl-filename-mktemp "JM_list_view_" nil ".csv")))
  (setq f (open jl:ui-snapshot "w"))
  (write-line "id,group,name,spec,unit,quantity,status,links" f)
  (foreach item (jl:g jl:state 'items)
    (setq r (jl:summary item))
    (write-line (jl:csvline (list (jl:g item 'id) (jl:g item 'group) (jl:g item 'name) (jl:g item 'spec) (jl:g item 'unit)
      (if (= (cadr r) "OK") (rtos (car r) 2 3) "-")
      (cond ((= (cadr r) "OK") "연결됨") ((= (cadr r) "INVALID") "확인필요") (T "미연결"))
      (itoa (length (jl:g item 'links))))) f))
  (close f) jl:ui-snapshot)
(defun jl:ui-dialog (/ snapshot result args shell code f choice)
  (setq snapshot (jl:write-snapshot) result (vl-filename-mktemp "JM_list_action_" nil ".dat")
    args (strcat (jl:q (strcat (getenv "WINDIR") "/System32/WindowsPowerShell/v1.0/powershell.exe"))
      " -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File " (jl:q (jl:ui-script))
      " -Snapshot " (jl:q snapshot) " -Result " (jl:q result)))
  (setq shell (vlax-create-object "WScript.Shell") code (vl-catch-all-apply 'vlax-invoke-method (list shell 'Run args 0 :vlax-true)))
  (vlax-release-object shell)
  (if (or (vl-catch-all-error-p code) (/= code 0) (not (findfile result)))
    (jl:fail "새 목록창을 열지 못했습니다. JMLISTCLASSIC으로 기존 창을 사용할 수 있습니다."))
  (setq f (open result "r") choice (read (read-line f))) (close f) (vl-file-delete result) choice)
(defun c:JMLIST (/ *error* jl:state jl:dcl jl:dclid jl:exit choice status item)
  (defun *error* (msg)
    (if jl:dclid (unload_dialog jl:dclid)) (if jl:dcl (vl-file-delete jl:dcl))
    (if msg (princ (strcat "\n내역 연결: " msg))) (princ))
  (jl:settings-dismiss)
  (setq jl:state (jl:read-state))
  (if (not (jl:g jl:state 'items)) (progn (c:JMIMPORT) (setq jl:state (jl:read-state))))
  (if (jl:g jl:state 'items)
    (progn
      (setq jl:dcl (jl:write-dcl) jl:dclid (load_dialog jl:dcl))
      (if (< jl:dclid 0) (jl:fail "산출 입력창을 열지 못했습니다."))
      (while (not jl:exit)
        (setq choice (jl:ui-dialog) status (jl:g choice 'action)
          item (vl-some '(lambda (x) (if (= (jl:g x 'id) (jl:g choice 'id)) x)) (jl:g jl:state 'items)))
        (cond ((or (null status) (= status 0)) (setq jl:exit T))
          ((= status 5) (c:JMEXCEL))
          ((null item) (alert "목록에서 항목을 선택하세요."))
          ((= status 1) (jl:settings-open item) (setq jl:exit T))
          ((= status 2) (jl:show (jl:all-sources item)) (setq jl:exit T))
          ((= status 3) (jl:audit item) (setq jl:exit T))
          ((= status 4) (jl:links-dialog item))))
      (unload_dialog jl:dclid) (vl-file-delete jl:dcl))) (princ))

; Modeless settings: launch without waiting; finish JMLIST so CAD is idle.
(defun jl:settings-reply (msg / f)
  (if jl:settings (progn (setq f (open (strcat (jl:g jl:settings 'path) ".reply") "w")) (write-line msg f) (close f))))
(defun jl:settings-open (item / app doc path token f exe args)
  (if jl:settings (progn (setq f (open (strcat (jl:g jl:settings 'path) ".closed") "w")) (close f)))
  (setq app (vlax-get-acad-object) doc (vla-get-ActiveDocument app)
    path (vl-filename-mktemp "JM_settings_" nil ".csv") token (vl-filename-base path))
  (setq f (open path "w"))
  (write-line "token,id,title,mode,docname,docfull,hwnd" f)
  (write-line (jl:csvline (list token (jl:g item 'id) (strcat (jl:g item 'name) " / " (jl:g item 'spec) " / " (jl:g item 'unit))
    (itoa (jl:default-mode item)) (vla-get-Name doc) (vla-get-FullName doc) (vl-princ-to-string (vla-get-HWND app)))) f)
  (close f)
  (setq jl:settings (list (cons 'path path) (cons 'token token) (cons 'id (jl:g item 'id)))
    exe (strcat (getenv "WINDIR") "/System32/WindowsPowerShell/v1.0/powershell.exe")
    args (strcat "-NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File " (jl:q (jl:settings-script)) " -Config " (jl:q path)))
  (if (not (startapp exe args)) (jl:fail "설정창을 시작하지 못했습니다."))
  (princ "\n설정창을 켜둔 채 도면을 이동·확대하세요. 준비되면 설정창의 도면 선택 버튼을 누르세요."))
(defun jl:request-valid (r / mode)
  (setq mode (jl:g r 'mode))
  (and (= (type mode) 'INT) (<= 0 mode) (<= mode 11)
    (= (type (jl:g r 'label)) 'STR) (/= (jl:g r 'label) "")
    (= (type (jl:g r 'nonce)) 'STR) (= 32 (strlen (jl:g r 'nonce)))
    (vl-every '(lambda (k) (numberp (jl:g r k))) '(factor height stock width pack manual))
    (> (jl:g r 'factor) 0)
    (or (not (member mode '(2 5 6 7 8))) (> (jl:g r 'height) 0))
    (or (/= mode 5) (member (jl:g r 'stock) '(2400 2700 3000 3600)))
    (or (/= mode 7) (and (> (jl:g r 'width) 0) (<= (jl:g r 'width) 1220)))
    (or (/= mode 11) (> (jl:g r 'pack) 0))
    (or (/= mode 4) (>= (jl:g r 'manual) 0))))
(defun jl:commit-link (item link sources / existing s clash r)
  (foreach existing (jl:g item 'links)
    (foreach s sources (if (vl-some '(lambda (x) (jl:overlap s x)) (jl:g existing 'sources)) (setq clash T))))
  (if clash (jl:raise "이미 이 항목에 연결한 구간입니다. 중복 저장하지 않았습니다."))
  (setq link (jl:s link 'sources sources) r (jl:number link))
  (jl:put-item (jl:s item 'links (append (jl:g item 'links) (list link)))) r)
(defun jl:pick-request (token / *error* jl:state f path request item sources r link jl:owned)
  (defun *error* (msg)
    (if f (close f))
    (if jl:owned (jl:settings-reply (if jl:last-error jl:last-error "선택을 취소했습니다. 설정은 유지됩니다.")))
    (setq jl:last-error nil) (princ))
  (setq jl:last-error nil)
  (if (not (and jl:settings (= token (jl:g jl:settings 'token))))
    (progn (princ "\n다른 도면 또는 만료된 설정창의 요청은 실행하지 않습니다.") (exit)))
  (setq jl:owned T)
  (if (findfile (strcat (jl:g jl:settings 'path) ".closed")) (jl:raise "닫힌 설정창의 요청은 실행하지 않습니다."))
  (setq path (strcat (jl:g jl:settings 'path) ".request"))
  (if (not (findfile path)) (jl:raise "설정창에서 도면 선택 버튼을 먼저 누르세요."))
  (setq f (open path "r") request (read (read-line f))) (close f) (setq f nil)
  (if (not (and (= token (jl:g request 'token)) (= (jl:g request 'id) (jl:g jl:settings 'id)) (jl:request-valid request)))
    (jl:raise "설정 값이 유효하지 않습니다. 설정창을 다시 열어주세요."))
  (if (= (jl:g jl:settings 'lastnonce) (jl:g request 'nonce)) (jl:raise "이미 처리한 요청입니다. 중복 저장하지 않았습니다."))
  (setq jl:settings (jl:s jl:settings 'lastnonce (jl:g request 'nonce)))
  (vl-file-delete path)
  (setq jl:state (jl:read-state) item (vl-some '(lambda (x) (if (= (jl:g x 'id) (jl:g request 'id)) x)) (jl:g jl:state 'items)))
  (if (not item) (jl:raise "연결할 내역 항목을 찾지 못했습니다."))
  (setq link (vl-remove-if '(lambda (x) (member (car x) '(token nonce id))) request))
  (if (/= (jl:g link 'mode) 4) (setq sources (jl:pick-sources (jl:g link 'mode))))
  (if (or sources (= (jl:g link 'mode) 4))
    (progn
      (if (findfile (strcat (jl:g jl:settings 'path) ".closed")) (jl:raise "설정창이 닫혀 저장을 취소했습니다."))
      (setq r (jl:commit-link item link sources))
      (jl:settings-reply (strcat "저장 완료: " (rtos r 2 3) " " (jl:g item 'unit) ". 다른 위치를 계속 추가할 수 있습니다."))
      (princ (strcat "\n추가 수량: " (rtos r 2 3) " / DWG를 저장하세요.")))
    (jl:settings-reply "선택한 대상이 없습니다. 다시 선택할 수 있습니다.")) (princ))
(defun c:JMLPICK ()
  (if jl:settings (jl:pick-request (jl:g jl:settings 'token)) (princ "\nJMLIST에서 산출 설정을 먼저 여세요.")) (princ))

(defun jl:settings-dismiss (/ f)
  (if jl:settings (progn
    (setq f (open (strcat (jl:g jl:settings 'path) ".closed") "w"))
    (close f) (setq jl:settings nil))))


(defun jl:bridge-script (/ p f line)
  (setq p (vl-filename-mktemp "JM_ExcelBridge_" nil ".ps1") f (open p "w" "utf8-bom"))
  (foreach line '(
"param("
" [Parameter(Mandatory=$true)][ValidateSet('Import','Export')][string]$Mode,"
" [Parameter(Mandatory=$true)][string]$Book,"
" [Parameter(Mandatory=$true)][string]$Result,"
" [string]$Request,"
" [string]$Output,"
" [string]$Sheet='내역서'"
")"
"$ErrorActionPreference='Stop'"
"$excel=$null; $workbook=$null; $temporary=$null"
"$encoding=[Text.Encoding]::GetEncoding(949)"
"function LispString([string]$value) {"
" '\"'+$value.Replace('\\','\\\\').Replace('\"','\\\"').Replace(\"`r\",' ').Replace(\"`n\",' ').Replace(\"`t\",' ')+'\"'"
"}"
"function CellText($value) { if ($null -eq $value) { '' } else { ([string]$value).Trim() } }"
"try {"
" $Book=[IO.Path]::GetFullPath($Book)"
" if (-not (Test-Path -LiteralPath $Book -PathType Leaf)) { throw '원본 내역서 파일을 찾을 수 없습니다.' }"
" $excel=New-Object -ComObject Excel.Application"
" $excel.Visible=$false; $excel.DisplayAlerts=$false"
" $excel.AutomationSecurity=3; $excel.AskToUpdateLinks=$false"
" $workbook=$excel.Workbooks.Open($Book,0,$true)"
" $ws=$workbook.Worksheets.Item($Sheet)"
" $values=$ws.UsedRange.Value2"
" if ($ws.UsedRange.Row -ne 1 -or $ws.UsedRange.Column -ne 1) { throw '내역서의 시작 셀은 A1이어야 합니다.' }"
" if ((CellText $values[3,5]) -ne '수량' -or (CellText $values[3,4]) -ne '단위') { throw '지원 양식: 내역서 D열 단위, E열 수량, 3행 제목.' }"
" if ($Mode -eq 'Import') {"
"  $lines=New-Object 'System.Collections.Generic.List[string]'"
"  $lines.Add('((version . 1) (book . '+(LispString $Book)+') (sheet . '+(LispString $Sheet)+'))')"
"  $group=''; $section=''"
"  for ($r=6;$r -le $values.GetLength(0);$r++) {"
"   $name=CellText $values[$r,2]; $spec=CellText $values[$r,3]; $unit=CellText $values[$r,4]"
"   if (-not $name -or $name.StartsWith('[')) { continue }"
"   if ($null -ne $values[$r,1] -and $unit -eq '') { $group=$name; $section=''; continue }"
"   if ($unit -eq '') { $section=$name; continue }"
"   $label=$group; if ($section) { $label+=' / '+$section }"
"   $lines.Add('((id . \"R'+$r+'\") (row . '+$r+') (group . '+(LispString $label)+') (name . '+(LispString $name)+') (spec . '+(LispString $spec)+') (unit . '+(LispString $unit)+'))')"
"  }"
"  if ($lines.Count -lt 2) { throw '가져올 내역 항목이 없습니다.' }"
"  # Never silently replace unsupported characters when communicating with legacy AutoLISP."
"  $strict=[Text.Encoding]::GetEncoding(949,[Text.EncoderExceptionFallback]::new(),[Text.DecoderExceptionFallback]::new())"
"  [IO.File]::WriteAllText($Result,($lines -join \"`r`n\"),$strict)"
" } else {"
"  $Output=[IO.Path]::GetFullPath($Output)"
"  if ($Output -eq $Book -or (Test-Path -LiteralPath $Output)) { throw '원본 또는 기존 파일은 덮어쓰지 않습니다. 새 파일명을 지정하세요.' }"
"  if ([IO.Path]::GetExtension($Output) -ne [IO.Path]::GetExtension($Book)) { throw '원본과 같은 확장자로 저장하세요.' }"
"  $updates=@(Import-Csv -LiteralPath $Request -Encoding Default)"
"  if ($updates.Count -eq 0) { throw '내보낼 내역이 없습니다.' }"
"  $expectedRows=@()"
"  for ($r=6;$r -le $values.GetLength(0);$r++) {"
"   $name=CellText $values[$r,2]; $unit=CellText $values[$r,4]"
"   if ($name -and -not $name.StartsWith('[') -and $unit) { $expectedRows+=$r }"
"  }"
"  if ($updates.Count -ne $expectedRows.Count) { throw '내역서 항목 수가 달라졌습니다. 이 결과는 원래 가져온 내역서에만 저장할 수 있습니다.' }"
"  $seen=@{}"
"  foreach ($u in $updates) {"
"   $r=0"
"   if (-not [int]::TryParse($u.row,[ref]$r) -or $r -lt 6 -or $r -gt $values.GetLength(0) -or $r -notin $expectedRows -or $seen.ContainsKey($r)) { throw '내역 행 번호가 잘못되었거나 중복되었습니다.' }"
"   $seen[$r]=$true"
"   if ((CellText $values[$r,2]) -ne $u.name -or (CellText $values[$r,3]) -ne $u.spec -or (CellText $values[$r,4]) -ne $u.unit) { throw \"내역서 ${r}행이 변경되었습니다. 다시 가져온 후 연결 상태를 확인하세요.\" }"
"   if ($u.state -eq 'INVALID') { throw \"${r}행에 끊어진 도면 연결이 있습니다. 복구 후 내보내세요.\" }"
"   if ($u.state -notin @('OK','UNLINKED')) { throw '알 수 없는 연결 상태입니다.' }"
"   if ($ws.Cells.Item($r,5).HasFormula) { throw \"${r}행 수량 셀에 수식이 있습니다. 자동으로 덮어쓰지 않습니다.\" }"
"   if ($u.state -eq 'OK') {"
"    $n=0.0"
"    if (-not [double]::TryParse($u.quantity,[Globalization.NumberStyles]::Float,[Globalization.CultureInfo]::InvariantCulture,[ref]$n) -or [double]::IsNaN($n) -or [double]::IsInfinity($n) -or $n -lt 0) { throw \"${r}행의 수량이 유효하지 않습니다.\" }"
"    $ws.Cells.Item($r,5).Value2=$n"
"   } else { $ws.Cells.Item($r,5).ClearContents() | Out-Null }"
"  }"
"  # Export a complete CAD-derived result: unlinked detail quantities stay blank."
"  $excel.CalculateFull()"
"  $temporary=Join-Path ([IO.Path]::GetDirectoryName($Output)) (([IO.Path]::GetFileNameWithoutExtension($Output))+'.'+[guid]::NewGuid().ToString('N')+[IO.Path]::GetExtension($Output))"
"  $workbook.SaveCopyAs($temporary)"
"  [IO.File]::Move($temporary,$Output); $temporary=$null"
"  [IO.File]::WriteAllText($Result,'((ok . 1) (output . '+(LispString $Output)+'))',$encoding)"
" }"
"} catch {"
" [IO.File]::WriteAllText($Result+'.error',$_.Exception.Message,$encoding)"
" exit 1"
"} finally {"
" if ($workbook) { $workbook.Close($false) }"
" if ($excel) { $excel.Quit(); [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($excel) }"
" if ($temporary -and (Test-Path -LiteralPath $temporary)) { Remove-Item -LiteralPath $temporary }"
"}"
  ) (write-line line f)) (close f) p)


(defun jl:ui-script (/ p f line)
  (setq p (vl-filename-mktemp "JM_ListUI_" nil ".ps1") f (open p "w" "utf8-bom"))
  (foreach line '(
"param([Parameter(Mandatory=$true)][string]$Snapshot,[Parameter(Mandatory=$true)][string]$Result,[switch]$SmokeTest)"
"$ErrorActionPreference='Stop'"
"Add-Type -AssemblyName System.Windows.Forms"
"Add-Type -AssemblyName System.Drawing"
"[Windows.Forms.Application]::EnableVisualStyles()"
"$records=@(Import-Csv -LiteralPath $Snapshot -Encoding Default)"
"$script:selection=''; $script:loading=$true"
"$statePath=$Snapshot+'.ui.json'"
"$previous=$null"
"if(Test-Path -LiteralPath $statePath){try{$previous=Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json}catch{}}"
"$screen=[Windows.Forms.Screen]::PrimaryScreen.WorkingArea"
"$form=New-Object Windows.Forms.Form"
"$form.Text='JM 물량 산출 · 내역서 연결'"
"$form.StartPosition='CenterScreen'; $form.AutoScaleMode='Dpi'"
"$form.Size=New-Object Drawing.Size([Math]::Min(1240,$screen.Width-40),[Math]::Min(810,$screen.Height-50))"
"$form.MinimumSize=New-Object Drawing.Size(940,600)"
"$form.Font=New-Object Drawing.Font('맑은 고딕',11)"
"$form.BackColor=[Drawing.Color]::FromArgb(245,247,250)"
"$layout=New-Object Windows.Forms.TableLayoutPanel"
"$layout.Dock='Fill'; $layout.Padding=New-Object Windows.Forms.Padding(20);$layout.ColumnCount=1;$layout.RowCount=6"
"foreach($h in @(54,54,32)){$layout.RowStyles.Add((New-Object Windows.Forms.RowStyle('Absolute',$h))) | Out-Null}"
"$layout.RowStyles.Add((New-Object Windows.Forms.RowStyle('Percent',100))) | Out-Null"
"$layout.RowStyles.Add((New-Object Windows.Forms.RowStyle('Absolute',86))) | Out-Null"
"$layout.RowStyles.Add((New-Object Windows.Forms.RowStyle('Absolute',56))) | Out-Null"
"$form.Controls.Add($layout)"
"$header=New-Object Windows.Forms.TableLayoutPanel;$header.Dock='Fill';$header.ColumnCount=3"
"$header.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Percent',100))) | Out-Null"
"$header.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',125))) | Out-Null"
"$header.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',170))) | Out-Null"
"$title=New-Object Windows.Forms.Label;$title.Text='내역서에서 품목을 선택하세요';$title.Dock='Fill';$title.Font=New-Object Drawing.Font('맑은 고딕',16,[Drawing.FontStyle]::Bold)"
"$export=New-Object Windows.Forms.Button;$export.Text='새 엑셀로 저장';$export.Dock='Fill';$export.Height=40;$export.FlatStyle='Flat';$export.BackColor=[Drawing.Color]::White"
"$fontSize=New-Object Windows.Forms.ComboBox;$fontSize.DropDownStyle='DropDownList';$fontSize.Items.AddRange(@('글자 11','글자 12','글자 13'));$fontSize.SelectedIndex=0;$fontSize.Dock='Top';$fontSize.Margin=New-Object Windows.Forms.Padding(6,6,12,0)"
"$header.Controls.Add($title,0,0);$header.Controls.Add($fontSize,1,0);$header.Controls.Add($export,2,0);$layout.Controls.Add($header,0,0)"
"$filters=New-Object Windows.Forms.TableLayoutPanel;$filters.Dock='Fill';$filters.ColumnCount=7"
"foreach($w in @(52,190,52,135,52)){$filters.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',$w))) | Out-Null}"
"$filters.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Percent',100))) | Out-Null"
"$filters.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',72))) | Out-Null"
"function MakeLabel($text){$l=New-Object Windows.Forms.Label;$l.Text=$text;$l.Dock='Fill';$l.TextAlign='MiddleLeft';return $l}"
"$group=New-Object Windows.Forms.ComboBox;$group.DropDownStyle='DropDownList';$group.Dock='Fill';$group.Margin=New-Object Windows.Forms.Padding(2,8,10,0)"
"$group.Items.Add('전체 공종') | Out-Null"
"@($records | ForEach-Object{$_.group} | Select-Object -Unique) | ForEach-Object{$group.Items.Add($_) | Out-Null};$group.SelectedIndex=0"
"$status=New-Object Windows.Forms.ComboBox;$status.DropDownStyle='DropDownList';$status.Dock='Fill';$status.Margin=New-Object Windows.Forms.Padding(2,8,10,0)"
"$status.Items.AddRange(@('전체 상태','미연결','연결됨','확인필요'));$status.SelectedIndex=0"
"$search=New-Object Windows.Forms.TextBox;$search.Dock='Fill';$search.Margin=New-Object Windows.Forms.Padding(2,8,10,0)"
"$reset=New-Object Windows.Forms.Button;$reset.Text='초기화';$reset.Dock='Fill';$reset.FlatStyle='Flat';$reset.BackColor=[Drawing.Color]::White"
"$filters.Controls.Add((MakeLabel '공종'),0,0);$filters.Controls.Add($group,1,0);$filters.Controls.Add((MakeLabel '상태'),2,0);$filters.Controls.Add($status,3,0);$filters.Controls.Add((MakeLabel '검색'),4,0);$filters.Controls.Add($search,5,0);$filters.Controls.Add($reset,6,0)"
"$layout.Controls.Add($filters,0,1)"
"$counts=MakeLabel ''; $counts.ForeColor=[Drawing.Color]::FromArgb(74,88,108);$counts.Font=New-Object Drawing.Font('맑은 고딕',10);$layout.Controls.Add($counts,0,2)"
"$grid=New-Object Windows.Forms.DataGridView"
"$grid.Dock='Fill';$grid.ReadOnly=$true;$grid.AllowUserToAddRows=$false;$grid.AllowUserToDeleteRows=$false;$grid.RowHeadersVisible=$false"
"$grid.SelectionMode='FullRowSelect';$grid.MultiSelect=$false;$grid.AutoGenerateColumns=$false;$grid.AllowUserToResizeRows=$false"
"$grid.BackgroundColor=[Drawing.Color]::White;$grid.BorderStyle='None';$grid.CellBorderStyle='SingleHorizontal';$grid.GridColor=[Drawing.Color]::FromArgb(230,234,240)"
"$grid.EnableHeadersVisualStyles=$false;$grid.ColumnHeadersHeight=40;$grid.ColumnHeadersHeightSizeMode='DisableResizing'"
"$grid.ColumnHeadersDefaultCellStyle.BackColor=[Drawing.Color]::FromArgb(233,238,245)"
"$grid.ColumnHeadersDefaultCellStyle.Font=New-Object Drawing.Font('맑은 고딕',11,[Drawing.FontStyle]::Bold)"
"$grid.DefaultCellStyle.SelectionBackColor=[Drawing.Color]::FromArgb(219,235,255);$grid.DefaultCellStyle.SelectionForeColor=[Drawing.Color]::FromArgb(18,49,87)"
"$grid.DefaultCellStyle.Padding=New-Object Windows.Forms.Padding(8,0,8,0);$grid.RowTemplate.Height=36"
"$grid.AlternatingRowsDefaultCellStyle.BackColor=[Drawing.Color]::FromArgb(249,251,254)"
"$table=New-Object Data.DataTable"
"$defs=@(@('id','ID',0),@('group','공종',145),@('name','품명',245),@('spec','규격',260),@('unit','단위',65),@('quantity','산출 수량',105),@('status','연결 상태',105))"
"foreach($d in $defs){[void]$table.Columns.Add($d[0],[string]);$c=New-Object Windows.Forms.DataGridViewTextBoxColumn;$c.Name=$d[0];$c.DataPropertyName=$d[0];$c.HeaderText=$d[1];$c.Width=[Math]::Max(30,$d[2]);$c.SortMode='NotSortable';if($d[0] -eq 'id'){$c.Visible=$false};if($d[0] -eq 'name'){$c.AutoSizeMode='Fill';$c.MinimumWidth=175};if($d[0] -eq 'quantity'){$c.DefaultCellStyle.Alignment='MiddleRight'};[void]$grid.Columns.Add($c)}"
"$grid.DataSource=$table;$layout.Controls.Add($grid,0,3)"
"$details=New-Object Windows.Forms.Label;$details.Dock='Fill';$details.Padding=New-Object Windows.Forms.Padding(10,9,8,5);$details.BackColor=[Drawing.Color]::FromArgb(235,240,247);$details.AutoEllipsis=$true;$details.Text='품목을 선택하면 전체 규격과 연결 정보를 확인할 수 있습니다.';$layout.Controls.Add($details,0,4)"
"$actions=New-Object Windows.Forms.FlowLayoutPanel;$actions.Dock='Fill';$actions.WrapContents=$false;$actions.Padding=New-Object Windows.Forms.Padding(0,7,0,0)"
"function MakeButton($text,$width){$b=New-Object Windows.Forms.Button;$b.Text=$text;$b.Width=$width;$b.Height=40;$b.FlatStyle='Flat';$b.BackColor=[Drawing.Color]::White;$b.Margin=New-Object Windows.Forms.Padding(0,0,10,0);return $b}"
"$add=MakeButton '도면 선택해서 추가' 190;$add.BackColor=[Drawing.Color]::FromArgb(30,94,190);$add.ForeColor=[Drawing.Color]::White"
"$show=MakeButton '도면 위치 보기' 150;$links=MakeButton '연결 관리' 125;$check=MakeButton '누락 후보 검사' 150;$close=MakeButton '닫기' 85"
"$actions.Controls.AddRange(@($add,$show,$links,$check,$close));$layout.Controls.Add($actions,0,5)"
"function UpdateSelection {"
" $has=$null -ne $grid.CurrentRow -and $grid.Rows.Count -gt 0"
" foreach($b in @($add,$show,$links,$check)){$b.Enabled=$has}"
" if(-not $has){$script:selection='';$details.Text='검색 결과가 없습니다. 공종·상태 필터를 바꾸거나 검색어를 지워주세요.';return}"
" $script:selection=[string]$grid.CurrentRow.Cells['id'].Value"
" $r=$records | Where-Object{$_.id -eq $script:selection} | Select-Object -First 1"
" if($r){$details.Text=$r.name+'   ·   '+$r.group+\"`r`n규격: \"+$(if($r.spec){$r.spec}else{'-'})+'   |   단위: '+$r.unit+'   |   연결 '+$r.links+'건'+\"`r`n품목을 더블클릭하면 도면 연결을 시작합니다.\"}"
"}"
"function ApplyFilter {"
" if($script:loading){return}"
" $keep=$script:selection;$term=$search.Text.Trim()"
" $table.Rows.Clear()"
" foreach($r in $records){"
"  if($group.SelectedIndex -gt 0 -and $r.group -ne [string]$group.SelectedItem){continue}"
"  if($status.SelectedIndex -gt 0 -and $r.status -ne [string]$status.SelectedItem){continue}"
"  if($term -and ($r.name+' '+$r.spec+' '+$r.group).IndexOf($term,[StringComparison]::OrdinalIgnoreCase) -lt 0){continue}"
"  $n=$table.NewRow();foreach($d in $defs){$n[$d[0]]=[string]$r.($d[0]);if($d[0] -eq 'quantity' -and $r.status -eq '연결됨'){$n[$d[0]]=([double]::Parse($r.quantity,[Globalization.CultureInfo]::InvariantCulture)).ToString('#,##0.###',[Globalization.CultureInfo]::InvariantCulture)}};$table.Rows.Add($n)"
" }"
" foreach($r in $grid.Rows){$s=[string]$r.Cells['status'].Value;$r.Cells['status'].Style.ForeColor=switch($s){'연결됨'{[Drawing.Color]::FromArgb(26,122,80)} '확인필요'{[Drawing.Color]::FromArgb(188,52,42)} default{[Drawing.Color]::FromArgb(112,121,135)}};if([string]$r.Cells['id'].Value -eq $keep){$grid.CurrentCell=$r.Cells['name']}}"
" $ok=@($records | Where-Object{$_.status -eq '연결됨'}).Count;$bad=@($records | Where-Object{$_.status -eq '확인필요'}).Count"
" $counts.Text='전체 '+$records.Count+'개    연결 '+$ok+'개    미연결 '+($records.Count-$ok-$bad)+'개    확인필요 '+$bad+'개    |    현재 표시 '+$table.Rows.Count+'개'"
" UpdateSelection"
"}"
"function CompleteAction([int]$action){"
" if($action -in @(1,2,3,4) -and -not $script:selection){return}"
" if($script:selection -and $script:selection -notmatch '^R[0-9]+$'){throw '항목 식별자가 잘못되었습니다.'}"
" [IO.File]::WriteAllText($Result,'((action . '+$action+') (id . \"'+$script:selection+'\"))',[Text.Encoding]::ASCII)"
" $form.Close()"
"}"
"$add.Add_Click({CompleteAction 1});$show.Add_Click({CompleteAction 2});$check.Add_Click({CompleteAction 3});$links.Add_Click({CompleteAction 4});$export.Add_Click({CompleteAction 5});$close.Add_Click({CompleteAction 0})"
"$grid.Add_CellDoubleClick({param($sender,$e) if($e.RowIndex -ge 0){CompleteAction 1}})"
"$grid.Add_SelectionChanged({if(-not $script:loading){UpdateSelection}})"
"$group.Add_SelectedIndexChanged({ApplyFilter});$status.Add_SelectedIndexChanged({ApplyFilter});$search.Add_TextChanged({ApplyFilter})"
"$reset.Add_Click({$script:loading=$true;$group.SelectedIndex=0;$status.SelectedIndex=0;$search.Clear();$script:loading=$false;ApplyFilter})"
"$fontSize.Add_SelectedIndexChanged({"
" $size=11+$fontSize.SelectedIndex;$form.Font=New-Object Drawing.Font('맑은 고딕',$size)"
" $grid.ColumnHeadersDefaultCellStyle.Font=New-Object Drawing.Font('맑은 고딕',$size,[Drawing.FontStyle]::Bold)"
" $grid.RowTemplate.Height=36+($size-11)*3;foreach($r in $grid.Rows){$r.Height=$grid.RowTemplate.Height}"
"})"
"$form.CancelButton=$close"
"$form.Add_FormClosing({"
" try{@{group=[string]$group.SelectedItem;status=[string]$status.SelectedItem;search=$search.Text;id=$script:selection;fontSize=$fontSize.SelectedIndex} | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8}catch{}"
" if(-not (Test-Path -LiteralPath $Result)){[IO.File]::WriteAllText($Result,'((action . 0) (id . \"\"))')}"
"})"
"$form.Add_Shown({"
" if($previous){if($previous.fontSize -in @(0,1,2)){$fontSize.SelectedIndex=[int]$previous.fontSize};if($group.Items.Contains([string]$previous.group)){$group.SelectedItem=[string]$previous.group};if($status.Items.Contains([string]$previous.status)){$status.SelectedItem=[string]$previous.status};$search.Text=[string]$previous.search;$script:selection=[string]$previous.id}"
" $script:loading=$false;ApplyFilter"
" if($SmokeTest){"
"  $before=$table.Rows.Count;$search.Text='각재';$filtered=$table.Rows.Count"
"  $status.SelectedItem='미연결';$empty=$table.Rows.Count;$disabled=(-not $add.Enabled)"
"  $reset.PerformClick();$group.SelectedItem='목작업';$groupRows=$table.Rows.Count;$reset.PerformClick()"
"  $bmp=New-Object Drawing.Bitmap($form.Width,$form.Height);$form.DrawToBitmap($bmp,(New-Object Drawing.Rectangle(0,0,$form.Width,$form.Height)));$bmp.Save($Snapshot+'.preview.png');$bmp.Dispose()"
"  @{rows=$before;searchResults=$filtered;emptyResults=$empty;emptyDisablesActions=$disabled;woodRows=$groupRows;columns=$grid.Columns.Count-1;fontSize=$form.Font.Size} | ConvertTo-Json | Set-Content ($Snapshot+'.test.json')"
"  CompleteAction 0"
" }"
"})"
"try{[void]$form.ShowDialog()}finally{$form.Dispose()}"
  ) (write-line line f)) (close f) p)


(defun jl:settings-script (/ p f line)
  (setq p (vl-filename-mktemp "JM_Settings_" nil ".ps1") f (open p "w" "utf8-bom"))
  (foreach line '(
"param([Parameter(Mandatory=$true)][string]$Config,[switch]$SmokeTest)"
"$ErrorActionPreference='Stop'"
"Add-Type -AssemblyName System.Windows.Forms"
"Add-Type -AssemblyName System.Drawing"
"[Windows.Forms.Application]::EnableVisualStyles()"
"$c=Import-Csv -LiteralPath $Config -Encoding Default | Select-Object -First 1"
"if($c.token -notmatch '^[A-Za-z0-9_-]+$'){throw '잘못된 설정 세션입니다.'}"
"$enc=[Text.Encoding]::GetEncoding(949)"
"$script:pending=$false"
"function LispString([string]$s){'\"'+$s.Replace('\\','\\\\').Replace('\"','\\\"').Replace(\"`r\",' ').Replace(\"`n\",' ')+'\"'}"
"$form=New-Object Windows.Forms.Form;$form.Text='내역 산출 설정 · 도면과 함께 보기'"
"$form.Font=New-Object Drawing.Font('맑은 고딕',11);$form.Size=New-Object Drawing.Size(590,640);$form.MinimumSize=$form.Size"
"$form.StartPosition='CenterScreen';$form.TopMost=$true;$form.BackColor=[Drawing.Color]::FromArgb(246,248,251)"
"$layout=New-Object Windows.Forms.TableLayoutPanel;$layout.Dock='Fill';$layout.Padding=New-Object Windows.Forms.Padding(16);$layout.ColumnCount=2;$layout.RowCount=14"
"$layout.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Absolute',215))) | Out-Null"
"$layout.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle('Percent',100))) | Out-Null"
"foreach($h in @(58,39,39,39,39,39,39,39,39,35,52,45,20,20)){$layout.RowStyles.Add((New-Object Windows.Forms.RowStyle('Absolute',$h))) | Out-Null};$form.Controls.Add($layout)"
"$title=New-Object Windows.Forms.Label;$title.Text=$c.title;$title.Dock='Fill';$title.Font=New-Object Drawing.Font('맑은 고딕',12,[Drawing.FontStyle]::Bold);$layout.Controls.Add($title,0,0);$layout.SetColumnSpan($title,2)"
"$modes=@('길이(m)','닫힌 경계 면적(㎡)','벽 길이×높이(㎡)','블록 개수(EA/SET)','수동 수량(식/인 등)','각재 합계(EA)','석고보드(EA)','보강 합판(EA)','벽지(롤)','천장지(롤)','걸레받이(개)','면적→BOX')"
"$fields=@{}"
"function AddField($key,$label,$row,$value,$choices){"
" $l=New-Object Windows.Forms.Label;$l.Text=$label;$l.Dock='Fill';$l.TextAlign='MiddleLeft';$layout.Controls.Add($l,0,$row)"
" if($choices){$x=New-Object Windows.Forms.ComboBox;$x.DropDownStyle='DropDownList';$x.Items.AddRange($choices);$x.SelectedIndex=0;$x.SelectedItem=[string]$value}else{$x=New-Object Windows.Forms.TextBox;$x.Text=[string]$value}"
" $x.Dock='Fill';$x.Margin=New-Object Windows.Forms.Padding(3,4,3,4);$layout.Controls.Add($x,1,$row);$fields[$key]=$x"
"}"
"AddField mode '계산 방식' 1 $modes[[int]$c.mode] $modes"
"AddField label '위치 / 방 / 면 이름' 2 '101-A' $null"
"AddField factor 'CAD 1단위 = 실제 mm' 3 '1' $null"
"AddField height '벽 높이(mm)' 4 '2580' $null"
"AddField stock '각재 주문 길이(mm)' 5 '2700' @('2400','2700','3000','3600')"
"AddField width '보강 합판 띠 폭(mm)' 6 '80' $null"
"AddField pack 'BOX당 면적(㎡)' 7 '' $null"
"AddField manual '수동 수량' 8 '1' $null"
"$top=New-Object Windows.Forms.CheckBox;$top.Text='항상 위에 표시';$top.Checked=$true;$top.AutoSize=$true;$layout.Controls.Add($top,0,9);$layout.SetColumnSpan($top,2);$top.Add_CheckedChanged({$form.TopMost=$top.Checked})"
"$hint=New-Object Windows.Forms.Label;$hint.Text=\"창을 켜둔 채 CAD에서 이동·확대할 수 있습니다.`r`n도면을 찾은 뒤 아래 버튼으로 선택을 시작하세요.\";$hint.Dock='Fill';$hint.ForeColor=[Drawing.Color]::FromArgb(50,76,108);$layout.Controls.Add($hint,0,10);$layout.SetColumnSpan($hint,2)"
"$pick=New-Object Windows.Forms.Button;$pick.Text='설정 적용 후 도면 선택';$pick.Dock='Fill';$pick.BackColor=[Drawing.Color]::FromArgb(30,94,190);$pick.ForeColor=[Drawing.Color]::White;$pick.FlatStyle='Flat';$layout.Controls.Add($pick,0,11);$layout.SetColumnSpan($pick,2)"
"$status=New-Object Windows.Forms.Label;$status.Text='목록은 CAD 명령 JMLIST로 다시 열 수 있습니다.';$status.Dock='Fill';$status.AutoSize=$false;$status.Font=New-Object Drawing.Font('맑은 고딕',9);$layout.Controls.Add($status,0,12);$layout.SetColumnSpan($status,2);$layout.SetRowSpan($status,2)"
"function RefreshFields {"
" $m=$fields.mode.SelectedIndex"
" $fields.height.Enabled=$m -in @(2,5,6,7,8);$fields.stock.Enabled=$m -eq 5;$fields.width.Enabled=$m -eq 7;$fields.pack.Enabled=$m -eq 11;$fields.manual.Enabled=$m -eq 4;$fields.factor.Enabled=$m -ne 4"
" $pick.Text=if($m -eq 4){'수동 수량 저장'}else{'설정 적용 후 도면 선택'}"
"}"
"$fields.mode.Add_SelectedIndexChanged({RefreshFields});RefreshFields"
"function SettingsData {"
" $m=$fields.mode.SelectedIndex;$data=@{mode=$m;label=$fields.label.Text.Trim();stock=[int]$fields.stock.SelectedItem}"
" if(-not $data.label){throw '위치 / 방 / 면 이름을 입력하세요.'}"
" foreach($k in @('factor','height','width','pack','manual')){"
"  $n=0.0;$needed=$fields[$k].Enabled"
"  if(-not [double]::TryParse($fields[$k].Text,[Globalization.NumberStyles]::Float,[Globalization.CultureInfo]::InvariantCulture,[ref]$n) -or [double]::IsNaN($n) -or [double]::IsInfinity($n) -or ($needed -and (($k -ne 'manual' -and $n -le 0) -or ($k -eq 'manual' -and $n -lt 0)))){"
"   if($needed){throw '필요한 치수와 수량을 숫자로 입력하세요.'}"
"   $n=switch($k){'factor'{1}'height'{2580}'width'{80}'pack'{1}'manual'{0}}"
"  }"
"  $data[$k]=$n"
" }"
" if($m -eq 7 -and $data.width -gt 1220){throw '합판 띠 폭은 1220mm 이하여야 합니다.'}"
" $line='((token . '+(LispString $c.token)+') (nonce . '+(LispString ([guid]::NewGuid().ToString('N')))+') (id . '+(LispString $c.id)+') (label . '+(LispString $data.label)+')'"
" foreach($k in @('mode','factor','height','stock','width','pack','manual')){$line+=' ('+$k+' . '+$data[$k].ToString([Globalization.CultureInfo]::InvariantCulture)+')'}"
" $line+')'"
"}"
"# Resolve the exact running DWG first; GetActiveObject alone can choose another CAD process."
"Add-Type -TypeDefinition @\""
"using System;"
"using System.Runtime.InteropServices;"
"using System.Runtime.InteropServices.ComTypes;"
"public static class JMRunningDrawing {"
" [DllImport(\"ole32.dll\")] static extern int GetRunningObjectTable(int reserved,out IRunningObjectTable table);"
" [DllImport(\"ole32.dll\")] static extern int CreateBindCtx(int reserved,out IBindCtx ctx);"
" public static object Find(string path) {"
"  if(String.IsNullOrEmpty(path)) return null;"
"  IRunningObjectTable table; IBindCtx ctx; GetRunningObjectTable(0,out table); CreateBindCtx(0,out ctx);"
"  IEnumMoniker en; table.EnumRunning(out en); IMoniker[] m=new IMoniker[1];"
"  try { while(en.Next(1,m,IntPtr.Zero)==0) {"
"   try { string name; m[0].GetDisplayName(ctx,null,out name);"
"    if(String.Equals(name.TrimStart('!'),path,StringComparison.OrdinalIgnoreCase)) { object value; table.GetObject(m[0],out value); return value; }"
"   } finally { Marshal.ReleaseComObject(m[0]); }"
"  }} finally { Marshal.ReleaseComObject(en); Marshal.ReleaseComObject(ctx); Marshal.ReleaseComObject(table); }"
"  return null;"
" }"
"}"
"\"@"
"function TargetDocument {"
" $direct=[JMRunningDrawing]::Find([string]$c.docfull)"
" if($direct -and [string]$direct.Application.HWND -eq $c.hwnd -and [string]$direct.Name -eq $c.docname -and [string]$direct.FullName -eq $c.docfull){"
"  if(-not $direct.Application.GetAcadState().IsQuiescent){throw 'CAD 명령을 끝낸 뒤 다시 눌러주세요.'}"
"  return $direct"
" }"
" $app=$null"
" foreach($prog in @('AutoCAD.Application','AutoCAD.Application.24.2')){"
"  try{$candidate=[Runtime.InteropServices.Marshal]::GetActiveObject($prog);if([string]$candidate.HWND -eq $c.hwnd){$app=$candidate;break}}catch{}"
" }"
" if(-not $app){throw '연결할 CAD 창을 찾지 못했습니다. 설정을 다시 열어주세요.'}"
" if(-not $app.GetAcadState().IsQuiescent){throw 'CAD 명령을 끝낸 뒤 다시 눌러주세요. 진행 중인 명령은 취소하지 않습니다.'}"
" foreach($d in $app.Documents){if([string]$d.Name -eq $c.docname -and [string]$d.FullName -eq $c.docfull){return $d}}"
" throw '원래 도면이 닫혔거나 이름이 바뀌었습니다. 해당 도면에서 설정을 다시 열어주세요.'"
"}"
"$pick.Add_Click({"
" try{"
"  $data=SettingsData;$doc=TargetDocument"
"  if(Test-Path -LiteralPath ($Config+'.reply')){Remove-Item -LiteralPath ($Config+'.reply')}"
"  [IO.File]::WriteAllText($Config+'.request',$data,$enc)"
"  $script:pending=$true;$pick.Enabled=$false;$status.Text='CAD에서 대상을 선택하세요. 취소하려면 CAD에서 Esc를 누르세요.'"
"  $doc.Activate()"
"  $doc.SendCommand('(jl:pick-request \"'+$c.token+'\")'+[char]13)"
" }catch{"
"  $status.Text=$_.Exception.Message"
"  if($script:pending){$status.Text+=' CAD에서 JMLPICK을 입력하면 같은 요청을 이어갑니다.'}else{$pick.Enabled=$true}"
" }"
"})"
"$timer=New-Object Windows.Forms.Timer;$timer.Interval=500"
"$timer.Add_Tick({"
" if(Test-Path -LiteralPath ($Config+'.closed')){$form.Close();return}"
" if($script:pending -and (Test-Path -LiteralPath ($Config+'.reply'))){"
"  try{$status.Text=[IO.File]::ReadAllText($Config+'.reply',$enc);$script:pending=$false;$pick.Enabled=$true}catch{}"
" }"
"})"
"$form.Add_Shown({$timer.Start();if($SmokeTest){"
" $bitmap=New-Object Drawing.Bitmap($form.Width,$form.Height);$form.DrawToBitmap($bitmap,(New-Object Drawing.Rectangle(0,0,$form.Width,$form.Height)));$bitmap.Save($Config+'.png');$bitmap.Dispose()"
" @{mode=$fields.mode.SelectedIndex;heightEnabled=$fields.height.Enabled;packEnabled=$fields.pack.Enabled;topMost=$form.TopMost} | ConvertTo-Json | Set-Content ($Config+'.test.json')"
" $form.Close()"
"}})"
"$form.Add_FormClosed({$timer.Stop();[IO.File]::WriteAllText($Config+'.closed','closed')})"
"try{[void]$form.ShowDialog()}finally{$timer.Dispose();$form.Dispose()}"
  ) (write-line line f)) (close f) p)

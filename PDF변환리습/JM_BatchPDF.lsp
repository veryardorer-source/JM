;;; JM_BatchPDF.lsp
;;; Batch plot DWG files to individual PDF files.
;;; Command: JM_BATCHPDF

(vl-load-com)

(defun jm:slash (path)
  (if (= (substr path (strlen path) 1) "\\") path (strcat path "\\"))
)

(defun jm:folder-dialog (title / sh folder item path)
  (setq sh (vlax-create-object "Shell.Application"))
  (setq folder (vlax-invoke-method sh 'BrowseForFolder 0 title 0))
  (if folder
    (progn
      (setq item (vlax-get-property folder 'Self))
      (setq path (vlax-get-property item 'Path))
      (vlax-release-object item)
      (vlax-release-object folder)
    )
  )
  (vlax-release-object sh)
  path
)

(defun jm:safe-name (text / bad)
  (setq bad '("\\" "/" ":" "*" "?" "\"" "<" ">" "|"))
  (foreach ch bad (setq text (vl-string-subst "_" ch text)))
  text
)

(defun jm:unique-pdf (folder base / path n)
  (setq path (strcat (jm:slash folder) base ".pdf") n 1)
  (while (findfile path)
    (setq path (strcat (jm:slash folder) base "_" (itoa n) ".pdf") n (1+ n))
  )
  path
)

(defun jm:variant-list (value)
  (cond
    ((= (type value) 'VARIANT) (jm:variant-list (vlax-variant-value value)))
    ((= (type value) 'SAFEARRAY) (vlax-safearray->list value))
    (T value)
  )
)

(defun jm:2d-point (point / array)
  (setq array (vlax-make-safearray vlax-vbDouble '(0 . 1)))
  (vlax-safearray-fill array (list (car point) (cadr point)))
  (vlax-make-variant array)
)

(defun jm:contains-ci (needle text)
  (not (null (vl-string-search (strcase needle) (strcase text))))
)

(defun jm:find-media (lay size landscape / media wanted dims hit name)
  (setq media (jm:variant-list (vla-GetCanonicalMediaNames lay)))
  (setq wanted (strcat "ISO_FULL_BLEED_" size))
  (setq dims
    (cond
      ((= size "A4") (if landscape "297.00_X_210.00" "210.00_X_297.00"))
      ((= size "A3") (if landscape "420.00_X_297.00" "297.00_X_420.00"))
      ((= size "A2") (if landscape "594.00_X_420.00" "420.00_X_594.00"))
      ((= size "A1") (if landscape "841.00_X_594.00" "594.00_X_841.00"))
      ((= size "A0") (if landscape "1189.00_X_841.00" "841.00_X_1189.00"))
    )
  )
  (foreach name media
    (if (and (null hit) (jm:contains-ci wanted name) (jm:contains-ci dims name))
      (setq hit name)
    )
  )
  ;; Some AutoCAD versions omit FULL_BLEED from the canonical name.
  (if (null hit)
    (foreach name media
      (if (and (null hit) (jm:contains-ci (strcat "ISO_" size) name) (jm:contains-ci dims name))
        (setq hit name)
      )
    )
  )
  hit
)

(defun jm:bbox (obj / p1 p2 result)
  (setq result (vl-catch-all-apply 'vla-GetBoundingBox (list obj 'p1 'p2)))
  (if (not (vl-catch-all-error-p result))
    (list (jm:variant-list p1) (jm:variant-list p2))
  )
)

(defun jm:box-center (box)
  (list
    (/ (+ (car (car box)) (car (cadr box))) 2.0)
    (/ (+ (cadr (car box)) (cadr (cadr box))) 2.0)
  )
)

(defun jm:sort-boxes (boxes / tolerance)
  ;; Reading order: upper rows first, then left to right.
  (setq tolerance
    (if boxes
      (* 0.25 (- (cadr (cadr (car boxes))) (cadr (car (car boxes)))))
      0.0
    )
  )
  (vl-sort boxes
    '(lambda (a b / ca cb dy)
      (setq ca (jm:box-center a) cb (jm:box-center b) dy (- (cadr ca) (cadr cb)))
      (if (> (abs dy) tolerance)
        (> (cadr ca) (cadr cb))
        (< (car ca) (car cb))
      )
    )
  )
)

(defun jm:plot-window (doc lay box folder prefix number size / plot ll ur landscape media pdf result)
  (setq ll (car box) ur (cadr box))
  (setq landscape (> (- (car ur) (car ll)) (- (cadr ur) (cadr ll))))
  (vla-put-ConfigName lay "DWG To PDF.pc3")
  (vla-RefreshPlotDeviceInfo lay)
  (setq media (jm:find-media lay size landscape))
  (if media (vla-put-CanonicalMediaName lay media))
  ;; acWindow = 4, acScaleToFit = 0, rotation 0/90 = 0/1.
  (vla-put-PlotType lay 4)
  (vla-SetWindowToPlot lay (jm:2d-point ll) (jm:2d-point ur))
  (vla-put-UseStandardScale lay :vlax-true)
  (vla-put-StandardScale lay 0)
  (vla-put-CenterPlot lay :vlax-true)
  ;; The selected canonical media already has the required orientation.
  (vla-put-PlotRotation lay 0)
  (vla-put-PlotWithPlotStyles lay :vlax-true)
  (setq pdf (jm:unique-pdf folder (strcat prefix "_" (if (< number 10) "0" "") (itoa number))))
  (setq plot (vla-get-Plot doc))
  (vla-put-QuietErrorMode plot :vlax-true)
  ;; ConfigName is already assigned to the layout. Omitting the optional
  ;; PC3 argument here avoids PlotToFile failures seen in some AutoCAD releases.
  (vla-Regen doc 1)
  (setq result (vl-catch-all-apply 'vla-PlotToFile (list plot pdf)))
  (if (or (vl-catch-all-error-p result) (= result :vlax-false))
    (progn (princ (strcat "\n  FAILED: " pdf)) nil)
    (progn (princ (strcat "\n  OK: " pdf)) T)
  )
)

(defun c:JM_SELPDF (/ *error* app doc lay old-bg old-cmdecho out prefix size ss i ent box boxes ok fail)
  (vl-load-com)
  (setq app (vlax-get-acad-object)
        doc (vla-get-ActiveDocument app)
        lay (vla-get-ActiveLayout doc)
        old-bg (getvar "BACKGROUNDPLOT")
        old-cmdecho (getvar "CMDECHO"))
  (defun *error* (msg)
    (setvar "BACKGROUNDPLOT" old-bg)
    (setvar "CMDECHO" old-cmdecho)
    (if (and msg (/= msg "Function cancelled")) (princ (strcat "\nError: " msg)))
    (princ)
  )
  (if (/= (strcase (vla-get-Name lay)) "MODEL")
    (alert "Run JM_SELPDF in the Model tab.")
    (progn
      (princ "\nSelect one border object for each drawing to export.")
      (setq ss (ssget))
      (if ss
        (progn
          (setq out (jm:folder-dialog "Select the folder where PDF files will be saved"))
          (if out
            (progn
              (setq prefix (getstring T (strcat "\nPDF name prefix <" (vl-filename-base (getvar "DWGNAME")) ">: ")))
              (if (= prefix "") (setq prefix (vl-filename-base (getvar "DWGNAME"))))
              (setq prefix (jm:safe-name prefix))
              (initget "A4 A3 A2 A1 A0")
              (setq size (getkword "\nPaper size [A4/A3/A2/A1/A0] <A3>: "))
              (if (null size) (setq size "A3"))
              (setq i 0 boxes nil)
              (repeat (sslength ss)
                (setq ent (vlax-ename->vla-object (ssname ss i)) box (jm:bbox ent))
                (if (and box
                         (> (- (car (cadr box)) (car (car box))) 1e-8)
                         (> (- (cadr (cadr box)) (cadr (car box))) 1e-8))
                  (setq boxes (cons box boxes))
                )
                (setq i (1+ i))
              )
              (setq boxes (jm:sort-boxes boxes) ok 0 fail 0 i 1)
              (setvar "BACKGROUNDPLOT" 0)
              (foreach box boxes
                (if (vl-catch-all-error-p
                      (setq ent (vl-catch-all-apply 'jm:plot-window
                                  (list doc lay box out prefix i size))))
                  (setq fail (1+ fail))
                  (if ent (setq ok (1+ ok)) (setq fail (1+ fail)))
                )
                (setq i (1+ i))
              )
              (setvar "BACKGROUNDPLOT" old-bg)
              (alert (strcat "Selected drawing PDF export complete.\n\nCreated: " (itoa ok)
                             "\nFailed: " (itoa fail) "\n\nOutput folder:\n" out))
            )
          )
        )
        (princ "\nNothing selected.")
      )
    )
  )
  (princ)
)

(defun jm:layout-list (doc mode / result lay name)
  (vlax-for lay (vla-get-Layouts doc)
    (setq name (vla-get-Name lay))
    (if
      (or
        (and (= mode "Model") (= (strcase name) "MODEL"))
        (and (= mode "Layout") (/= (strcase name) "MODEL"))
        (= mode "All")
      )
      (setq result (cons lay result))
    )
  )
  (vl-sort result '(lambda (a b) (< (vla-get-TabOrder a) (vla-get-TabOrder b))))
)

(defun jm:configure-layout (lay / is-model)
  (setq is-model (= (strcase (vla-get-Name lay)) "MODEL"))
  (vla-put-ConfigName lay "DWG To PDF.pc3")
  (vla-RefreshPlotDeviceInfo lay)
  (vla-put-PlotWithPlotStyles lay :vlax-true)
  (vla-put-UseStandardScale lay :vlax-true)
  (if is-model
    (progn
      ;; acExtents = 1, acScaleToFit = 0
      (vla-put-PlotType lay 1)
      (vla-put-StandardScale lay 0)
      (vla-put-CenterPlot lay :vlax-true)
    )
    (progn
      ;; acLayout = 5, ac1_1 = 1
      (vla-put-PlotType lay 5)
      (vla-put-StandardScale lay 1)
      (vla-put-CenterPlot lay :vlax-false)
    )
  )
)

(defun jm:plot-one (doc lay out-folder multi-layout / plot dwg-base lay-name pdf result)
  (vla-put-ActiveLayout doc lay)
  (jm:configure-layout lay)
  (setq plot (vla-get-Plot doc))
  (vla-put-QuietErrorMode plot :vlax-true)
  (setq dwg-base (vl-filename-base (vla-get-Name doc)))
  (setq lay-name (jm:safe-name (vla-get-Name lay)))
  (setq pdf
    (jm:unique-pdf
      out-folder
      (if multi-layout (strcat dwg-base "_" lay-name) dwg-base)
    )
  )
  (setq result (vl-catch-all-apply 'vla-PlotToFile (list plot pdf "DWG To PDF.pc3")))
  (if (or (vl-catch-all-error-p result) (= result :vlax-false))
    (progn
      (princ (strcat "\n  FAILED: " pdf))
      nil
    )
    (progn
      (princ (strcat "\n  OK: " pdf))
      T
    )
  )
)

(defun jm:process-dwg (app fullpath out-folder mode / docs doc opened-here lays multi ok fail err)
  (setq docs (vla-get-Documents app) opened-here T)
  (setq err (vl-catch-all-apply 'vla-Open (list docs fullpath :vlax-true)))
  (if (vl-catch-all-error-p err)
    (progn (princ (strcat "\nOPEN FAILED: " fullpath)) (list 0 1))
    (progn
      (setq doc err)
      (vla-Activate doc)
      (setq lays (jm:layout-list doc mode))
      (setq multi (> (length lays) 1) ok 0 fail 0)
      (if lays
        (foreach lay lays
          (if (vl-catch-all-error-p
                (setq err (vl-catch-all-apply 'jm:plot-one (list doc lay out-folder multi))))
            (progn (setq fail (1+ fail)) (princ "\n  FAILED: plot setup error"))
            (if err (setq ok (1+ ok)) (setq fail (1+ fail)))
          )
        )
        (progn (setq fail (1+ fail)) (princ "\n  SKIPPED: no matching layout"))
      )
      (vl-catch-all-apply 'vla-Close (list doc :vlax-false))
      (list ok fail)
    )
  )
)

(defun c:JM_BATCHPDF (/ *error* app old-bg src out choice mode files total-ok total-fail r)
  (vl-load-com)
  (setq app (vlax-get-acad-object) old-bg (getvar "BACKGROUNDPLOT"))
  (defun *error* (msg)
    (setvar "BACKGROUNDPLOT" old-bg)
    (if (and msg (/= msg "Function cancelled")) (princ (strcat "\nError: " msg)))
    (princ)
  )
  (setq src (jm:folder-dialog "Select the folder containing DWG files"))
  (if src
    (progn
      (setq out (jm:folder-dialog "Select the folder where PDF files will be saved"))
      (if out
        (progn
          (initget "Model Layout All")
          (setq choice (getkword "\nPlot [Model/Layout/All] <Layout>: "))
          (setq mode (if choice choice "Layout"))
          (setq files (vl-directory-files src "*.dwg" 1))
          (if files
            (progn
              (setvar "BACKGROUNDPLOT" 0)
              (setq total-ok 0 total-fail 0)
              (foreach file files
                (princ (strcat "\nProcessing: " file))
                (setq r (jm:process-dwg app (strcat (jm:slash src) file) out mode))
                (setq total-ok (+ total-ok (car r)) total-fail (+ total-fail (cadr r)))
              )
              (setvar "BACKGROUNDPLOT" old-bg)
              (alert
                (strcat "Batch PDF complete.\n\nCreated: " (itoa total-ok)
                        "\nFailed/Skipped: " (itoa total-fail)
                        "\n\nOutput folder:\n" out)
              )
            )
            (alert "No DWG files were found in the selected folder.")
          )
        )
      )
    )
  )
  (princ)
)

(defun jm:ordered-box (p1 p2)
  (list
    (list (min (car p1) (car p2)) (min (cadr p1) (cadr p2)))
    (list (max (car p1) (car p2)) (max (cadr p1) (cadr p2)))
  )
)

(defun jm:must (stage function arguments / value)
  (setq value (vl-catch-all-apply function arguments))
  (if (vl-catch-all-error-p value)
    (progn
      (setq jm:last-plot-error
        (strcat stage " - "
          (if (vl-catch-all-error-message value)
            (vl-catch-all-error-message value)
            "Unknown automation error"
          )
        )
      )
      ;; Raise a harmless caught error; the readable detail is kept above.
      (car 1)
    )
  )
  value
)

;;; Diagnostic/compatibility replacement for the window plotter. Defined
;;; later than the original so this version is used by JM_SELPDF.
(defun jm:plot-window (doc lay box folder prefix number size / plot ll ur landscape media pdf result)
  (setq ll (car box) ur (cadr box))
  (setq landscape (> (- (car ur) (car ll)) (- (cadr ur) (cadr ll))))
  (jm:must "PDF printer" 'vla-put-ConfigName (list lay "DWG To PDF.pc3"))
  (jm:must "Refresh printer" 'vla-RefreshPlotDeviceInfo (list lay))
  (setq media (jm:must "Read paper list" 'jm:find-media (list lay size landscape)))
  (if media
    (jm:must "Paper size" 'vla-put-CanonicalMediaName (list lay media))
  )
  ;; Some AutoCAD releases require the window coordinates to be registered
  ;; before PlotType can be changed to acWindow.
  (jm:must "Plot window" 'vla-SetWindowToPlot
           (list lay (jm:2d-point ll) (jm:2d-point ur)))
  (jm:must "Plot area type" 'vla-put-PlotType (list lay 4))
  (jm:must "Use standard scale" 'vla-put-UseStandardScale (list lay :vlax-true))
  (jm:must "Fit to paper" 'vla-put-StandardScale (list lay 0))
  (jm:must "Center plot" 'vla-put-CenterPlot (list lay :vlax-true))
  (jm:must "Paper rotation" 'vla-put-PlotRotation (list lay 0))
  (jm:must "Plot style" 'vla-put-PlotWithPlotStyles (list lay :vlax-true))
  (setq pdf (jm:unique-pdf folder
              (strcat prefix "_" (if (< number 10) "0" "") (itoa number))))
  (setq plot (vla-get-Plot doc))
  (jm:must "Quiet plot mode" 'vla-put-QuietErrorMode (list plot :vlax-true))
  (jm:must "Regenerate drawing" 'vla-Regen (list doc 1))
  ;; Try the standard two-argument ActiveX form first. Some releases require
  ;; the explicit PC3 argument, so retry that form if necessary.
  (setq result (vl-catch-all-apply 'vla-PlotToFile (list plot pdf)))
  (if (vl-catch-all-error-p result)
    (setq result (vl-catch-all-apply 'vla-PlotToFile
                   (list plot pdf "DWG To PDF.pc3")))
  )
  (if (vl-catch-all-error-p result)
    (progn
      (setq jm:last-plot-error
        (strcat "Create PDF - "
          (if (vl-catch-all-error-message result)
            (vl-catch-all-error-message result)
            "Unknown automation error"
          )
        )
      )
      (car 1)
    )
  )
  (if (= result :vlax-false)
    (progn (princ (strcat "\n  FAILED: " pdf)) nil)
    (progn (princ (strcat "\n  OK: " pdf)) T)
  )
)

;;; Revised interactive command.
;;; Each PDF window is explicitly picked with two corners. This prevents a
;;; crossing selection from accidentally creating one PDF per selected entity.
(defun c:JM_SELPDF (/ *error* app doc lay old-bg out prefix size p1 p2 d1 d2 boxes box count ok fail result errors errmsg)
  (vl-load-com)
  (setq app (vlax-get-acad-object)
        doc (vla-get-ActiveDocument app)
        lay (vla-get-ActiveLayout doc)
        old-bg (getvar "BACKGROUNDPLOT"))
  (defun *error* (msg)
    (setvar "BACKGROUNDPLOT" old-bg)
    (if (and msg (/= msg "Function cancelled")) (princ (strcat "\nError: " msg)))
    (princ)
  )
  (if (/= (strcase (vla-get-Name lay)) "MODEL")
    (alert "Run JM_SELPDF in the Model tab.")
    (progn
      (setq out (jm:folder-dialog "Select the folder where PDF files will be saved"))
      (if out
        (progn
          (setq prefix (getstring T (strcat "\nPDF name prefix <" (vl-filename-base (getvar "DWGNAME")) ">: ")))
          (if (= prefix "") (setq prefix (vl-filename-base (getvar "DWGNAME"))))
          (setq prefix (jm:safe-name prefix))
          (initget "A4 A3 A2 A1 A0")
          (setq size (getkword "\nPaper size [A4/A3/A2/A1/A0] <A3>: "))
          (if (null size) (setq size "A3"))
          (setq boxes nil count 1)
          (princ "\nPick two opposite corners of each drawing. Press Enter when finished.")
          (while (setq p1 (getpoint (strcat "\nDrawing " (itoa count) " - first corner <finish>: ")))
            (setq p2 (getcorner p1 (strcat "\nDrawing " (itoa count) " - opposite corner: ")))
            (if p2
              (progn
                ;; getpoint returns UCS coordinates; SetWindowToPlot requires DCS.
                (setq d1 (trans p1 1 2) d2 (trans p2 1 2))
                (setq boxes (append boxes (list (jm:ordered-box d1 d2))))
                (setq count (1+ count))
              )
            )
          )
          (if boxes
            (progn
              (setvar "BACKGROUNDPLOT" 0)
              (setq count 1 ok 0 fail 0 errors nil)
              (foreach box boxes
                (setq jm:last-plot-error nil)
                (setq result
                  (vl-catch-all-apply 'jm:plot-window
                    (list doc lay box out prefix count size)))
                (if (and (not (vl-catch-all-error-p result)) result)
                  (setq ok (1+ ok))
                  (progn
                    (setq fail (1+ fail))
                    (setq errmsg
                      (cond
                        (jm:last-plot-error jm:last-plot-error)
                        ((vl-catch-all-error-p result)
                          (if (vl-catch-all-error-message result)
                            (vl-catch-all-error-message result)
                            "Unknown error"))
                        (T "PlotToFile returned failure")
                      )
                    )
                    (setq errors (cons (strcat "#" (itoa count) ": " errmsg) errors))
                    (princ (strcat "\n  ERROR #" (itoa count) ": " errmsg))
                  )
                )
                (setq count (1+ count))
              )
              (setvar "BACKGROUNDPLOT" old-bg)
              (alert
                (strcat "PDF export complete.\n\nSelected windows: " (itoa (length boxes))
                        "\nCreated: " (itoa ok) "\nFailed: " (itoa fail)
                        (if errors
                          (strcat "\n\nFirst error:\n" (car (reverse errors)))
                          ""
                        )
                        "\n\nOutput folder:\n" out)
              )
            )
            (princ "\nNo drawing windows were specified.")
          )
        )
      )
    )
  )
  (princ)
)

(princ "\nJM_BatchPDF loaded. Commands: JM_SELPDF, JM_BATCHPDF")
(princ)


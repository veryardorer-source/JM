const ExcelJS = require('./app/node_modules/exceljs')

async function create() {
  const wb = new ExcelJS.Workbook()
  const MAX = 300

  // 공통 헤더 스타일
  function setHeader(cell, text, bgHex, fgHex = 'FFFFFF') {
    cell.value = text
    cell.font = { bold: true, size: 11, color: { argb: 'FF' + fgHex } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgHex } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left:   { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right:  { style: 'thin', color: { argb: 'FFCCCCCC' } },
    }
  }

  function setData(cell, even) {
    if (even) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
    cell.alignment = { vertical: 'middle', wrapText: false }
    cell.border = {
      top:    { style: 'hair', color: { argb: 'FFE0E0E0' } },
      bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } },
      left:   { style: 'hair', color: { argb: 'FFE0E0E0' } },
      right:  { style: 'hair', color: { argb: 'FFE0E0E0' } },
    }
  }

  function addDropdown(ws, col, from, to, formula) {
    for (let r = from; r <= to; r++) {
      ws.getCell(`${col}${r}`).dataValidation = {
        type: 'list', allowBlank: true,
        formulae: [formula],
        showErrorMessage: true, errorStyle: 'warning',
        error: '목록에서 선택하세요.',
      }
    }
  }

  // ══════════════════════════════════════════════════════
  // 목록 시트 (숨김) — 드롭다운 원본값
  // ══════════════════════════════════════════════════════
  const wsMeta = wb.addWorksheet('_목록')
  const lists = [
    ['현장유형',   ['시공의뢰','디자인의뢰']],
    ['현장상태',   ['진행중','완료','대기','보류']],
    ['단계',       ['O','X']],
    ['우선순위',   ['높음','보통','낮음']],
    ['할일상태',   ['대기','진행중','완료']],
    ['수금구분',   ['계약금','중도금','잔금','기타']],
    ['수금여부',   ['미수금','완료']],
    ['반복유형',   ['매일','매주','매월']],
    ['반복요일',   ['월','화','수','목','금','토','일','월·수','화·목','화·금','월·수·금']],
    ['활성여부',   ['활성','비활성']],
    ['완료여부',   ['미완료','완료']],
  ]
  lists.forEach(([title, values], ci) => {
    const col = String.fromCharCode(65 + ci)
    wsMeta.getCell(`${col}1`).value = title
    wsMeta.getCell(`${col}1`).font = { bold: true }
    values.forEach((v, ri) => { wsMeta.getCell(`${col}${ri + 2}`).value = v })
  })
  wsMeta.state = 'veryHidden'

  // ══════════════════════════════════════════════════════
  // 시트1: 대시보드
  // ══════════════════════════════════════════════════════
  const wsD = wb.addWorksheet('대시보드', { tabColor: { argb: 'FF1F2937' } })
  wsD.views = [{ showGridLines: false }]
  wsD.getColumn('A').width = 2
  wsD.getColumn('B').width = 20
  wsD.getColumn('C').width = 28
  wsD.getColumn('D').width = 16
  wsD.getColumn('E').width = 12
  wsD.getColumn('F').width = 12
  wsD.getColumn('G').width = 2

  // 타이틀
  wsD.mergeCells('B1:F2')
  const t = wsD.getCell('B1')
  t.value = 'JM 업무관리'
  t.font = { bold: true, size: 20, color: { argb: 'FFFFFFFF' } }
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
  t.alignment = { vertical: 'middle', horizontal: 'center' }
  wsD.getRow(1).height = 22
  wsD.getRow(2).height = 22

  // 날짜
  wsD.mergeCells('B3:F3')
  const dt = wsD.getCell('B3')
  dt.value = { formula: 'TEXT(TODAY(),"YYYY년 MM월 DD일 (AAA요일)")' }
  dt.font = { size: 11, color: { argb: 'FF888888' } }
  dt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
  dt.alignment = { vertical: 'middle', horizontal: 'center' }
  wsD.getRow(3).height = 20

  wsD.getRow(4).height = 10

  // 요약 카드
  const cardData = [
    ['B', '진행중 현장', `COUNTIF(현장!F2:F${MAX},"진행중")`, '2E75B6'],
    ['D', '미완료 할일', `COUNTIFS(할일!A2:A${MAX},"<>",할일!E2:E${MAX},"<>완료")`, '375623'],
    ['F', '기한 초과',   `COUNTIFS(할일!C2:C${MAX},"<"&TEXT(TODAY(),"YYYY-MM-DD"),할일!E2:E${MAX},"<>완료",할일!A2:A${MAX},"<>")`, 'C42B1C'],
  ]
  cardData.forEach(([col, label, formula, bg]) => {
    wsD.mergeCells(`${col}5:${col}6`)
    const lc = wsD.getCell(`${col}5`)
    lc.value = label
    lc.font = { size: 9, color: { argb: 'FFDDDDDD' } }
    lc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } }
    lc.alignment = { horizontal: 'center', vertical: 'bottom' }

    wsD.mergeCells(`${col}7:${col}8`)
    const vc = wsD.getCell(`${col}7`)
    vc.value = { formula }
    vc.font = { bold: true, size: 22, color: { argb: 'FFFFFFFF' } }
    vc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } }
    vc.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  wsD.getRow(5).height = 14
  wsD.getRow(6).height = 14
  wsD.getRow(7).height = 24
  wsD.getRow(8).height = 20

  wsD.getRow(9).height = 8

  // 수금 요약
  const payCards = [
    ['B', '총 계약금액', `SUM(수금!C2:C${MAX})`, '595959'],
    ['D', '수금 완료',   `SUMIF(수금!F2:F${MAX},"완료",수금!C2:C${MAX})`, '375623'],
    ['F', '미 수 금',    `SUMIF(수금!F2:F${MAX},"미수금",수금!C2:C${MAX})`, 'C42B1C'],
  ]
  payCards.forEach(([col, label, formula, bg]) => {
    const lc = wsD.getCell(`${col}10`)
    lc.value = label
    lc.font = { size: 9, color: { argb: 'FFDDDDDD' } }
    lc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } }
    lc.alignment = { horizontal: 'center', vertical: 'middle' }

    const vc = wsD.getCell(`${col}11`)
    vc.value = { formula }
    vc.numFmt = '#,##0"원"'
    vc.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
    vc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } }
    vc.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  wsD.getRow(10).height = 16
  wsD.getRow(11).height = 22
  wsD.getRow(12).height = 10

  // 섹션 헬퍼
  let row = 13
  function section(title, bg) {
    wsD.mergeCells(`B${row}:F${row}`)
    const c = wsD.getCell(`B${row}`)
    c.value = title
    c.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } }
    c.alignment = { vertical: 'middle', horizontal: 'left' }
    wsD.getRow(row).height = 24
    row++
  }
  function colHeaders(labels, bg) {
    const cols = ['B','C','D','E','F']
    labels.forEach((lbl, i) => {
      const c = wsD.getCell(`${cols[i]}${row}`)
      c.value = lbl
      c.font = { bold: true, size: 9, color: { argb: 'FF333333' } }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } }
      c.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    wsD.getRow(row).height = 18
    row++
  }
  function filterRow(formulas, fillHex) {
    const cols = ['B','C','D','E','F']
    formulas.forEach((f, i) => {
      const c = wsD.getCell(`${cols[i]}${row}`)
      c.value = f ? { formula: f } : ''
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + fillHex } }
      c.alignment = { vertical: 'middle', wrapText: false }
      wsD.getRow(row).height = 20
    })
    row++
  }

  // 오늘 할일
  section('  ✅  오늘 할일', '375623')
  colHeaders(['제목','현장명','마감일','우선순위','상태'], 'E2EFDA')
  filterRow([
    null,
    `IFERROR(FILTER(할일!A2:A${MAX},(할일!C2:C${MAX}=TEXT(TODAY(),"YYYY-MM-DD"))*(할일!E2:E${MAX}<>"완료")*(할일!A2:A${MAX}<>"")),"오늘 마감 할일 없음")`,
    `IFERROR(FILTER(할일!B2:B${MAX},(할일!C2:C${MAX}=TEXT(TODAY(),"YYYY-MM-DD"))*(할일!E2:E${MAX}<>"완료")*(할일!A2:A${MAX}<>"")),"")`,
    `IFERROR(FILTER(할일!C2:C${MAX},(할일!C2:C${MAX}=TEXT(TODAY(),"YYYY-MM-DD"))*(할일!E2:E${MAX}<>"완료")*(할일!A2:A${MAX}<>"")),"")`,
    `IFERROR(FILTER(할일!D2:D${MAX},(할일!C2:C${MAX}=TEXT(TODAY(),"YYYY-MM-DD"))*(할일!E2:E${MAX}<>"완료")*(할일!A2:A${MAX}<>"")),"")`,
  ], 'F1FFF4')
  wsD.getRow(row).height = 10; row++

  // 마감 임박
  section('  ⚠  마감 임박 (7일 이내)', 'C55A11')
  colHeaders(['제목','현장명','마감일','우선순위','상태'], 'FCE4D6')
  filterRow([
    null,
    `IFERROR(FILTER(할일!A2:A${MAX},(할일!C2:C${MAX}>TEXT(TODAY(),"YYYY-MM-DD"))*(할일!C2:C${MAX}<=TEXT(TODAY()+7,"YYYY-MM-DD"))*(할일!E2:E${MAX}<>"완료")*(할일!A2:A${MAX}<>"")),"마감 임박 할일 없음")`,
    `IFERROR(FILTER(할일!B2:B${MAX},(할일!C2:C${MAX}>TEXT(TODAY(),"YYYY-MM-DD"))*(할일!C2:C${MAX}<=TEXT(TODAY()+7,"YYYY-MM-DD"))*(할일!E2:E${MAX}<>"완료")*(할일!A2:A${MAX}<>"")),"")`,
    `IFERROR(FILTER(할일!C2:C${MAX},(할일!C2:C${MAX}>TEXT(TODAY(),"YYYY-MM-DD"))*(할일!C2:C${MAX}<=TEXT(TODAY()+7,"YYYY-MM-DD"))*(할일!E2:E${MAX}<>"완료")*(할일!A2:A${MAX}<>"")),"")`,
    `IFERROR(FILTER(할일!D2:D${MAX},(할일!C2:C${MAX}>TEXT(TODAY(),"YYYY-MM-DD"))*(할일!C2:C${MAX}<=TEXT(TODAY()+7,"YYYY-MM-DD"))*(할일!E2:E${MAX}<>"완료")*(할일!A2:A${MAX}<>"")),"")`,
  ], 'FFF8F0')
  wsD.getRow(row).height = 10; row++

  // 진행중 현장
  section('  🏗  진행중 현장', '2E75B6')
  colHeaders(['현장명','의뢰인','시작일','마감일','상태'], 'DDEEFF')
  filterRow([
    null,
    `IFERROR(FILTER(현장!A2:A${MAX},현장!F2:F${MAX}="진행중"),"진행중 현장 없음")`,
    `IFERROR(FILTER(현장!B2:B${MAX},현장!F2:F${MAX}="진행중"),"")`,
    `IFERROR(FILTER(현장!D2:D${MAX},현장!F2:F${MAX}="진행중"),"")`,
    `IFERROR(FILTER(현장!E2:E${MAX},현장!F2:F${MAX}="진행중"),"")`,
  ], 'F0F7FF')
  wsD.getRow(row).height = 10; row++

  // 미수금
  section('  💳  미수금 현황', '7030A0')
  colHeaders(['현장명','구분','금액','마감일','수금여부'], 'EAE6F0')
  filterRow([
    null,
    `IFERROR(FILTER(수금!A2:A${MAX},수금!F2:F${MAX}="미수금"),"미수금 없음")`,
    `IFERROR(FILTER(수금!B2:B${MAX},수금!F2:F${MAX}="미수금"),"")`,
    `IFERROR(FILTER(수금!C2:C${MAX},수금!F2:F${MAX}="미수금"),"")`,
    `IFERROR(FILTER(수금!D2:D${MAX},수금!F2:F${MAX}="미수금"),"")`,
  ], 'F9F0FF')

  // ══════════════════════════════════════════════════════
  // 시트2: 현장
  // ══════════════════════════════════════════════════════
  const wsP = wb.addWorksheet('현장', { tabColor: { argb: 'FF2E75B6' } })
  wsP.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }]
  wsP.columns = [
    { width: 26 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 10 }, { width: 8  }, { width: 8  }, { width: 9  }, { width: 8  },
    { width: 8  }, { width: 10 }, { width: 32 },
  ]
  const pHdrs = ['현장명','의뢰인','유형','시작일','마감일','상태','디자인','견적','작업도면','시공','마감','진행률','메모']
  pHdrs.forEach((h, i) => setHeader(wsP.getCell(`${String.fromCharCode(65+i)}1`), h, '2E75B6'))
  wsP.getRow(1).height = 26
  wsP.autoFilter = { from: 'A1', to: 'M1' }

  for (let r = 2; r <= MAX; r++) {
    const even = r % 2 === 0
    for (let c = 0; c < 13; c++) setData(wsP.getCell(`${String.fromCharCode(65+c)}${r}`), even)
    wsP.getCell(`D${r}`).numFmt = 'YYYY-MM-DD'
    wsP.getCell(`E${r}`).numFmt = 'YYYY-MM-DD'
    const pct = wsP.getCell(`L${r}`)
    pct.value = { formula: `IF(COUNTA(A${r})=0,"",COUNTIF(G${r}:K${r},"O")&"/5")` }
    pct.alignment = { horizontal: 'center', vertical: 'middle' }
  }

  addDropdown(wsP, 'C', 2, MAX, '_목록!$A$2:$A$3')
  addDropdown(wsP, 'F', 2, MAX, '_목록!$B$2:$B$5')
  ;['G','H','I','J','K'].forEach(col => addDropdown(wsP, col, 2, MAX, '_목록!$C$2:$C$3'))

  wsP.addConditionalFormatting({ ref: `F2:F${MAX}`, rules: [
    { type: 'containsText', operator: 'containsText', text: '완료',   style: { fill: { type:'pattern', pattern:'solid', bgColor:{argb:'FFE2EFDA'} }, font:{color:{argb:'FF375623'}} } },
    { type: 'containsText', operator: 'containsText', text: '진행중', style: { fill: { type:'pattern', pattern:'solid', bgColor:{argb:'FFDDEEFF'} }, font:{color:{argb:'FF2E75B6'}, bold:true} } },
    { type: 'containsText', operator: 'containsText', text: '보류',   style: { fill: { type:'pattern', pattern:'solid', bgColor:{argb:'FFFFE0CC'} }, font:{color:{argb:'FFC55A11'}} } },
  ]})
  wsP.addConditionalFormatting({ ref: `G2:K${MAX}`, rules: [
    { type: 'containsText', operator: 'containsText', text: 'O', style: { font:{color:{argb:'FF107C10'}, bold:true} } },
    { type: 'containsText', operator: 'containsText', text: 'X', style: { font:{color:{argb:'FFAAAAAA'}} } },
  ]})
  wsP.addConditionalFormatting({ ref: `A2:M${MAX}`, rules: [{
    type: 'expression',
    formulae: [`AND($E2<>"",$E2<TEXT(TODAY(),"YYYY-MM-DD"),$F2<>"완료",$A2<>"")`],
    style: { fill: { type:'pattern', pattern:'solid', bgColor:{argb:'FFFFF0F0'} } },
  }]})

  // ══════════════════════════════════════════════════════
  // 시트3: 할일
  // ══════════════════════════════════════════════════════
  const wsT = wb.addWorksheet('할일', { tabColor: { argb: 'FF375623' } })
  wsT.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }]
  wsT.columns = [
    { width: 34 }, { width: 22 }, { width: 12 }, { width: 10 },
    { width: 10 }, { width: 12 }, { width: 28 },
  ]
  const tHdrs = ['제목','현장명','마감일','우선순위','상태','완료일','메모']
  tHdrs.forEach((h, i) => setHeader(wsT.getCell(`${String.fromCharCode(65+i)}1`), h, '375623'))
  wsT.getRow(1).height = 26
  wsT.autoFilter = { from: 'A1', to: 'G1' }

  for (let r = 2; r <= MAX; r++) {
    const even = r % 2 === 0
    for (let c = 0; c < 7; c++) setData(wsT.getCell(`${String.fromCharCode(65+c)}${r}`), even)
    wsT.getCell(`C${r}`).numFmt = 'YYYY-MM-DD'
    wsT.getCell(`F${r}`).numFmt = 'YYYY-MM-DD'
  }

  addDropdown(wsT, 'B', 2, MAX, '현장!$A$2:$A$100')
  addDropdown(wsT, 'D', 2, MAX, '_목록!$D$2:$D$4')
  addDropdown(wsT, 'E', 2, MAX, '_목록!$E$2:$E$4')

  wsT.addConditionalFormatting({ ref: `E2:E${MAX}`, rules: [
    { type: 'containsText', operator: 'containsText', text: '완료',   style: { fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFE2EFDA'}}, font:{color:{argb:'FF375623'}} } },
    { type: 'containsText', operator: 'containsText', text: '진행중', style: { fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFDDEEFF'}}, font:{color:{argb:'FF2E75B6'},bold:true} } },
  ]})
  wsT.addConditionalFormatting({ ref: `D2:D${MAX}`, rules: [
    { type: 'containsText', operator: 'containsText', text: '높음', style: { font:{color:{argb:'FFC42B1C'},bold:true} } },
  ]})
  wsT.addConditionalFormatting({ ref: `A2:G${MAX}`, rules: [
    { type: 'expression', formulae: [`AND($C2<>"",$C2<TEXT(TODAY(),"YYYY-MM-DD"),$E2<>"완료",$A2<>"")`], style: { fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFFFF0F0'}} } },
    { type: 'expression', formulae: [`AND($C2=TEXT(TODAY(),"YYYY-MM-DD"),$E2<>"완료",$A2<>"")`],        style: { fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFFFFF99'}} } },
    { type: 'expression', formulae: [`$E2="완료"`], style: { font:{strike:true,color:{argb:'FFAAAAAA'}} } },
  ]})

  // ══════════════════════════════════════════════════════
  // 시트4: 수금
  // ══════════════════════════════════════════════════════
  const wsPay = wb.addWorksheet('수금', { tabColor: { argb: 'FF7030A0' } })
  wsPay.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }]
  wsPay.columns = [
    { width: 24 }, { width: 10 }, { width: 16 }, { width: 12 },
    { width: 12 }, { width: 10 }, { width: 24 },
  ]
  const payHdrs = ['현장명','구분','금액','마감일','수금일','수금여부','비고']
  payHdrs.forEach((h, i) => setHeader(wsPay.getCell(`${String.fromCharCode(65+i)}1`), h, '7030A0'))
  wsPay.getRow(1).height = 26
  wsPay.autoFilter = { from: 'A1', to: 'G1' }

  for (let r = 2; r <= MAX; r++) {
    const even = r % 2 === 0
    for (let c = 0; c < 7; c++) setData(wsPay.getCell(`${String.fromCharCode(65+c)}${r}`), even)
    wsPay.getCell(`C${r}`).numFmt = '#,##0'
    wsPay.getCell(`C${r}`).alignment = { horizontal: 'right', vertical: 'middle' }
    wsPay.getCell(`D${r}`).numFmt = 'YYYY-MM-DD'
    wsPay.getCell(`E${r}`).numFmt = 'YYYY-MM-DD'
  }

  // 합계 행
  const sr = MAX + 1
  ;['A','B','C','D','E','F','G'].forEach(col => {
    wsPay.getCell(`${col}${sr}`).fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF7030A0'} }
    wsPay.getCell(`${col}${sr}`).font = { bold:true, color:{argb:'FFFFFFFF'} }
    wsPay.getCell(`${col}${sr}`).alignment = { horizontal:'center', vertical:'middle' }
  })
  wsPay.getCell(`A${sr}`).value = '합계'
  wsPay.getCell(`C${sr}`).value = { formula: `SUM(C2:C${MAX})` }
  wsPay.getCell(`C${sr}`).numFmt = '#,##0"원"'
  wsPay.getCell(`C${sr}`).alignment = { horizontal:'right', vertical:'middle' }
  wsPay.getCell(`D${sr}`).value = { formula: `SUMIF(F2:F${MAX},"완료",C2:C${MAX})` }
  wsPay.getCell(`D${sr}`).numFmt = '#,##0"원 수금"'
  wsPay.getCell(`D${sr}`).fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF375623'} }
  wsPay.getCell(`D${sr}`).alignment = { horizontal:'right', vertical:'middle' }
  wsPay.getCell(`E${sr}`).value = { formula: `SUMIF(F2:F${MAX},"미수금",C2:C${MAX})` }
  wsPay.getCell(`E${sr}`).numFmt = '#,##0"원 미수금"'
  wsPay.getCell(`E${sr}`).fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFC42B1C'} }
  wsPay.getCell(`E${sr}`).alignment = { horizontal:'right', vertical:'middle' }
  wsPay.getRow(sr).height = 24

  addDropdown(wsPay, 'A', 2, MAX, '현장!$A$2:$A$100')
  addDropdown(wsPay, 'B', 2, MAX, '_목록!$F$2:$F$5')
  addDropdown(wsPay, 'F', 2, MAX, '_목록!$G$2:$G$3')

  wsPay.addConditionalFormatting({ ref: `F2:F${MAX}`, rules: [
    { type: 'containsText', operator: 'containsText', text: '완료',   style: { fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFE2EFDA'}}, font:{color:{argb:'FF375623'},bold:true} } },
    { type: 'containsText', operator: 'containsText', text: '미수금', style: { fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFFFF0F0'}}, font:{color:{argb:'FFC42B1C'},bold:true} } },
  ]})

  // ══════════════════════════════════════════════════════
  // 시트5: 반복업무
  // ══════════════════════════════════════════════════════
  const wsR = wb.addWorksheet('반복업무', { tabColor: { argb: 'FFC55A11' } })
  wsR.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }]
  wsR.columns = [
    { width: 30 }, { width: 10 }, { width: 18 }, { width: 10 },
    { width: 10 }, { width: 12 }, { width: 26 },
  ]
  const rHdrs = ['업무명','반복유형','요일/날짜','우선순위','활성여부','오늘완료','메모']
  rHdrs.forEach((h, i) => setHeader(wsR.getCell(`${String.fromCharCode(65+i)}1`), h, 'C55A11'))
  wsR.getRow(1).height = 26

  for (let r = 2; r <= 200; r++) {
    const even = r % 2 === 0
    for (let c = 0; c < 7; c++) setData(wsR.getCell(`${String.fromCharCode(65+c)}${r}`), even)
  }

  addDropdown(wsR, 'B', 2, 200, '_목록!$H$2:$H$4')
  addDropdown(wsR, 'C', 2, 200, '_목록!$I$2:$I$12')
  addDropdown(wsR, 'D', 2, 200, '_목록!$D$2:$D$4')
  addDropdown(wsR, 'E', 2, 200, '_목록!$J$2:$J$3')
  addDropdown(wsR, 'F', 2, 200, '_목록!$K$2:$K$3')

  wsR.addConditionalFormatting({ ref: `F2:F200`, rules: [
    { type: 'containsText', operator: 'containsText', text: '완료', style: { fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFE2EFDA'}}, font:{color:{argb:'FF375623'},bold:true} } },
  ]})
  wsR.addConditionalFormatting({ ref: `A2:G200`, rules: [
    { type: 'expression', formulae: [`$E2="비활성"`], style: { font:{strike:true,color:{argb:'FFAAAAAA'}} } },
  ]})

  // 저장
  const date = new Date().toISOString().slice(0, 10)
  const filename = `JM업무관리_v2_${date}.xlsx`
  await wb.xlsx.writeFile(filename)
  console.log(`\n✅ 완료: ${filename}`)
  console.log('   위치: C:\\Users\\User\\Desktop\\클로드_JM\\todolist\\')
}

create().catch(e => { console.error('오류:', e.message) })

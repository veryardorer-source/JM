const PptxGenJS = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/pptxgenjs');
const xlsx = require('C:/Users/Administrator/Desktop/JM_클로드/P_1/node_modules/xlsx');

// ─── 색상 : 흰색 배경 + 로고 그린 포인트 ────────────────
const C = {
  g_dark:  '1B5E20',
  g_mid:   '2E7D32',
  g_light: '4CAF50',
  g_pale:  'F1F8F1',
  g_line:  '81C784',
  white:   'FFFFFF',
  bg:      'FFFFFF',
  charcoal:'212121',
  gray1:   'F5F5F5',
  gray2:   'E0E0E0',
  dgray:   '757575',
  gold:    'F9A825',
};

const LOGO = 'C:/Users/Administrator/Desktop/JM_클로드/린데코리아/JM건축인테리어ci_투명.png';
const SW = 13.33, SH = 7.5;

// ─── 회사 정보 ────────────────────────────────────────────
const CO = {
  name:  '제이엠건축인테리어 주식회사',
  ceo:   '이소연',
  bizNo: '168-86-03200',
  tel:   '055-252-0611',
  email: 'jmworks0612@naver.com',
  web:   'jminterior.co.kr',
  addr:  '경상남도 창원시 의창구 평산로135번길 4, 2층(서상동)',
};

// ─── 날짜 변환 ────────────────────────────────────────────
function excelDateToStr(n) {
  if (typeof n !== 'number') return String(n || '');
  const d = new Date(Math.round((n - 25569) * 86400 * 1000));
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}`;
}

// ─── 공사경력 데이터 파싱 ───────────────────────────────
const wb = xlsx.readFile(
  'C:/Users/Administrator/Desktop/JM_클로드/린데코리아/02_공사경력 현황표/JM공사경력.xlsx'
);

function parseSheet(name) {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
  let h = -1;
  data.forEach((r, i) => { if (r[0] === '현장명') h = i; });
  if (h < 0) return [];
  const hdr = data[h];
  const idx = {};
  hdr.forEach((v, i) => { idx[v] = i; });
  return data.slice(h + 1)
    .filter(r => r[0] && r[idx['본 공사 금액']] && typeof r[idx['본 공사 금액']] === 'number')
    .map(r => ({
      name:  r[idx['공사명']] || r[0],
      start: r[idx['시작일']],
      end:   r[idx['준공일 ']],
      amount: r[idx['본 공사 금액']] || 0,
    }))
    .filter(r => r.amount >= 10000000);
}

function parseSheet2024() {
  const ws = wb.Sheets['법인 2024'];
  if (!ws) return [];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
  return data.slice(2)
    .filter(r => r[1] && r[6] && typeof r[6] === 'number' && r[6] >= 10000000)
    .map(r => ({
      name:  r[4] || r[1],
      start: r[2],
      end:   r[3],
      amount: r[6] || 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

const rec2026 = parseSheet('법인 2026').sort((a,b) => (a.start||0) - (b.start||0));
const rec2025 = parseSheet('법인 2025').sort((a,b) => (a.start||0) - (b.start||0));
const rec2024 = parseSheet2024().sort((a,b) => (a.start||0) - (b.start||0));

// ─── 공통 헬퍼 ───────────────────────────────────────────
function addBg(s) {
  s.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color:C.bg } });
}

function addHeader(s, title, sub='') {
  s.addShape('rect', { x:0, y:0, w:'100%', h:1.28, fill:{ color:C.white } });
  s.addShape('rect', { x:0, y:1.22, w:'100%', h:0.06, fill:{ color:C.g_dark } });
  s.addShape('rect', { x:0, y:1.28, w:'100%', h:0.03, fill:{ color:C.gold } });
  s.addText(title, {
    x:0.6, y:0.1, w:10.2, h:0.72,
    fontSize:23, bold:true, color:C.g_dark,
    fontFace:'나눔고딕', align:'center', valign:'middle',
  });
  if (sub) s.addText(sub, {
    x:0.6, y:0.82, w:10.2, h:0.36,
    fontSize:9.5, color:C.dgray, fontFace:'나눔고딕', align:'center',
  });
  s.addImage({ path:LOGO, x:10.9, y:0.22, w:2.3, h:0.77,
    sizing:{ type:'contain', w:2.3, h:0.77 } });
}

function addFooter(s, pg='') {
  s.addShape('rect', { x:0, y:7.1, w:'100%', h:0.4, fill:{ color:C.g_dark } });
  s.addText(`${CO.name}  |  ${CO.tel}  |  ${CO.email}  |  ${CO.web}`, {
    x:0.5, y:7.13, w:11.8, h:0.3,
    fontSize:8, color:C.g_line, fontFace:'나눔고딕', align:'center',
  });
  if (pg) s.addText(String(pg), {
    x:12.7, y:7.13, w:0.5, h:0.3,
    fontSize:8.5, color:C.g_line, align:'right',
  });
}

function fmtAmt(n) {
  if (!n || typeof n !== 'number') return '-';
  return `${Math.round(n/10000).toLocaleString()}만원`;
}

// 공사실적 테이블 (슬라이드 안에 완전히 맞춤)
// 가용 영역: y:1.42 ~ y:6.98 = 5.56"
// PER=12건 기준: 헤더1 + 데이터12 = 13행 × 0.427" = 5.55" ✓
function makeRecTable(pptx, records, title, sub, pageNum, startNo = 1) {
  const s = pptx.addSlide();
  addBg(s);
  addHeader(s, title, sub);

  const H = { fill: C.g_dark };
  const hdr = [
    { text: 'NO',     options: { bold:true, color:C.white, fontSize:9, align:'center', fontFace:'나눔고딕', ...H } },
    { text: '공사년월', options: { bold:true, color:C.white, fontSize:9, align:'center', fontFace:'나눔고딕', ...H } },
    { text: '공사내역', options: { bold:true, color:C.white, fontSize:9, fontFace:'나눔고딕', ...H } },
    { text: '공사금액', options: { bold:true, color:C.white, fontSize:9, align:'right', fontFace:'나눔고딕', ...H } },
  ];
  const rows = [hdr];
  records.forEach((r, i) => {
    const fill = i % 2 === 0 ? C.white : C.g_pale;
    const nm = r.name.length > 42 ? r.name.substring(0, 42) + '…' : r.name;
    const period = excelDateToStr(r.start)
      ? `${excelDateToStr(r.start)}~${excelDateToStr(r.end)}`
      : '진행중';
    rows.push([
      { text: String(i + startNo), options: { color:C.dgray,    fontSize:9, align:'center', fontFace:'나눔고딕', fill } },
      { text: period,              options: { color:C.g_dark,   fontSize:9, bold:true, align:'center', fontFace:'나눔고딕', fill } },
      { text: nm,                  options: { color:C.charcoal, fontSize:9, fontFace:'나눔고딕', fill } },
      { text: fmtAmt(r.amount),    options: { color:C.g_dark,   fontSize:9, bold:true, align:'right', fontFace:'나눔고딕', fill } },
    ]);
  });

  // 가용 높이: footer(y=7.0) - tableStart(y=1.42) = 5.58"
  const AVAIL = 5.58;
  const rH = Math.min(0.43, AVAIL / rows.length);
  s.addTable(rows, {
    x:0.5, y:1.42, w:12.3,
    rowH:rH,
    colW:[0.45, 2.0, 8.05, 1.8],
    border:{ type:'solid', color:C.gray2, pt:0.5 },
    fill:C.white,
    autoPage:false,
    headerRowCnt:1,
  });

  addFooter(s, pageNum);
}

// ══════════════════════════════════════════════════════════
async function makeRecord() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  // ── 표지 ──────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color:C.white } });

    // 좌측 그린 사이드바
    s.addShape('rect', { x:0, y:0, w:0.35, h:SH, fill:{ color:C.g_dark } });
    s.addShape('rect', { x:0.35, y:0, w:SW-0.35, h:0.08, fill:{ color:C.g_dark } });
    s.addShape('rect', { x:0.35, y:0.08, w:SW-0.35, h:0.04, fill:{ color:C.gold } });

    // 로고 (3:1 비율)
    s.addImage({ path:LOGO, x:0.65, y:0.5, w:3.6, h:1.21,
      sizing:{ type:'contain', w:3.6, h:1.21 } });

    s.addText('공사실적 및 지명원', {
      x:0.65, y:2.55, w:7.0, h:0.95,
      fontSize:38, bold:true, color:C.charcoal, fontFace:'나눔고딕',
    });
    s.addText('CONSTRUCTION RECORD & NOMINATION', {
      x:0.65, y:3.55, w:7.0, h:0.42,
      fontSize:11, color:C.dgray, fontFace:'나눔고딕', charSpacing:3,
    });
    s.addShape('rect', { x:0.65, y:4.08, w:9.5, h:0.05, fill:{ color:C.g_dark } });
    s.addText('린데코리아㈜ 창원공장\n공무 / 고객지원팀 사무실 인테리어공사', {
      x:0.65, y:4.26, w:9.5, h:0.9,
      fontSize:14, color:C.charcoal, fontFace:'나눔고딕', lineSpacingMultiple:1.5,
    });
    s.addText('작성일 : 2026년 3월', {
      x:0.65, y:5.32, w:9.5, h:0.36,
      fontSize:10, color:C.dgray, fontFace:'나눔고딕',
    });

    s.addShape('rect', { x:0, y:SH-0.06, w:'100%', h:0.06, fill:{ color:C.g_dark } });
  }

  // ── 목차 ──────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '목  차', 'Contents');

    const items = [
      ['01','회사 개요','Company Overview'],
      ['02','수행 역량','Capabilities & Expertise'],
      ['03','2024년 주요 공사실적','Major Projects in 2024'],
      ['04','2025년 주요 공사실적','Major Projects in 2025'],
      ['05','2026년 공사실적','Projects in 2026'],
      ['06','공종별 실적 요약','Project Summary by Type'],
    ];
    // 6항목 2열 3행: row간격1.78, 카드h1.5 → 마지막y=1.42+2*1.78=4.98, ends 6.48, footer 7.1 ✓
    items.forEach(([no,kr,en], i) => {
      const col = i%2, row = Math.floor(i/2);
      const x = col===0 ? 0.6 : 7.05;
      const y = 1.42 + row*1.78;
      s.addShape('rect', { x, y, w:5.95, h:1.55,
        fill:{ color:C.white }, line:{ color:C.gray2, width:0.5 },
        shadow:{ type:'outer', blur:3, offset:1, color:'D0D0D0' } });
      s.addShape('rect', { x, y, w:0.08, h:1.55, fill:{ color:C.g_dark } });
      s.addShape('rect', { x:x+0.18, y:y+0.35, w:0.68, h:0.68,
        fill:{ color:C.g_pale }, line:{ color:C.g_line, width:0.5 } });
      s.addText(no, { x:x+0.18, y:y+0.35, w:0.68, h:0.68,
        fontSize:14, bold:true, color:C.g_dark, align:'center', fontFace:'나눔고딕' });
      s.addText(kr, { x:x+1.0, y:y+0.28, w:4.8, h:0.5,
        fontSize:14, bold:true, color:C.charcoal, fontFace:'나눔고딕' });
      s.addText(en, { x:x+1.0, y:y+0.82, w:4.8, h:0.36,
        fontSize:10, color:C.dgray, fontFace:'나눔고딕' });
    });
    addFooter(s, 2);
  }

  // ── 회사 개요 ─────────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '01  회사 개요', 'Company Overview');

    // 좌측 로고 패널
    s.addShape('rect', { x:0.5, y:1.42, w:4.5, h:5.45,
      fill:{ color:C.g_pale }, line:{ color:C.g_line, width:0.5 } });
    s.addShape('rect', { x:0.5, y:1.42, w:4.5, h:0.06, fill:{ color:C.g_dark } });
    s.addImage({ path:LOGO, x:0.7, y:1.78, w:4.0, h:1.34,
      sizing:{ type:'contain', w:4.0, h:1.34 } });
    s.addShape('rect', { x:1.3, y:3.9, w:2.9, h:0.05, fill:{ color:C.gold } });
    ['사무실 인테리어 전문','경남권 최다 레퍼런스','A/S 하자 보증 1년'].forEach((t,i) => {
      s.addText(t, { x:0.6, y:4.1+i*0.52, w:4.3, h:0.46,
        fontSize:11, color:C.g_dark, align:'center', fontFace:'나눔고딕' });
    });

    // 우측 정보
    const details = [
      ['상 호 명',  CO.name],
      ['대 표 자',  CO.ceo],
      ['설 립 일',  '2023년 07월 06일'],
      ['사업분야',  '건설업 / 실내인테리어'],
      ['사업자번호', CO.bizNo],
      ['전    화',  CO.tel],
      ['이 메 일',  CO.email],
      ['홈페이지',  CO.web],
    ];
    details.forEach(([k,v], i) => {
      const y = 1.48 + i*0.62;
      s.addShape('rect', { x:5.2, y, w:7.95, h:0.56,
        fill:{ color: i%2===0 ? C.white : C.g_pale } });
      s.addShape('rect', { x:5.2, y:y+0.15, w:0.1, h:0.28, fill:{ color:C.g_dark } });
      s.addText(k, { x:5.38, y:y+0.07, w:2.1, h:0.42,
        fontSize:10.5, bold:true, color:C.g_dark, fontFace:'나눔고딕' });
      s.addText(v, { x:7.52, y:y+0.07, w:5.5, h:0.42,
        fontSize:10.5, color:C.charcoal, fontFace:'나눔고딕' });
    });
    addFooter(s, 3);
  }

  // ── 수행 역량 ─────────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '02  수행 역량', 'Capabilities & Expertise');

    const caps = [
      { icon:'🏢', title:'사무실 인테리어', desc:'법인 및 개인 사무실, 의원, 학원\n리모델링 전문. 기획~준공 원스톱' },
      { icon:'🍽', title:'상업공간',        desc:'카페, 식당, 뷰티샵, 학원 등\n상업시설 특화 설계 및 시공' },
      { icon:'🏗', title:'산업·공공시설',   desc:'HD현대, 부산대학교, 낙동강유역환경청\n공공기관 및 산업시설 실적 보유' },
      { icon:'🔧', title:'유지·보수',       desc:'준공 후 1년 하자보증\n긴급 A/S 대응 가능' },
    ];
    caps.forEach((c,i) => {
      const col = i%2, row = Math.floor(i/2);
      const x = col===0 ? 0.5 : 7.05;
      const y = 1.45 + row*2.35;
      s.addShape('rect', { x, y, w:5.7, h:2.1,
        fill:{ color:C.white }, line:{ color:C.gray2, width:0.5 },
        shadow:{ type:'outer', blur:4, offset:2, color:'D0D0D0' } });
      s.addShape('rect', { x, y, w:5.7, h:0.06, fill:{ color:C.g_dark } });
      s.addShape('rect', { x, y, w:0.75, h:2.1, fill:{ color:C.g_pale } });
      s.addText(c.icon, { x:x+0.02, y:y+0.45, w:0.72, h:0.62, fontSize:22, align:'center' });
      s.addText(c.title, { x:x+0.85, y:y+0.1, w:4.7, h:0.5,
        fontSize:14, bold:true, color:C.g_dark, fontFace:'나눔고딕' });
      s.addText(c.desc, { x:x+0.85, y:y+0.62, w:4.7, h:1.3,
        fontSize:10, color:C.charcoal, fontFace:'나눔고딕', lineSpacingMultiple:1.6 });
    });
    addFooter(s, 4);
  }

  const PER = 12; // 슬라이드당 최대 행수

  // 연도별 실적을 PER개씩 슬라이드로 분할 출력
  function makeRecPages(recs, titleBase, subBase) {
    const total = Math.ceil(recs.length / PER);
    for (let p = 0; p < total; p++) {
      const chunk = recs.slice(p * PER, (p + 1) * PER);
      const suffix = total > 1 ? (p === 0 ? '' : ` (계속 ${p+1})`) : '';
      makeRecTable(pptx, chunk,
        titleBase + suffix,
        subBase + (total > 1 ? ` (${p+1}/${total})` : ''),
        '',
        p * PER + 1
      );
    }
  }

  // ── 2024년 실적 ──────────────────────────────────────
  makeRecPages(rec2024, '03  2024년 주요 공사실적', 'Major Projects in 2024');

  // ── 2025년 실적 ──────────────────────────────────────
  makeRecPages(rec2025, '04  2025년 주요 공사실적', 'Major Projects in 2025');

  // ── 2026년 실적 ──────────────────────────────────────
  makeRecPages(rec2026, '05  2026년 공사실적', 'Projects in 2026 (진행중)');

  // ── 공종별 실적 요약 ─────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '06  공종별 실적 요약', 'Project Summary by Type');

    const fmt = n => {
      if (!n) return '-';
      return `${Math.round(n/10000).toLocaleString()}만원`;
    };

    const yearStats = [
      { year:'2024', cnt:rec2024.length, total:rec2024.reduce((a,r)=>a+r.amount,0), color:C.g_dark },
      { year:'2025', cnt:rec2025.length, total:rec2025.reduce((a,r)=>a+r.amount,0), color:C.g_mid },
      { year:'2026', cnt:rec2026.length, total:rec2026.reduce((a,r)=>a+r.amount,0), color:C.g_light },
    ];
    yearStats.forEach((ys,i) => {
      const x = 0.5 + i * 4.1;
      s.addShape('rect', { x, y:1.45, w:3.85, h:2.1,
        fill:{ color:C.white }, line:{ color:C.gray2, width:0.5 },
        shadow:{ type:'outer', blur:4, offset:2, color:'D0D0D0' } });
      s.addShape('rect', { x, y:1.45, w:3.85, h:0.06, fill:{ color:ys.color } });
      s.addShape('rect', { x, y:1.45, w:3.85, h:0.65, fill:{ color:C.g_pale } });
      s.addText(`${ys.year}년`, { x, y:1.45, w:3.85, h:0.65,
        fontSize:14, bold:true, color:C.g_dark, align:'center', fontFace:'나눔고딕', valign:'middle' });
      s.addText(`${ys.cnt}건`, { x, y:2.15, w:3.85, h:0.75,
        fontSize:32, bold:true, color:ys.color, align:'center', fontFace:'나눔고딕' });
      s.addText(fmt(ys.total), { x, y:2.95, w:3.85, h:0.5,
        fontSize:13, color:C.dgray, align:'center', fontFace:'나눔고딕' });
    });

    // 공종별 분류
    s.addShape('rect', { x:0.5, y:3.62, w:SW-1.0, h:0.06, fill:{ color:C.g_dark } });
    s.addShape('rect', { x:0.5, y:3.65, w:SW-1.0, h:0.06, fill:{ color:C.gold } });
    s.addText('공종별 분류 (2024~2026)', { x:0.5, y:3.8, w:SW-1.0, h:0.4,
      fontSize:13, bold:true, color:C.g_dark, fontFace:'나눔고딕' });

    const categories = [
      { type:'사무실 / 오피스',  cnt:18, color:C.g_dark },
      { type:'학원 / 교육시설',  cnt:12, color:C.g_mid },
      { type:'카페 / 식당',      cnt:8,  color:C.g_light },
      { type:'뷰티 / 헤어',      cnt:8,  color:C.gold },
      { type:'공공기관',          cnt:6,  color:'5B9E6A' },
      { type:'기타',              cnt:12, color:C.dgray },
    ];
    categories.forEach((c,i) => {
      const col = i%3, row = Math.floor(i/3);
      const x = 0.5 + col * 4.1;
      const y = 4.3 + row * 0.85;
      s.addShape('rect', { x, y, w:3.9, h:0.72,
        fill:{ color:C.white }, line:{ color:C.gray2, width:0.5 } });
      s.addShape('rect', { x, y, w:0.08, h:0.72, fill:{ color:c.color } });
      s.addShape('rect', { x:x+0.18, y:y+0.2, w:0.25, h:0.25, fill:{ color:c.color } });
      s.addText(c.type, { x:x+0.55, y:y+0.08, w:2.5, h:0.35,
        fontSize:11, bold:true, color:C.charcoal, fontFace:'나눔고딕' });
      s.addText(`${c.cnt}건 이상`, { x:x+0.55, y:y+0.4, w:2.5, h:0.28,
        fontSize:10, color:C.dgray, fontFace:'나눔고딕' });
    });

    s.addText('* 1천만원 이상 프로젝트 기준. 공종별 건수는 개략 분류 기준입니다.', {
      x:0.5, y:6.82, w:SW-1.0, h:0.22, fontSize:8, color:C.dgray, italic:true, fontFace:'나눔고딕',
    });
    addFooter(s, '');
  }

  // ── 마지막 슬라이드 ───────────────────────────────────
  {
    const s = pptx.addSlide();
    s.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color:C.white } });
    s.addShape('rect', { x:0, y:0, w:'100%', h:0.08, fill:{ color:C.g_dark } });
    s.addShape('rect', { x:0, y:SH-0.08, w:'100%', h:0.08, fill:{ color:C.g_dark } });
    s.addShape('rect', { x:0, y:0.08, w:'100%', h:0.04, fill:{ color:C.gold } });

    s.addImage({ path:LOGO, x:SW/2-2.4, y:1.35, w:4.8, h:1.61,
      sizing:{ type:'contain', w:4.8, h:1.61 } });

    s.addText('감사합니다', {
      x:0, y:3.7, w:'100%', h:1.1,
      fontSize:46, bold:true, color:C.charcoal, align:'center', fontFace:'나눔고딕' });
    s.addText('THANK YOU', {
      x:0, y:4.82, w:'100%', h:0.42,
      fontSize:12, color:C.dgray, align:'center', charSpacing:6 });

    s.addShape('rect', { x:SW/2-3.5, y:5.38, w:7.0, h:0.05, fill:{ color:C.g_dark } });
    s.addText('린데코리아㈜ 창원공장 공무/고객지원 사무실 인테리어공사', {
      x:1, y:5.55, w:SW-2, h:0.48,
      fontSize:12.5, color:C.charcoal, align:'center', fontFace:'나눔고딕' });
    s.addText(`${CO.name}  |  대표 ${CO.ceo}  |  ${CO.tel}  |  ${CO.web}`, {
      x:1, y:6.1, w:SW-2, h:0.4,
      fontSize:10.5, color:C.dgray, align:'center', fontFace:'나눔고딕' });
  }

  await pptx.writeFile({
    fileName:'C:/Users/Administrator/Desktop/JM_클로드/린데코리아/02_공사실적및지명원_린데코리아_v7.pptx'
  });
  console.log('✅ 공사실적 및 지명원 완성!');
}

makeRecord().catch(e => { console.error(e.message); console.error(e.stack); });

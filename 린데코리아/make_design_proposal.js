const PptxGenJS = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/pptxgenjs');

// ─── 색상 : 흰색 배경 + 로고 그린 포인트 ────────────────
const C = {
  g_dark:  '1B5E20',  // 로고 진한 그린 → 헤더·포인트
  g_mid:   '2E7D32',  // 중간 그린
  g_light: '4CAF50',  // 밝은 그린 (로고 J)
  g_pale:  'F1F8F1',  // 연한 그린 배경 (카드 교번)
  g_line:  '81C784',  // 구분선
  white:   'FFFFFF',
  bg:      'FFFFFF',  // ★ 배경 흰색
  charcoal:'212121',
  gray1:   'F5F5F5',  // 카드 배경
  gray2:   'E0E0E0',  // 구분선
  dgray:   '757575',  // 보조 텍스트
  gold:    'F9A825',  // 포인트 골드
};

const LOGO  = 'C:/Users/Administrator/Desktop/JM_클로드/린데코리아/JM건축인테리어ci_그라데이션.png';
const PLAN  = 'C:/temp_pdf_convert/floor_plan-1.png';
const P     = n => `C:/temp_pdf_convert/persp-${n}.png`;
const SW = 13.33, SH = 7.5;

const CO = {
  name: '제이엠건축인테리어 주식회사',
  ceo:  '이소연',
  tel:  '055-252-0611',
  email:'jmworks0612@naver.com',
  web:  'jminterior.co.kr',
};

// ─── 헬퍼 ─────────────────────────────────────────────────
function addBg(s) {
  s.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color:C.bg } });
}

// 헤더 : 흰 배경 + 하단 그린 라인 + 우측 로고
function addHeader(s, title, sub='') {
  // 흰 배경 상단 영역
  s.addShape('rect', { x:0, y:0, w:'100%', h:1.28, fill:{ color:C.white } });
  // 하단 두꺼운 그린 라인
  s.addShape('rect', { x:0, y:1.22, w:'100%', h:0.06, fill:{ color:C.g_dark } });
  // 얇은 골드 라인
  s.addShape('rect', { x:0, y:1.28, w:'100%', h:0.03, fill:{ color:C.gold } });
  // 타이틀 – 다크그린, 중앙
  s.addText(title, {
    x:0.6, y:0.1, w:10.2, h:0.72,
    fontSize:23, bold:true, color:C.g_dark,
    fontFace:'나눔고딕', align:'center', valign:'middle',
  });
  if (sub) s.addText(sub, {
    x:0.6, y:0.82, w:10.2, h:0.36,
    fontSize:9.5, color:C.dgray, fontFace:'나눔고딕', align:'center',
  });
  // 로고 (원본 비율 1432×480 ≈ 3:1)
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

// 섹션 타이틀 바
function secTitle(s, x, y, w, text) {
  s.addShape('rect', { x, y, w:0.12, h:0.52, fill:{ color:C.g_dark } });
  s.addText(text, { x:x+0.22, y, w:w, h:0.52,
    fontSize:13, bold:true, color:C.g_dark, fontFace:'나눔고딕', valign:'middle' });
}

// ══════════════════════════════════════════════════════════
async function makeProposal() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  // ── 표지 ──────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color:C.white } });

    // 좌측 그린 사이드바 (좁게)
    s.addShape('rect', { x:0, y:0, w:0.35, h:SH, fill:{ color:C.g_dark } });
    // 상단 가로 그린 밴드
    s.addShape('rect', { x:0.35, y:0, w:SW-0.35, h:0.08, fill:{ color:C.g_dark } });
    // 골드 라인
    s.addShape('rect', { x:0.35, y:0.08, w:SW-0.35, h:0.04, fill:{ color:C.gold } });

    // 로고 (3:1 비율)
    s.addImage({ path:LOGO, x:0.65, y:0.5, w:3.6, h:1.21,
      sizing:{ type:'contain', w:3.6, h:1.21 } });

    // 메인 제목
    s.addText('디자인 제안서', {
      x:0.65, y:2.5, w:7.0, h:1.05,
      fontSize:44, bold:true, color:C.charcoal, fontFace:'나눔고딕',
    });
    s.addText('INTERIOR DESIGN PROPOSAL', {
      x:0.65, y:3.58, w:7.0, h:0.42,
      fontSize:12, color:C.dgray, fontFace:'나눔고딕', charSpacing:4,
    });
    s.addShape('rect', { x:0.65, y:4.1, w:5.5, h:0.05, fill:{ color:C.g_dark } });

    s.addText('린데코리아㈜ 창원공장\n공무 / 고객지원팀 사무실 인테리어공사', {
      x:0.65, y:4.28, w:7.0, h:0.95,
      fontSize:15, color:C.charcoal, fontFace:'나눔고딕', lineSpacingMultiple:1.5,
    });
    [
      'Project No. : CW-2026-01',
      '작성일 : 2026년 3월',
      `제안사 : ${CO.name}`,
    ].forEach((t,i) => s.addText(t, {
      x:0.65, y:5.38+i*0.42, w:7.0, h:0.38,
      fontSize:10, color:C.dgray, fontFace:'나눔고딕',
    }));

    // 우측 정보 박스 (흰 배경, 그린 테두리)
    s.addShape('rect', { x:8.3, y:0.18, w:4.8, h:7.12,
      fill:{ color:C.g_pale },
      line:{ color:C.g_line, width:0.8 } });
    s.addShape('rect', { x:8.3, y:0.18, w:4.8, h:0.55, fill:{ color:C.g_dark } });
    s.addText('PROJECT INFO', { x:8.3, y:0.2, w:4.8, h:0.5,
      fontSize:10, bold:true, color:C.white, align:'center', fontFace:'나눔고딕', charSpacing:2 });

    const infos = [
      ['발 주 처', '린데코리아㈜'],
      ['위    치', '창원시 성산구 삼동로 100-31'],
      ['공사내용', '공무/고객지원 사무실 인테리어'],
      ['면    적', '92.2㎡ (27.9평)'],
      ['착    공', '2026. 03. 23'],
      ['준    공', '2026. 04. 11'],
      ['공    기', '약 20일'],
    ];
    infos.forEach(([k,v], i) => {
      const y = 0.88 + i * 0.88;
      s.addShape('rect', { x:8.35, y, w:4.7, h:0.78,
        fill:{ color: i%2===0 ? C.white : C.g_pale } });
      s.addText(k, { x:8.48, y:y+0.1, w:1.5, h:0.55,
        fontSize:9.5, bold:true, color:C.g_dark, fontFace:'나눔고딕' });
      s.addText(v, { x:10.0, y:y+0.1, w:3.0, h:0.55,
        fontSize:10, color:C.charcoal, fontFace:'나눔고딕' });
    });

    s.addShape('rect', { x:0, y:SH-0.06, w:'100%', h:0.06, fill:{ color:C.g_dark } });
  }

  // ── 목차 ──────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '목  차', 'Table of Contents');

    const items = [
      ['01','프로젝트 개요','Project Overview'],
      ['02','디자인 컨셉','Design Concept'],
      ['03','평면도','Floor Plan'],
      ['04','인테리어 투시도 Ⅰ','Interior Perspective Ⅰ'],
      ['05','인테리어 투시도 Ⅱ','Interior Perspective Ⅱ'],
      ['06','조감도',"Bird's Eye View"],
      ['07','주요 공사 내용','Scope of Work'],
      ['08','마감재 계획','Finishing Materials'],
      ['09','공사 일정','Construction Schedule'],
      ['10','회사 소개','Company Profile'],
    ];
    items.forEach(([no,kr,en], i) => {
      const col = i%2, row = Math.floor(i/2);
      const x = col===0 ? 0.6 : 7.05;
      const y = 1.48 + row*1.13;
      // 카드 (흰 배경, 그린 왼쪽 보더)
      s.addShape('rect', { x, y, w:5.95, h:0.95,
        fill:{ color:C.white },
        line:{ color:C.gray2, width:0.5 },
        shadow:{ type:'outer', blur:3, offset:1, color:'D0D0D0' } });
      s.addShape('rect', { x, y, w:0.08, h:0.95, fill:{ color:C.g_dark } });
      // 번호 배지
      s.addShape('rect', { x:x+0.18, y:y+0.2, w:0.6, h:0.55,
        fill:{ color:C.g_pale }, line:{ color:C.g_line, width:0.5 } });
      s.addText(no, { x:x+0.18, y:y+0.2, w:0.6, h:0.55,
        fontSize:13, bold:true, color:C.g_dark, align:'center', fontFace:'나눔고딕' });
      s.addText(kr, { x:x+0.92, y:y+0.1, w:4.8, h:0.42,
        fontSize:13.5, bold:true, color:C.charcoal, fontFace:'나눔고딕' });
      s.addText(en, { x:x+0.92, y:y+0.52, w:4.8, h:0.3,
        fontSize:9.5, color:C.dgray, fontFace:'나눔고딕' });
    });
    addFooter(s, 2);
  }

  // ── 프로젝트 개요 ──────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '01  프로젝트 개요', 'Project Overview');

    const cards = [
      { label:'프로젝트명', val:'창원공장 공무/고객지원\n사무실 인테리어공사' },
      { label:'발주처',     val:'린데코리아㈜' },
      { label:'공사위치',   val:'창원시 성산구\n삼동로 100-31' },
      { label:'공사기간',   val:'2026.03.23\n~ 2026.04.11' },
    ];
    const cw = (SW-1.2)/4;
    cards.forEach((c,i) => {
      const x = 0.6 + i*cw;
      s.addShape('rect', { x, y:1.45, w:cw-0.12, h:2.15,
        fill:{ color:C.white },
        line:{ color:C.gray2, width:0.5 },
        shadow:{ type:'outer', blur:4, offset:2, color:'D0D0D0' } });
      // 상단 그린 포인트 라인
      s.addShape('rect', { x, y:1.45, w:cw-0.12, h:0.07, fill:{ color:C.g_dark } });
      s.addText(c.label, { x, y:1.6, w:cw-0.12, h:0.4,
        fontSize:10.5, bold:true, color:C.g_dark, align:'center', fontFace:'나눔고딕' });
      s.addShape('rect', { x:x+(cw-0.12)*0.25, y:2.05, w:(cw-0.12)*0.5, h:0.03,
        fill:{ color:C.g_line } });
      s.addText(c.val, { x:x+0.1, y:2.15, w:cw-0.32, h:1.35,
        fontSize:12.5, bold:true, color:C.charcoal, align:'center',
        fontFace:'나눔고딕', lineSpacingMultiple:1.55 });
    });

    s.addShape('rect', { x:0.6, y:3.78, w:SW-1.2, h:0.04, fill:{ color:C.gray2 } });
    secTitle(s, 0.6, 3.95, 6, '공사 범위');

    const scopes = [
      ['바닥 / 벽체 / 천장공사', '조명 포함, 기존 철거 후 신규 시공'],
      ['방화문 및 ABS도어 설치', '정·후문 방화문 / 화장실 ABS도어 교체'],
      ['제작 가구 설치', '캔틴장, FURSYS 8인 회의테이블, 수납장'],
      ['전기 및 통신 배선', '멀티탭 6구↑, UTP케이블, WiFi 원활 조치'],
      ['입주청소 및 폐기물 처리', '준공 후 즉시 입주 가능 수준으로 마감'],
    ];
    scopes.forEach(([title,desc], i) => {
      const col = i<3 ? 0 : 1;
      const row = i<3 ? i : i-3;
      const x = col===0 ? 0.6 : 7.1;
      const y = 4.6 + row*0.6;
      s.addShape('rect', { x:x+0.02, y:y+0.1, w:0.22, h:0.22, fill:{ color:C.g_light } });
      s.addText(title, { x:x+0.35, y:y+0.02, w:5.9, h:0.3,
        fontSize:11, bold:true, color:C.charcoal, fontFace:'나눔고딕' });
      s.addText(desc, { x:x+0.35, y:y+0.32, w:5.9, h:0.25,
        fontSize:9.5, color:C.dgray, fontFace:'나눔고딕' });
    });
    addFooter(s, 3);
  }

  // ── 디자인 컨셉 ────────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '02  디자인 컨셉', 'Design Concept');

    const concepts = [
      { kw:'FUNCTIONAL', title:'기능적 업무 환경', icon:'⚡',
        desc:'각 책상별 전기·통신 완비\n멀티탭 6구↑, UTP 케이블\nWiFi · 휴대전화 통신 원활' },
      { kw:'BRIGHT',     title:'균일한 조도 환경', icon:'💡',
        desc:'라인 LED 조명으로 균등 조도\n500~750 LUX 범위 설계\n마이톤 천장 반사율 활용' },
      { kw:'NATURAL',    title:'자연 친화적 마감', icon:'🌿',
        desc:'우드 계열 필름 + 화이트 파티션\nP-TILE 바닥 / 방화문·ABS도어\n편안하고 안정감 있는 공간' },
      { kw:'CLEAN',      title:'깔끔한 동선 설계', icon:'✦',
        desc:'공무팀 / 고객지원팀 영역 구분\n게시판 2개소 / 도어사인 부착' },
    ];
    const bw = (SW-1.2)/4;
    concepts.forEach((c,i) => {
      const x = 0.6 + i*bw;
      // 카드 – 흰 배경 + 그린 상단 포인트
      s.addShape('rect', { x, y:1.42, w:bw-0.15, h:5.45,
        fill:{ color:C.white },
        line:{ color:C.gray2, width:0.5 },
        shadow:{ type:'outer', blur:5, offset:2, color:'D0D0D0' } });
      // 상단 그린 박스 (얇게)
      s.addShape('rect', { x, y:1.42, w:bw-0.15, h:1.65,
        fill:{ color:C.g_pale } });
      s.addShape('rect', { x, y:1.42, w:bw-0.15, h:0.06, fill:{ color:C.g_dark } });
      // 아이콘
      s.addText(c.icon, { x, y:1.55, w:bw-0.15, h:0.65, fontSize:26, align:'center' });
      // 영문 키워드
      s.addText(c.kw, { x, y:2.22, w:bw-0.15, h:0.35,
        fontSize:8.5, bold:true, color:C.g_dark, align:'center',
        charSpacing:2, fontFace:'나눔고딕' });
      // 한글 제목
      s.addText(c.title, { x:x+0.1, y:3.12, w:bw-0.35, h:0.55,
        fontSize:13, bold:true, color:C.charcoal, align:'center', fontFace:'나눔고딕' });
      s.addShape('rect', { x:x+(bw-0.15)*0.28, y:3.73, w:(bw-0.15)*0.44, h:0.04,
        fill:{ color:C.gold } });
      s.addText(c.desc, { x:x+0.15, y:3.85, w:bw-0.45, h:2.85,
        fontSize:10.5, color:C.dgray, align:'center', fontFace:'나눔고딕',
        lineSpacingMultiple:1.9 });
    });
    addFooter(s, 4);
  }

  // ── 평면도 ──────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '03  평면도', 'Floor Plan  |  Scale 1/70  |  92.2㎡ (27.9평)');

    s.addImage({ path:PLAN, x:0.5, y:1.38, w:9.4, h:5.58,
      sizing:{ type:'contain', w:9.4, h:5.58 } });

    // 우측 범례 패널
    s.addShape('rect', { x:10.1, y:1.38, w:3.08, h:5.58,
      fill:{ color:C.white }, line:{ color:C.gray2, width:0.5 } });
    s.addShape('rect', { x:10.1, y:1.38, w:3.08, h:0.06, fill:{ color:C.g_dark } });
    s.addShape('rect', { x:10.1, y:1.38, w:3.08, h:0.52, fill:{ color:C.g_pale } });
    s.addText('공간 구성', { x:10.1, y:1.38, w:3.08, h:0.52,
      fontSize:11, bold:true, color:C.g_dark, align:'center', fontFace:'나눔고딕', valign:'middle' });

    const spaces = [
      ['공무팀 사무공간', '파티션 책상 배치'],
      ['고객지원팀 사무공간', '파티션 책상 배치'],
      ['회의공간', 'FURSYS 8인 회의테이블'],
      ['캔틴/휴게공간', '수납장 및 편의시설'],
      ['화장실', 'ABS도어 교체 시공'],
      ['출입구', '방화문 (창 있는 구조)'],
    ];
    spaces.forEach(([nm,desc], i) => {
      const y = 2.0 + i*0.72;
      s.addShape('rect', { x:10.1, y, w:3.08, h:0.65,
        fill:{ color: i%2===0 ? C.white : C.g_pale } });
      s.addShape('rect', { x:10.14, y:y+0.18, w:0.1, h:0.28, fill:{ color:C.g_dark } });
      s.addText(nm,   { x:10.3, y:y+0.04, w:2.8, h:0.3,
        fontSize:10, bold:true, color:C.charcoal, fontFace:'나눔고딕' });
      s.addText(desc, { x:10.3, y:y+0.34, w:2.8, h:0.25,
        fontSize:8.5, color:C.dgray, fontFace:'나눔고딕' });
    });
    addFooter(s, 5);
  }

  // ── 투시도 Ⅰ ───────────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '04  인테리어 투시도 Ⅰ', 'Interior Perspective Ⅰ');

    [[P(2),'복도 / 회의공간 뷰 · View from Entrance', 0.5],
     [P(3),'업무공간 전경 · Workstation Area (Front)', 6.88]
    ].forEach(([path, cap, x]) => {
      s.addShape('rect', { x, y:1.4, w:6.25, h:4.35,
        fill:{ color:C.gray1 }, line:{ color:C.gray2, width:0.5 } });
      s.addImage({ path, x, y:1.4, w:6.25, h:4.35,
        sizing:{ type:'cover', w:6.25, h:4.35 } });
      s.addShape('rect', { x, y:5.42, w:6.25, h:0.44,
        fill:{ color:C.g_dark } });
      s.addText(cap, { x, y:5.44, w:6.25, h:0.38,
        fontSize:9.5, color:C.white, align:'center', fontFace:'나눔고딕' });
    });
    addFooter(s, 6);
  }

  // ── 투시도 Ⅱ ───────────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '05  인테리어 투시도 Ⅱ', 'Interior Perspective Ⅱ');

    [[P(4),'고객지원팀 업무공간 · CS Team Area', 0.5],
     [P(6),'전체 업무공간 와이드 뷰 · Wide View', 6.88]
    ].forEach(([path, cap, x]) => {
      s.addShape('rect', { x, y:1.4, w:6.25, h:4.35,
        fill:{ color:C.gray1 }, line:{ color:C.gray2, width:0.5 } });
      s.addImage({ path, x, y:1.4, w:6.25, h:4.35,
        sizing:{ type:'cover', w:6.25, h:4.35 } });
      s.addShape('rect', { x, y:5.42, w:6.25, h:0.44, fill:{ color:C.g_dark } });
      s.addText(cap, { x, y:5.44, w:6.25, h:0.38,
        fontSize:9.5, color:C.white, align:'center', fontFace:'나눔고딕' });
    });
    addFooter(s, 7);
  }

  // ── 조감도 ──────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, "06  조감도", "Bird's Eye View  |  3D Interior Plan");

    [[P(7),'3D 조감도 View 1', 0.5],
     [P(8),'3D 조감도 View 2', 6.88]
    ].forEach(([path, cap, x]) => {
      s.addShape('rect', { x, y:1.4, w:6.25, h:4.35,
        fill:{ color:C.gray1 }, line:{ color:C.gray2, width:0.5 } });
      s.addImage({ path, x, y:1.4, w:6.25, h:4.35,
        sizing:{ type:'cover', w:6.25, h:4.35 } });
      s.addShape('rect', { x, y:5.42, w:6.25, h:0.44, fill:{ color:C.g_dark } });
      s.addText(cap, { x, y:5.44, w:6.25, h:0.38,
        fontSize:9.5, color:C.white, align:'center', fontFace:'나눔고딕' });
    });
    addFooter(s, 8);
  }

  // ── 주요 공사 내용 ──────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '07  주요 공사 내용', 'Scope of Work');

    const items = [
      { cat:'바닥공사',  detail:'기존바닥 철거 및 평탄화 후\nP-TILE 마감 시공' },
      { cat:'천장공사',  detail:'마이톤 600×600(600×300)\n기존 천장 덧방 / 라인 LED 500~750LUX\n실내스피커 교체(인터M 5W)' },
      { cat:'벽체공사',  detail:'경량석고보드 평탄화\n→ 알판 → 필름 마감\n색상 발주자 사전 승인' },
      { cat:'도어교체',  detail:'정·후문 방화문 (창 있는 구조)\n공무·고객지원 표지판 부착\n화장실 ABS도어 + 표지판' },
      { cat:'제작가구',  detail:'캔틴장 제작설치\nFURSYS 회의테이블(8인)\n수납장 W800×D500×H1800\n액자걸이 6EA' },
      { cat:'전기·통신', detail:'멀티탭 6구↑ (책상별)\nUTP 통신케이블 / 불연전선(KS)\nWiFi·휴대전화 통신 원활 조치' },
    ];

    const bw = (SW-1.3)/3;
    items.forEach((it, i) => {
      const col = i%3, row = Math.floor(i/3);
      const x = 0.65 + col*bw;
      const y = 1.45 + row*2.72;
      s.addShape('rect', { x, y, w:bw-0.15, h:2.55,
        fill:{ color:C.white },
        line:{ color:C.gray2, width:0.5 },
        shadow:{ type:'outer', blur:3, offset:2, color:'D0D0D0' } });
      // 상단 컬러 포인트 라인
      s.addShape('rect', { x, y, w:bw-0.15, h:0.06,
        fill:{ color:[C.g_dark,C.g_mid,C.g_light,C.g_dark,C.g_mid,C.g_light][i] } });
      // 카테고리 라벨
      s.addShape('rect', { x:x+0.18, y:y+0.15, w:bw-0.51, h:0.42,
        fill:{ color:C.g_pale }, line:{ color:C.g_line, width:0.5 } });
      s.addText(it.cat, { x:x+0.18, y:y+0.15, w:bw-0.51, h:0.42,
        fontSize:12, bold:true, color:C.g_dark, align:'center',
        fontFace:'나눔고딕', valign:'middle' });
      s.addText(it.detail, { x:x+0.15, y:y+0.7, w:bw-0.45, h:1.75,
        fontSize:10, color:C.charcoal, fontFace:'나눔고딕', lineSpacingMultiple:1.65 });
    });
    addFooter(s, 9);
  }

  // ── 마감재 계획 ─────────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '08  마감재 계획', 'Finishing Material Plan');

    const mats = [
      { part:'바    닥', spec:'P-TILE',                             std:'KS 규격품',  note:'기존 철거 후 평탄화 시공' },
      { part:'천    장', spec:'마이톤 600×600 / 600×300',           std:'KS 규격품',  note:'기존 천장 덧방 시공' },
      { part:'벽    체', spec:'경량석고보드 + 알판 + 필름 마감',    std:'KS 규격품',  note:'발주자 색상 승인 후 시공' },
      { part:'도    어', spec:'방화문 (정·후문) / ABS도어 (화장실)', std:'소방법 적합', note:'창 있는 구조' },
      { part:'조    명', spec:'라인 LED 조명',                      std:'KS 규격품',  note:'500~750 LUX 설계' },
      { part:'전    선', spec:'불연전선',                           std:'KS 규격품',  note:'전기제품 전체 KS 적용' },
      { part:'가    구', spec:'FURSYS 회의테이블 / 제작가구',       std:'-',          note:'캔틴장·수납장 제작' },
    ];

    const hdr = ['부위','마감재 / 제품','규격 기준','비고'].map(t => ({
      text:t, options:{ bold:true, color:C.white, fontFace:'나눔고딕', fontSize:11, align:'center' }
    }));
    const rows = [hdr];
    mats.forEach((m,i) => {
      const fill = i%2===0 ? C.white : C.g_pale;
      rows.push([
        { text:m.part, options:{ bold:true, color:C.g_dark, fontFace:'나눔고딕', fontSize:11, fill } },
        { text:m.spec, options:{ color:C.charcoal, fontFace:'나눔고딕', fontSize:11, fill } },
        { text:m.std,  options:{ color:C.charcoal, fontFace:'나눔고딕', fontSize:11, align:'center', fill } },
        { text:m.note, options:{ color:C.dgray, fontFace:'나눔고딕', fontSize:10, italic:true, fill } },
      ]);
    });
    s.addTable(rows, {
      x:0.65, y:1.42, w:12.0,
      rowH:0.57,
      colW:[1.9, 4.7, 2.2, 3.2],
      border:{ type:'solid', color:C.gray2, pt:0.5 },
      fill:C.white,
      autoPage:false,
      headerRowCnt:1,
    });
    addFooter(s, 10);
  }

  // ── 공사 일정 (엑셀 공사일정표 원본 그대로) ──────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '09  공사 일정', 'Construction Schedule  |  2026. 03. 23 ~ 04. 11  (약 20일)');

    // ─ 셀 스타일 헬퍼 ─
    const DH = (t, sun) => ({  // 날짜 헤더
      text: t,
      options: { bold:true, color:'FFFFFF', fill: sun ? '888888' : C.g_dark,
                 fontSize:9, align:'center', valign:'middle', fontFace:'나눔고딕' }
    });
    const TC = (t, even) => ({  // 작업 셀
      text: t,
      options: { color: t ? C.g_dark : C.dgray,
                 fill: even ? C.white : C.g_pale,
                 fontSize: 8.5, align:'center', valign:'middle',
                 fontFace:'나눔고딕', lineSpacingMultiple:1.25, bold: !!t }
    });
    const SN = (t) => ({  // 일요일 셀
      text: t,
      options: { color:C.dgray, fill:'EBEBEB',
                 fontSize:8.5, align:'center', valign:'middle', fontFace:'나눔고딕' }
    });

    // ─ 표 데이터 (엑셀 원본 3주 구성) ─
    const tbl = [
      // 1주차 날짜 헤더 (3/22~3/28)
      [DH('3/22\n(일)',true), DH('3/23\n(월)'), DH('3/24\n(화)'), DH('3/25\n(수)'), DH('3/26\n(목)'), DH('3/27\n(금)'), DH('3/28\n(토)')],
      // 1주차 작업 row 1
      [SN(''), TC('집기류이전\n및 철거',true), TC('전기작업',true), TC('바닥수평\n(방통)작업',true), TC('바닥수평\n(양생)작업',true), TC('바닥수평\n(양생)작업',true), TC('경량벽체작업',true)],
      // 1주차 작업 row 2
      [SN(''), TC('전기작업',false), TC('냉·난방기\n배관작업',false), TC('',false), TC('',false), TC('경량벽체작업',false), TC('',false)],
      // 1주차 작업 row 3
      [SN(''), TC('',true), TC('',true), TC('',true), TC('',true), TC('전기작업',true), TC('',true)],

      // 2주차 날짜 헤더 (3/29~4/4)
      [DH('3/29\n(일)',true), DH('3/30\n(월)'), DH('3/31\n(화)'), DH('4/1\n(수)'), DH('4/2\n(목)'), DH('4/3\n(금)'), DH('4/4\n(토)')],
      // 2주차 작업 row 1
      [SN(''), TC('목작업',true), TC('목작업',true), TC('목작업',true), TC('목작업',true), TC('목작업',true), TC('수장\n(데코타일)',true)],
      // 2주차 작업 row 2
      [SN(''), TC('방화도어설치',false), TC('전기작업',false), TC('',false), TC('전기작업',false), TC('',false), TC('',false)],

      // 3주차 날짜 헤더 (4/5~4/11)
      [DH('4/5\n(일)',true), DH('4/6\n(월)'), DH('4/7\n(화)'), DH('4/8\n(수)'), DH('4/9\n(목)'), DH('4/10\n(금)'), DH('4/11\n(토)')],
      // 3주차 작업 (4/8 다수 작업 병합)
      [SN(''), TC('인테리어\n필름작업',true), TC('인테리어\n필름작업',true), TC('블라인드/자석게시판\n액자걸이·표지판 시공\n냉난방기설치',true), TC('가구',true), TC('마무리확인',true), TC('입주청소',true)],
    ];

    // rowH 배열: 헤더행 0.44", 작업행 0.50", 마지막 3주차 작업행 0.78"
    const rowH = [0.44, 0.50, 0.50, 0.50, 0.44, 0.50, 0.50, 0.44, 0.78];
    const tableH = rowH.reduce((a,b)=>a+b, 0); // = 4.60"

    s.addTable(tbl, {
      x:0.4, y:1.42, w:12.5,
      rowH,
      colW: Array(7).fill(+(12.5/7).toFixed(2)), // 각 열 ≈1.79"
      border:{ type:'solid', color:C.gray2, pt:0.5 },
      autoPage:false,
    });

    // 하단 요약 정보
    const noteY = 1.42 + tableH + 0.12;
    s.addShape('rect', { x:0.4, y:noteY, w:12.5, h:0.35, fill:{ color:C.g_pale }, line:{ color:C.g_line, width:0.5 } });
    s.addText('착공: 2026년 3월 23일  |  준공: 2026년 4월 11일  |  공기: 약 20일  |  ※ 일정은 발주처와 합의 후 변동될 수 있음', {
      x:0.4, y:noteY, w:12.5, h:0.35,
      fontSize:8.5, color:C.g_dark, align:'center', fontFace:'나눔고딕', valign:'middle',
    });

    addFooter(s, 11);
  }

  // ── 회사 소개 ───────────────────────────────────────────
  {
    const s = pptx.addSlide();
    addBg(s);
    addHeader(s, '10  회사 소개', 'Company Profile');

    // 좌측 로고 패널 (연한 그린 배경)
    s.addShape('rect', { x:0.5, y:1.42, w:4.5, h:5.45,
      fill:{ color:C.g_pale }, line:{ color:C.g_line, width:0.5 } });
    s.addShape('rect', { x:0.5, y:1.42, w:4.5, h:0.06, fill:{ color:C.g_dark } });
    s.addImage({ path:LOGO, x:0.7, y:1.78, w:4.0, h:1.34,
      sizing:{ type:'contain', w:4.0, h:1.34 } });
    s.addShape('rect', { x:1.3, y:3.9, w:2.9, h:0.05, fill:{ color:C.gold } });
    ['사무실 인테리어 전문','경남권 최다 레퍼런스','A/S 하자 보증 1년'].forEach((t,i) => {
      s.addText(t, { x:0.6, y:4.08+i*0.52, w:4.3, h:0.48,
        fontSize:11, color:C.g_dark, align:'center', fontFace:'나눔고딕' });
    });

    // 우측 정보
    const infos = [
      ['상 호 명',  CO.name],
      ['대 표 자',  CO.ceo],
      ['설 립 일',  '2023년 07월 06일'],
      ['사업분야',  '건설업 / 실내인테리어'],
      ['사업자번호','168-86-03200'],
      ['전    화',  CO.tel],
      ['이 메 일',  CO.email],
      ['홈페이지',  CO.web],
    ];
    infos.forEach(([k,v], i) => {
      const y = 1.48 + i*0.62;
      s.addShape('rect', { x:5.2, y, w:7.95, h:0.56,
        fill:{ color: i%2===0 ? C.white : C.g_pale } });
      s.addShape('rect', { x:5.2, y:y+0.15, w:0.1, h:0.28, fill:{ color:C.g_dark } });
      s.addText(k, { x:5.38, y:y+0.07, w:2.0, h:0.42,
        fontSize:10.5, bold:true, color:C.g_dark, fontFace:'나눔고딕' });
      s.addText(v, { x:7.42, y:y+0.07, w:5.6, h:0.42,
        fontSize:10.5, color:C.charcoal, fontFace:'나눔고딕' });
    });
    addFooter(s, 12);
  }

  // ── 마감 ────────────────────────────────────────────────
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
    fileName:'C:/Users/Administrator/Desktop/JM_클로드/린데코리아/01_디자인제안서_린데코리아_v7.pptx'
  });
  console.log('✅ 디자인 제안서 완성!');
}

makeProposal().catch(e => { console.error(e.message); console.error(e.stack); });

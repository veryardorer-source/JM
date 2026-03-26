import { useState, useCallback } from 'react';

// ─── UID generator ─────────────────────────────────────────────────────────────
let _uid = 0;
const uid = () => String(++_uid);

// ─── 업종별 기본 공종 ─────────────────────────────────────────────────────────
const TYPE_DEFAULTS = {
  미용실: ['가설', '철거', '설비', '목작업', '전기통신', '타일', '도장', '필름', '가구'],
  네일샵: ['가설', '설비', '목작업', '전기통신', '소방', '도배', '바닥', '필름', '가구'],
  학원: ['가설', '목작업', '전기통신', '소방', '도배', '바닥', '필름', '금속창호', '가구'],
  사무실: ['가설', '철거', '목작업', '전기통신', '소방', '도배', '바닥', '필름', '금속창호', '가구'],
  병원: ['가설', '설비', '목작업', '전기통신', '타일', '소방', '도배', '바닥', '금속창호', '가구'],
  카페: ['가설', '철거', '설비', '목작업', '전기통신', '타일', '도장', '소방', '금속창호', '가구'],
  기타: ['가설', '목작업', '전기통신'],
};

// 전체 공종 순서
const ALL_TRADES = ['가설', '철거', '설비', '목작업', '전기통신', '소방', '타일', '도장', '도배', '바닥', '필름', '금속창호', '가구', '블라인드'];

// ─── 공종별 항목 템플릿 ────────────────────────────────────────────────────────
// matUnit: 재료비단가, labUnit: 노무비단가, expUnit: 경비단가
// autoQty: function(area) => number | '' (빈문자열이면 사용자 입력)
function makeTemplates(area) {
  const a = Number(area) || 0;
  const c = Math.ceil;

  return {
    가설: [
      { name: '먹메김및보양', spec: '', unit: 'M2', autoQty: a, matUnit: 0, labUnit: 0, expUnit: 0 },
      { name: '폐기물처리', spec: '', unit: '식', autoQty: 1, matUnit: 0, labUnit: 0, expUnit: a > 60 ? 400000 : 300000 },
      { name: '현장정리및정돈', spec: '', unit: 'M2', autoQty: a, matUnit: 0, labUnit: 0, expUnit: 0 },
      { name: '준공청소', spec: '', unit: 'M2', autoQty: a, matUnit: 0, labUnit: 0, expUnit: 0 },
    ],
    철거: [
      { name: '폐기물 1톤트럭', spec: '', unit: '대', autoQty: c(a / 40), matUnit: 0, labUnit: 0, expUnit: 300000 },
      { name: '부자재 마대글라인더날외', spec: '', unit: '식', autoQty: 1, matUnit: 150000, labUnit: 0, expUnit: 0 },
      { name: '노무비', spec: '', unit: '인', autoQty: c(a / 13), matUnit: 0, labUnit: 280000, expUnit: 20000 },
    ],
    설비: [
      { name: '탑볼세면대', spec: '', unit: 'EA', autoQty: '', matUnit: 135000, labUnit: 0, expUnit: 0 },
      { name: '수전', spec: '', unit: 'EA', autoQty: '', matUnit: 60000, labUnit: 0, expUnit: 0 },
      { name: '전기온수기 50L', spec: '', unit: 'EA', autoQty: '', matUnit: 260000, labUnit: 0, expUnit: 0 },
      { name: 'PB배관 15A*6000/보온재형', spec: '', unit: 'EA', autoQty: 10, matUnit: 10500, labUnit: 0, expUnit: 0 },
      { name: 'PB부속 앵글밸브/낫뿔외', spec: '', unit: '식', autoQty: 1, matUnit: 100000, labUnit: 0, expUnit: 0 },
      { name: 'PVC배관 VG-2/4000*50Ø', spec: '', unit: 'EA', autoQty: 3, matUnit: 8000, labUnit: 0, expUnit: 0 },
      { name: 'PVC부속 엘보/정티/본드외', spec: '', unit: '식', autoQty: 1, matUnit: 100000, labUnit: 0, expUnit: 0 },
      { name: '부자재', spec: '', unit: '식', autoQty: 1, matUnit: 50000, labUnit: 0, expUnit: 0 },
      { name: '노무비', spec: '', unit: '인', autoQty: 3, matUnit: 0, labUnit: 280000, expUnit: 20000 },
    ],
    목작업: [
      { name: '각재 2700*28*28', spec: '', unit: 'EA', autoQty: c(a * 0.3), matUnit: 39000, labUnit: 0, expUnit: 0 },
      { name: '석고보드 900*1800*9.5T', spec: '', unit: 'EA', autoQty: c(a * 3.2), matUnit: 4300, labUnit: 0, expUnit: 0 },
      { name: 'M.D.F 1220*2440*9T', spec: '', unit: 'EA', autoQty: c(a * 0.1), matUnit: 11000, labUnit: 0, expUnit: 0 },
      { name: '합판 1220*2440*4.6T', spec: '', unit: 'EA', autoQty: c(a * 0.15), matUnit: 9000, labUnit: 0, expUnit: 0 },
      { name: '합판 1220*2440*8.5T', spec: '', unit: 'EA', autoQty: c(a * 0.05), matUnit: 14500, labUnit: 0, expUnit: 0 },
      { name: '합판 1220*2440*14.5T', spec: '', unit: 'EA', autoQty: '', matUnit: 28000, labUnit: 0, expUnit: 0 },
      { name: '랩핑평판 60*2440*9T/기본색', spec: '', unit: 'EA', autoQty: '', matUnit: 3400, labUnit: 0, expUnit: 0 },
      { name: '템바보드 990*2440*12T/우드', spec: '', unit: 'EA', autoQty: '', matUnit: 185000, labUnit: 0, expUnit: 0 },
      { name: 'ABS타공도어 900*2100*110바/비방염', spec: '', unit: 'SET', autoQty: '', matUnit: 300000, labUnit: 0, expUnit: 0 },
      { name: '부자재 본드/철물/실리콘외', spec: '', unit: '식', autoQty: 1, matUnit: 350000, labUnit: 0, expUnit: 0 },
      { name: '자재소운반', spec: '', unit: '식', autoQty: 1, matUnit: 0, labUnit: 0, expUnit: 200000 },
      { name: '장비대 목공구', spec: '', unit: '식', autoQty: 1, matUnit: 150000, labUnit: 0, expUnit: 0 },
      { name: '노무비', spec: '', unit: '인', autoQty: c(a / 4.5), matUnit: 0, labUnit: 300000, expUnit: 20000 },
    ],
    전기통신: [
      { name: 'UTP CAT5', spec: '', unit: 'M', autoQty: c(a * 1.5), matUnit: 850, labUnit: 0, expUnit: 0 },
      { name: '전선 HIV2.5SQ', spec: '', unit: 'M', autoQty: c(a * 15), matUnit: 700, labUnit: 0, expUnit: 0 },
      { name: '난연CD관 16MM', spec: '', unit: 'M', autoQty: c(a * 8), matUnit: 350, labUnit: 0, expUnit: 0 },
      { name: '전열기구 콘센트/스위치외', spec: '', unit: '식', autoQty: 1, matUnit: 150000, labUnit: 0, expUnit: 0 },
      { name: '레일 4M', spec: '', unit: 'EA', autoQty: '', matUnit: 12000, labUnit: 0, expUnit: 0 },
      { name: '조명기구 레일등/주백색', spec: '', unit: 'EA', autoQty: '', matUnit: 15000, labUnit: 0, expUnit: 0 },
      { name: '조명기구 라인조명T7/주광색1200', spec: '', unit: 'EA', autoQty: '', matUnit: 9500, labUnit: 0, expUnit: 0 },
      { name: '조명기구 평판등1200*300/주광색', spec: '', unit: 'EA', autoQty: '', matUnit: 38000, labUnit: 0, expUnit: 0 },
      { name: '조명기구 3인치/주광색', spec: '', unit: 'EA', autoQty: '', matUnit: 4200, labUnit: 0, expUnit: 0 },
      { name: '분전함', spec: '', unit: '식', autoQty: '', matUnit: 400000, labUnit: 0, expUnit: 0 },
      { name: '부자재 절연테잎/커넥터/앙카외', spec: '', unit: '식', autoQty: 1, matUnit: 300000, labUnit: 0, expUnit: 0 },
      { name: '노무비', spec: '', unit: '인', autoQty: c(a / 8), matUnit: 0, labUnit: 300000, expUnit: 20000 },
    ],
    소방: [
      { name: '전선 HIV1.5SQ', spec: '', unit: 'M', autoQty: c(a * 2), matUnit: 350, labUnit: 0, expUnit: 0 },
      { name: '감지기', spec: '', unit: 'EA', autoQty: c(a / 60), matUnit: 6000, labUnit: 0, expUnit: 0 },
      { name: '피난유도등', spec: '', unit: 'EA', autoQty: c(a / 50), matUnit: 22000, labUnit: 0, expUnit: 0 },
      { name: 'S/P헤드', spec: '', unit: 'EA', autoQty: c(a / 9), matUnit: 6500, labUnit: 0, expUnit: 0 },
      { name: 'S/P조인트 3M', spec: '', unit: 'EA', autoQty: c(a / 9), matUnit: 18000, labUnit: 0, expUnit: 0 },
      { name: 'S/P조인트고정대', spec: '', unit: 'SET', autoQty: c(a / 9), matUnit: 5000, labUnit: 0, expUnit: 0 },
      { name: '부자재', spec: '', unit: '식', autoQty: 1, matUnit: 50000, labUnit: 0, expUnit: 0 },
      { name: '노무비', spec: '', unit: '인', autoQty: 2, matUnit: 0, labUnit: 250000, expUnit: 20000 },
    ],
    타일: [
      { name: '바닥타일 600*600/포쉐린', spec: '', unit: 'BOX', autoQty: '', matUnit: 35000, labUnit: 0, expUnit: 0 },
      { name: '압착시멘트 20KG', spec: '', unit: 'EA', autoQty: '', matUnit: 5800, labUnit: 0, expUnit: 0 },
      { name: '백시멘트 20KG', spec: '', unit: 'EA', autoQty: '', matUnit: 6000, labUnit: 0, expUnit: 0 },
      { name: '벽타일 300*600', spec: '', unit: 'BOX', autoQty: '', matUnit: 25000, labUnit: 0, expUnit: 0 },
      { name: '세라픽스 17KG', spec: '', unit: 'EA', autoQty: '', matUnit: 17500, labUnit: 0, expUnit: 0 },
      { name: '데코타일 450*450*3T', spec: '홀', unit: 'BOX', autoQty: '', matUnit: 30000, labUnit: 0, expUnit: 0 },
      { name: '본드 17KG', spec: '', unit: 'EA', autoQty: '', matUnit: 35000, labUnit: 0, expUnit: 0 },
      { name: '부자재 평판클립/코너비드외', spec: '', unit: '식', autoQty: 1, matUnit: 200000, labUnit: 0, expUnit: 0 },
      { name: '자재소운반', spec: '', unit: '식', autoQty: 1, matUnit: 0, labUnit: 0, expUnit: 200000 },
      { name: '노무비', spec: '', unit: '인', autoQty: '', matUnit: 0, labUnit: 300000, expUnit: 20000 },
    ],
    도장: [
      { name: '핸디코티', spec: '', unit: 'M2', autoQty: c(a * 2.5), matUnit: 6000, labUnit: 0, expUnit: 0 },
      { name: '퍼티', spec: '', unit: 'EA', autoQty: c(a / 20), matUnit: 32000, labUnit: 0, expUnit: 0 },
      { name: '워스볼', spec: '', unit: 'EA', autoQty: c(a / 25), matUnit: 45000, labUnit: 0, expUnit: 0 },
      { name: '페인트 수성페인트', spec: '', unit: 'EA', autoQty: c(a / 15), matUnit: 120000, labUnit: 0, expUnit: 0 },
      { name: '부자재', spec: '', unit: '식', autoQty: 1, matUnit: 300000, labUnit: 0, expUnit: 0 },
      { name: '노무비', spec: '', unit: '인', autoQty: c(a / 12), matUnit: 0, labUnit: 300000, expUnit: 20000 },
    ],
    도배: [
      { name: '천정벽지 장폭합지', spec: '', unit: 'EA', autoQty: c(a / 6), matUnit: 25000, labUnit: 0, expUnit: 0 },
      { name: '벽지 실크벽지/비방염', spec: '', unit: 'EA', autoQty: c(a / 3.5), matUnit: 35000, labUnit: 0, expUnit: 0 },
      { name: '부자재', spec: '', unit: '식', autoQty: 1, matUnit: 300000, labUnit: 0, expUnit: 0 },
      { name: '노무비', spec: '', unit: '인', autoQty: c(a / 13), matUnit: 0, labUnit: 280000, expUnit: 20000 },
    ],
    바닥: [
      { name: '데코타일 450*450*3T', spec: '', unit: 'BOX', autoQty: c(a / 4), matUnit: 30000, labUnit: 0, expUnit: 0 },
      { name: '본드 10KG', spec: '', unit: 'EA', autoQty: c(a / 20), matUnit: 35000, labUnit: 0, expUnit: 0 },
      { name: '부자재', spec: '', unit: '식', autoQty: 1, matUnit: 100000, labUnit: 0, expUnit: 0 },
      { name: '자재소운반', spec: '', unit: '식', autoQty: 1, matUnit: 0, labUnit: 0, expUnit: 100000 },
      { name: '노무비', spec: '', unit: '인', autoQty: c(a / 20), matUnit: 0, labUnit: 280000, expUnit: 20000 },
    ],
    필름: [
      { name: '인테리어필름 1000*1200/비방염', spec: '', unit: 'M', autoQty: '', matUnit: 11000, labUnit: 0, expUnit: 0 },
      { name: '부자재 프라이머/실리콘외', spec: '', unit: '식', autoQty: 1, matUnit: 100000, labUnit: 0, expUnit: 0 },
      { name: '노무비', spec: '', unit: '인', autoQty: 1, matUnit: 0, labUnit: 300000, expUnit: 20000 },
    ],
    금속창호: [
      { name: '10T상하가네도어', spec: '', unit: 'EA', autoQty: '', matUnit: 220000, labUnit: 0, expUnit: 0 },
      { name: 'NF힌지', spec: '', unit: 'EA', autoQty: '', matUnit: 170000, labUnit: 0, expUnit: 0 },
      { name: '손잡이', spec: '', unit: 'EA', autoQty: '', matUnit: 45000, labUnit: 0, expUnit: 0 },
      { name: '도어남마/면치기', spec: '', unit: 'EA', autoQty: '', matUnit: 50000, labUnit: 0, expUnit: 0 },
      { name: 'T자가네', spec: '', unit: 'EA', autoQty: '', matUnit: 55000, labUnit: 0, expUnit: 0 },
      { name: '1자가네', spec: '', unit: 'EA', autoQty: '', matUnit: 25000, labUnit: 0, expUnit: 0 },
      { name: '픽스유리 투명강화', spec: '', unit: '식', autoQty: '', matUnit: 180000, labUnit: 0, expUnit: 0 },
      { name: '갈바프레임', spec: '', unit: '식', autoQty: '', matUnit: 350000, labUnit: 0, expUnit: 0 },
      { name: '유리칠판', spec: '', unit: '식', autoQty: '', matUnit: 300000, labUnit: 0, expUnit: 0 },
      { name: '부자재', spec: '', unit: '식', autoQty: 1, matUnit: 150000, labUnit: 0, expUnit: 0 },
      { name: '노무비', spec: '', unit: '인', autoQty: '', matUnit: 0, labUnit: 300000, expUnit: 15000 },
    ],
    가구: [
      { name: '카운터 맞춤', spec: '', unit: 'EA', autoQty: '', matUnit: 0, labUnit: 0, expUnit: 0 },
      { name: '상부장 맞춤', spec: '', unit: 'EA', autoQty: '', matUnit: 0, labUnit: 0, expUnit: 0 },
      { name: '하부장 맞춤', spec: '', unit: 'EA', autoQty: '', matUnit: 0, labUnit: 0, expUnit: 0 },
      { name: '셀프바 맞춤', spec: '', unit: 'EA', autoQty: '', matUnit: 0, labUnit: 0, expUnit: 0 },
      { name: '옷장 맞춤', spec: '', unit: 'EA', autoQty: '', matUnit: 0, labUnit: 0, expUnit: 0 },
      { name: '경대선반 맞춤', spec: '', unit: 'EA', autoQty: '', matUnit: 0, labUnit: 0, expUnit: 0 },
      { name: '책장 맞춤', spec: '', unit: 'EA', autoQty: '', matUnit: 0, labUnit: 0, expUnit: 0 },
    ],
    블라인드: [
      { name: '우드블라인드 오동나무', spec: '', unit: 'EA', autoQty: '', matUnit: 170000, labUnit: 0, expUnit: 0 },
      { name: '노무비', spec: '', unit: '인', autoQty: 1, matUnit: 0, labUnit: 100000, expUnit: 0 },
    ],
  };
}

// 템플릿 항목을 실제 행 객체로 변환
function buildItems(tradeKey, area) {
  const templates = makeTemplates(area);
  const tplList = templates[tradeKey] || [];
  return tplList.map(tpl => ({
    id: uid(),
    name: tpl.name,
    spec: tpl.spec || '',
    unit: tpl.unit,
    autoQty: tpl.autoQty,           // 추천수량 (표시용)
    qty: tpl.autoQty !== '' ? String(tpl.autoQty) : '',  // 사용자 입력 (초기값)
    matUnit: tpl.matUnit,
    labUnit: tpl.labUnit,
    expUnit: tpl.expUnit,
    checked: tpl.autoQty !== '',    // autoQty 있으면 기본 체크
  }));
}

// ─── 계산 유틸 ─────────────────────────────────────────────────────────────────
function calcRow(item) {
  if (!item.checked) return { mat: 0, lab: 0, exp: 0 };
  const q = Number(item.qty) || 0;
  return {
    mat: (item.matUnit || 0) * q,
    lab: (item.labUnit || 0) * q,
    exp: (item.expUnit || 0) * q,
  };
}

function calcTrade(items) {
  let mat = 0, lab = 0, exp = 0;
  items.forEach(it => {
    const c = calcRow(it);
    mat += c.mat; lab += c.lab; exp += c.exp;
  });
  return { mat, lab, exp, total: mat + lab + exp };
}

// ─── 단위 목록 ─────────────────────────────────────────────────────────────────
const UNITS = ['EA', 'M', 'M2', 'M3', 'BOX', 'SET', '식', '인', '대', 'KG', 'L', '개'];

// ─── 숫자 포맷 ─────────────────────────────────────────────────────────────────
const fmt = n => n ? Number(n).toLocaleString() : '-';

// ─── 공종 색상 배지 ───────────────────────────────────────────────────────────
const TRADE_COLORS = {
  가설: 'bg-slate-100 text-slate-700 border-slate-300',
  철거: 'bg-red-100 text-red-700 border-red-300',
  설비: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  목작업: 'bg-amber-100 text-amber-700 border-amber-300',
  전기통신: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  소방: 'bg-orange-100 text-orange-700 border-orange-300',
  타일: 'bg-teal-100 text-teal-700 border-teal-300',
  도장: 'bg-purple-100 text-purple-700 border-purple-300',
  도배: 'bg-pink-100 text-pink-700 border-pink-300',
  바닥: 'bg-lime-100 text-lime-700 border-lime-300',
  필름: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  금속창호: 'bg-zinc-100 text-zinc-700 border-zinc-300',
  가구: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  블라인드: 'bg-sky-100 text-sky-700 border-sky-300',
};

// ─── 업종 목록 ────────────────────────────────────────────────────────────────
const TYPE_LIST = [
  { id: '미용실', label: '미용실/바버샵' },
  { id: '네일샵', label: '네일샵/뷰티샵' },
  { id: '학원', label: '학원/교습소' },
  { id: '사무실', label: '사무실/법률사무소' },
  { id: '병원', label: '병원/의원' },
  { id: '카페', label: '카페/식당' },
  { id: '기타', label: '기타' },
];

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────
export default function QuantityPage() {
  // 기본 정보
  const [siteName, setSiteName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [area, setArea] = useState('');
  const [height, setHeight] = useState('2.5');
  const [hasDemolition, setHasDemolition] = useState(false);

  // 선택된 공종
  const [selectedTrades, setSelectedTrades] = useState([]);

  // 공종별 항목 데이터 { tradeKey: items[] }
  const [tradeItems, setTradeItems] = useState({});

  // 아코디언 열린 상태 { tradeKey: bool }
  const [openTrades, setOpenTrades] = useState({});

  // ─── 업종 변경 핸들러 ──────────────────────────────────────────────────
  function handleTypeChange(newTypeId) {
    setTypeId(newTypeId);
    const defaults = TYPE_DEFAULTS[newTypeId] || [];
    setSelectedTrades(defaults);
    // 기존 항목 초기화 (새 업종에 맞게 재생성)
    setTradeItems({});
    setOpenTrades({});
  }

  // ─── 공종 토글 ────────────────────────────────────────────────────────
  function toggleTrade(trade) {
    setSelectedTrades(prev =>
      prev.includes(trade) ? prev.filter(t => t !== trade) : [...prev, trade]
    );
  }

  // ─── 아코디언 열기 (최초 열릴 때 항목 초기화) ─────────────────────────
  function openAccordion(trade) {
    if (!openTrades[trade]) {
      // 최초 열기 → 항목 초기화
      if (!tradeItems[trade]) {
        setTradeItems(prev => ({
          ...prev,
          [trade]: buildItems(trade, area),
        }));
      }
      setOpenTrades(prev => ({ ...prev, [trade]: true }));
    } else {
      setOpenTrades(prev => ({ ...prev, [trade]: false }));
    }
  }

  // ─── 항목 업데이트 ─────────────────────────────────────────────────────
  function updateItem(trade, itemId, fields) {
    setTradeItems(prev => ({
      ...prev,
      [trade]: prev[trade].map(it => it.id === itemId ? { ...it, ...fields } : it),
    }));
  }

  function removeItem(trade, itemId) {
    setTradeItems(prev => ({
      ...prev,
      [trade]: prev[trade].filter(it => it.id !== itemId),
    }));
  }

  function addItem(trade) {
    const newItem = {
      id: uid(),
      name: '',
      spec: '',
      unit: 'EA',
      autoQty: '',
      qty: '',
      matUnit: 0,
      labUnit: 0,
      expUnit: 0,
      checked: true,
    };
    setTradeItems(prev => ({
      ...prev,
      [trade]: [...(prev[trade] || []), newItem],
    }));
  }

  // ─── 요약 계산 ────────────────────────────────────────────────────────
  const summary = ALL_TRADES
    .filter(t => selectedTrades.includes(t) && tradeItems[t])
    .map(t => {
      const items = tradeItems[t] || [];
      const c = calcTrade(items);
      return { trade: t, ...c };
    })
    .filter(s => s.total > 0);

  const totalMat = summary.reduce((s, r) => s + r.mat, 0);
  const totalLab = summary.reduce((s, r) => s + r.lab, 0);
  const totalExp = summary.reduce((s, r) => s + r.exp, 0);
  const grandTotal = totalMat + totalLab + totalExp;

  // ─── 렌더 ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 기본 정보 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">프로젝트 기본 정보</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* 현장명 */}
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 block mb-1">현장명</label>
              <input
                value={siteName}
                onChange={e => setSiteName(e.target.value)}
                placeholder="예: 대상힐스 미용실"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {/* 업종 */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">업종</label>
              <select
                value={typeId}
                onChange={e => handleTypeChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">-- 선택 --</option>
                {TYPE_LIST.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            {/* 면적 */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">면적 (m²)</label>
              <input
                type="number"
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="예: 66"
                min="0"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {/* 층고 */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">층고 (m)</label>
              <input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="2.5"
                step="0.1"
                min="0"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          {/* 철거여부 */}
          <div className="mt-3 flex items-center gap-2">
            <input
              id="demolition"
              type="checkbox"
              checked={hasDemolition}
              onChange={e => setHasDemolition(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="demolition" className="text-sm text-gray-600 cursor-pointer select-none">
              철거 포함
            </label>
            {hasDemolition && !selectedTrades.includes('철거') && (
              <button
                onClick={() => setSelectedTrades(prev => ['가설', '철거', ...prev.filter(t => t !== '가설' && t !== '철거')])}
                className="text-xs text-blue-600 underline"
              >
                철거 공종 추가
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* 공종 선택 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">공종 선택</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_TRADES.map(trade => {
              const selected = selectedTrades.includes(trade);
              return (
                <button
                  key={trade}
                  onClick={() => toggleTrade(trade)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    selected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {trade}
                </button>
              );
            })}
          </div>
          {selectedTrades.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">업종을 선택하면 관련 공종이 자동으로 선택됩니다.</p>
          )}
        </div>

        {/* 공종별 항목 입력 */}
        {ALL_TRADES.filter(t => selectedTrades.includes(t)).map((trade, tradeIdx) => {
          const isOpen = !!openTrades[trade];
          const items = tradeItems[trade] || [];
          const c = calcTrade(items);
          const colorClass = TRADE_COLORS[trade] || 'bg-gray-100 text-gray-700 border-gray-300';

          return (
            <div key={trade} className="bg-white rounded-lg border border-gray-200 mb-3 shadow-sm overflow-hidden">
              {/* 아코디언 헤더 */}
              <button
                onClick={() => openAccordion(trade)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
              >
                <span className="text-xs font-bold text-blue-400 w-5">{tradeIdx + 1}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
                  {trade}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-700">{trade}작업</span>
                {isOpen && c.total > 0 && (
                  <span className="text-xs text-blue-700 font-semibold">
                    소계 {c.total.toLocaleString()}원
                  </span>
                )}
                {!isOpen && (
                  <span className="text-xs text-gray-400">클릭하여 항목 입력</span>
                )}
                <span className="text-gray-400 text-sm ml-1">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="p-3">
                  {/* 테이블 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600">
                          <th className="px-2 py-1.5 w-8 text-center">✓</th>
                          <th className="px-2 py-1.5 text-left min-w-32">품명</th>
                          <th className="px-2 py-1.5 text-left min-w-24">규격</th>
                          <th className="px-2 py-1.5 w-16 text-center">단위</th>
                          <th className="px-2 py-1.5 w-20 text-right text-gray-400">추천수량</th>
                          <th className="px-2 py-1.5 w-20 text-right">수량</th>
                          <th className="px-2 py-1.5 w-24 text-right">재료비단가</th>
                          <th className="px-2 py-1.5 w-24 text-right">노무비단가</th>
                          <th className="px-2 py-1.5 w-24 text-right">경비단가</th>
                          <th className="px-2 py-1.5 w-28 text-right">재료비</th>
                          <th className="px-2 py-1.5 w-28 text-right">노무비</th>
                          <th className="px-2 py-1.5 w-28 text-right">경비</th>
                          <th className="px-2 py-1.5 w-28 text-right font-bold text-blue-700">합계</th>
                          <th className="px-2 py-1.5 w-7"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => {
                          const rc = calcRow(item);
                          const rowTotal = rc.mat + rc.lab + rc.exp;
                          const hasQty = item.qty !== '' && Number(item.qty) > 0;
                          const isEmpty = !hasQty && item.checked;

                          return (
                            <tr
                              key={item.id}
                              className={`border-b border-gray-100 hover:bg-gray-50 ${!item.checked ? 'opacity-40' : ''}`}
                            >
                              {/* 체크박스 */}
                              <td className="px-2 py-1 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={e => updateItem(trade, item.id, { checked: e.target.checked })}
                                  className="w-3.5 h-3.5 accent-blue-600"
                                />
                              </td>
                              {/* 품명 */}
                              <td className="px-1 py-1">
                                <input
                                  value={item.name}
                                  onChange={e => updateItem(trade, item.id, { name: e.target.value })}
                                  className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-400"
                                />
                              </td>
                              {/* 규격 */}
                              <td className="px-1 py-1">
                                <input
                                  value={item.spec}
                                  onChange={e => updateItem(trade, item.id, { spec: e.target.value })}
                                  className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-400"
                                />
                              </td>
                              {/* 단위 */}
                              <td className="px-1 py-1">
                                <select
                                  value={item.unit}
                                  onChange={e => updateItem(trade, item.id, { unit: e.target.value })}
                                  className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-400"
                                >
                                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                              </td>
                              {/* 추천수량 (읽기전용, 회색) */}
                              <td className="px-2 py-1 text-right text-gray-400 tabular-nums">
                                {item.autoQty !== '' ? item.autoQty : <span className="text-gray-300">-</span>}
                              </td>
                              {/* 수량 입력 */}
                              <td className="px-1 py-1">
                                <input
                                  type="number"
                                  value={item.qty}
                                  onChange={e => updateItem(trade, item.id, { qty: e.target.value })}
                                  placeholder={item.autoQty !== '' ? String(item.autoQty) : '0'}
                                  min="0"
                                  className={`w-full text-right px-1.5 py-0.5 border rounded text-xs focus:outline-none tabular-nums ${
                                    isEmpty
                                      ? 'border-orange-300 bg-orange-50 focus:border-orange-500'
                                      : hasQty
                                      ? 'border-green-300 bg-green-50 focus:border-green-500'
                                      : 'border-gray-200 focus:border-blue-400'
                                  }`}
                                />
                              </td>
                              {/* 재료비단가 */}
                              <td className="px-1 py-1">
                                <input
                                  type="number"
                                  value={item.matUnit || ''}
                                  onChange={e => updateItem(trade, item.id, { matUnit: Number(e.target.value) || 0 })}
                                  placeholder="0"
                                  min="0"
                                  className="w-full text-right px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-400 tabular-nums"
                                />
                              </td>
                              {/* 노무비단가 */}
                              <td className="px-1 py-1">
                                <input
                                  type="number"
                                  value={item.labUnit || ''}
                                  onChange={e => updateItem(trade, item.id, { labUnit: Number(e.target.value) || 0 })}
                                  placeholder="0"
                                  min="0"
                                  className="w-full text-right px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-400 tabular-nums"
                                />
                              </td>
                              {/* 경비단가 */}
                              <td className="px-1 py-1">
                                <input
                                  type="number"
                                  value={item.expUnit || ''}
                                  onChange={e => updateItem(trade, item.id, { expUnit: Number(e.target.value) || 0 })}
                                  placeholder="0"
                                  min="0"
                                  className="w-full text-right px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-400 tabular-nums"
                                />
                              </td>
                              {/* 재료비 금액 */}
                              <td className="px-2 py-1 text-right text-gray-700 bg-gray-50 tabular-nums">
                                {rc.mat ? rc.mat.toLocaleString() : <span className="text-gray-300">-</span>}
                              </td>
                              {/* 노무비 금액 */}
                              <td className="px-2 py-1 text-right text-gray-700 bg-gray-50 tabular-nums">
                                {rc.lab ? rc.lab.toLocaleString() : <span className="text-gray-300">-</span>}
                              </td>
                              {/* 경비 금액 */}
                              <td className="px-2 py-1 text-right text-gray-700 bg-gray-50 tabular-nums">
                                {rc.exp ? rc.exp.toLocaleString() : <span className="text-gray-300">-</span>}
                              </td>
                              {/* 합계 */}
                              <td className={`px-2 py-1 text-right font-medium tabular-nums ${rowTotal ? 'text-blue-700 bg-blue-50' : 'text-gray-300 bg-gray-50'}`}>
                                {rowTotal ? rowTotal.toLocaleString() : '-'}
                              </td>
                              {/* 삭제 */}
                              <td className="px-1 py-1 text-center">
                                <button
                                  onClick={() => removeItem(trade, item.id)}
                                  className="text-red-300 hover:text-red-600 text-sm leading-none"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* 소계 행 */}
                      {items.length > 0 && (
                        <tfoot>
                          <tr className="bg-blue-50 border-t-2 border-blue-200 text-xs font-semibold">
                            <td colSpan={9} className="px-2 py-1.5 text-right text-gray-600">[소  계]</td>
                            <td className="px-2 py-1.5 text-right text-gray-700 tabular-nums">{c.mat ? c.mat.toLocaleString() : '-'}</td>
                            <td className="px-2 py-1.5 text-right text-gray-700 tabular-nums">{c.lab ? c.lab.toLocaleString() : '-'}</td>
                            <td className="px-2 py-1.5 text-right text-gray-700 tabular-nums">{c.exp ? c.exp.toLocaleString() : '-'}</td>
                            <td className="px-2 py-1.5 text-right text-blue-700 tabular-nums">{c.total ? c.total.toLocaleString() : '-'}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* 항목 추가 버튼 */}
                  <button
                    onClick={() => addItem(trade)}
                    className="mt-2 text-xs text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded"
                  >
                    + 항목 추가
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* 하단 요약 */}
        {summary.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mt-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">공종별 합계 요약</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-xs text-gray-600">
                    <th className="px-3 py-2 text-left">공종</th>
                    <th className="px-3 py-2 text-right">재료비</th>
                    <th className="px-3 py-2 text-right">노무비</th>
                    <th className="px-3 py-2 text-right">경비</th>
                    <th className="px-3 py-2 text-right font-bold">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row, i) => (
                    <tr key={row.trade} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                      <td className="px-3 py-1.5">
                        <span className={`px-2 py-0.5 rounded text-xs border ${TRADE_COLORS[row.trade] || ''}`}>
                          {row.trade}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-700 tabular-nums">{row.mat ? row.mat.toLocaleString() : '-'}</td>
                      <td className="px-3 py-1.5 text-right text-gray-700 tabular-nums">{row.lab ? row.lab.toLocaleString() : '-'}</td>
                      <td className="px-3 py-1.5 text-right text-gray-700 tabular-nums">{row.exp ? row.exp.toLocaleString() : '-'}</td>
                      <td className="px-3 py-1.5 text-right font-semibold text-blue-700 tabular-nums">{row.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 border-t-2 border-blue-300">
                    <td className="px-3 py-2 font-bold text-gray-800">합  계</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800 tabular-nums">{totalMat.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800 tabular-nums">{totalLab.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800 tabular-nums">{totalExp.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-bold text-lg text-blue-800 tabular-nums">{grandTotal.toLocaleString()} 원</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {selectedTrades.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📐</div>
            <p className="text-lg">공종을 선택하여 물량을 산출하세요</p>
            <p className="text-sm mt-1">상단에서 업종을 선택하면 관련 공종이 자동으로 설정됩니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

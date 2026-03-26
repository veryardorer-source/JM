import { useState, useEffect } from 'react';

const STORAGE_KEY = 'jm_estimates';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 전역 상태
let _estimates = loadData();
let _listeners = [];

function notify() {
  saveData(_estimates);
  _listeners.forEach(fn => fn());
}

export function useEstimates() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const fn = () => forceUpdate(n => n + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  }, []);
  return _estimates;
}

export function getEstimate(id) {
  return _estimates.find(e => e.id === id);
}

export function createEstimate(data) {
  const est = {
    id: genId(),
    title: data.title || '새 견적서',
    recipient: data.recipient || '',
    date: data.date || new Date().toISOString().slice(0, 10),
    projectName: data.projectName || '',
    discount: 0,
    vatEnabled: true,
    sections: [],
  };
  _estimates = [est, ..._estimates];
  notify();
  return est.id;
}

export function updateEstimate(id, fields) {
  _estimates = _estimates.map(e => e.id === id ? { ...e, ...fields } : e);
  notify();
}

export function deleteEstimate(id) {
  _estimates = _estimates.filter(e => e.id !== id);
  notify();
}

// 공종 추가 (템플릿 기반)
export function addSection(estimateId, template) {
  const section = {
    id: genId(),
    name: template.name,
    subSections: template.subSections.map(ss => ({
      id: genId(),
      name: ss.name,
      items: ss.items.map(item => ({ id: genId(), qty: 1, ...item })),
    })),
    items: template.items.map(item => ({ id: genId(), qty: 1, ...item })),
  };
  _estimates = _estimates.map(e =>
    e.id === estimateId ? { ...e, sections: [...e.sections, section] } : e
  );
  notify();
}

export function updateSection(estimateId, sectionId, name) {
  _estimates = _estimates.map(e => {
    if (e.id !== estimateId) return e;
    return {
      ...e,
      sections: e.sections.map(s => s.id === sectionId ? { ...s, name } : s),
    };
  });
  notify();
}

export function removeSection(estimateId, sectionId) {
  _estimates = _estimates.map(e => {
    if (e.id !== estimateId) return e;
    return { ...e, sections: e.sections.filter(s => s.id !== sectionId) };
  });
  notify();
}

// 하위구역
export function addSubSection(estimateId, sectionId, name) {
  const ss = { id: genId(), name, items: [] };
  _estimates = _estimates.map(e => {
    if (e.id !== estimateId) return e;
    return {
      ...e,
      sections: e.sections.map(s =>
        s.id === sectionId ? { ...s, subSections: [...s.subSections, ss] } : s
      ),
    };
  });
  notify();
}

export function updateSubSection(estimateId, sectionId, ssId, name) {
  _estimates = _estimates.map(e => {
    if (e.id !== estimateId) return e;
    return {
      ...e,
      sections: e.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subSections: s.subSections.map(ss => ss.id === ssId ? { ...ss, name } : ss),
        };
      }),
    };
  });
  notify();
}

export function removeSubSection(estimateId, sectionId, ssId) {
  _estimates = _estimates.map(e => {
    if (e.id !== estimateId) return e;
    return {
      ...e,
      sections: e.sections.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, subSections: s.subSections.filter(ss => ss.id !== ssId) };
      }),
    };
  });
  notify();
}

// 항목 (공종 직속)
export function addItem(estimateId, sectionId) {
  const item = { id: genId(), name: '', spec: '', unit: 'EA', qty: 1, materialUnit: 0, laborUnit: 0, expenseUnit: 0, note: '' };
  _estimates = _estimates.map(e => {
    if (e.id !== estimateId) return e;
    return {
      ...e,
      sections: e.sections.map(s =>
        s.id === sectionId ? { ...s, items: [...s.items, item] } : s
      ),
    };
  });
  notify();
}

export function updateItem(estimateId, sectionId, itemId, fields) {
  _estimates = _estimates.map(e => {
    if (e.id !== estimateId) return e;
    return {
      ...e,
      sections: e.sections.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, items: s.items.map(it => it.id === itemId ? { ...it, ...fields } : it) };
      }),
    };
  });
  notify();
}

export function removeItem(estimateId, sectionId, itemId) {
  _estimates = _estimates.map(e => {
    if (e.id !== estimateId) return e;
    return {
      ...e,
      sections: e.sections.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, items: s.items.filter(it => it.id !== itemId) };
      }),
    };
  });
  notify();
}

// 항목 (하위구역 소속)
export function addSubItem(estimateId, sectionId, ssId) {
  const item = { id: genId(), name: '', spec: '', unit: 'EA', qty: 1, materialUnit: 0, laborUnit: 0, expenseUnit: 0, note: '' };
  _estimates = _estimates.map(e => {
    if (e.id !== estimateId) return e;
    return {
      ...e,
      sections: e.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subSections: s.subSections.map(ss =>
            ss.id === ssId ? { ...ss, items: [...ss.items, item] } : ss
          ),
        };
      }),
    };
  });
  notify();
}

export function updateSubItem(estimateId, sectionId, ssId, itemId, fields) {
  _estimates = _estimates.map(e => {
    if (e.id !== estimateId) return e;
    return {
      ...e,
      sections: e.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subSections: s.subSections.map(ss => {
            if (ss.id !== ssId) return ss;
            return { ...ss, items: ss.items.map(it => it.id === itemId ? { ...it, ...fields } : it) };
          }),
        };
      }),
    };
  });
  notify();
}

export function removeSubItem(estimateId, sectionId, ssId, itemId) {
  _estimates = _estimates.map(e => {
    if (e.id !== estimateId) return e;
    return {
      ...e,
      sections: e.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subSections: s.subSections.map(ss => {
            if (ss.id !== ssId) return ss;
            return { ...ss, items: ss.items.filter(it => it.id !== itemId) };
          }),
        };
      }),
    };
  });
  notify();
}

// 계산 유틸
export function calcItem(item) {
  const qty = Number(item.qty) || 0;
  const mat = (Number(item.materialUnit) || 0) * qty;
  const lab = (Number(item.laborUnit) || 0) * qty;
  const exp = (Number(item.expenseUnit) || 0) * qty;
  return { mat, lab, exp, total: mat + lab + exp };
}

export function calcSection(section) {
  let mat = 0, lab = 0, exp = 0;
  section.items.forEach(it => {
    const c = calcItem(it);
    mat += c.mat; lab += c.lab; exp += c.exp;
  });
  section.subSections.forEach(ss => {
    ss.items.forEach(it => {
      const c = calcItem(it);
      mat += c.mat; lab += c.lab; exp += c.exp;
    });
  });
  return { mat, lab, exp, total: mat + lab + exp };
}

export function calcEstimate(estimate) {
  let totalMat = 0, totalLab = 0, totalExp = 0;
  estimate.sections.forEach(s => {
    const c = calcSection(s);
    totalMat += c.mat; totalLab += c.lab; totalExp += c.exp;
  });
  const directTotal = totalMat + totalLab + totalExp;
  const employment = Math.round(directTotal * 0.0101);
  const industrial = Math.round(directTotal * 0.0356);
  const management = Math.round(directTotal * 0.05);
  const profit = Math.round(directTotal * 0.10);
  const indirectTotal = employment + industrial + management + profit;
  const constructionTotal = Math.floor((directTotal + indirectTotal) / 1000) * 1000;
  const discount = Number(estimate.discount) || 0;
  const afterDiscount = constructionTotal - discount;
  const vat = estimate.vatEnabled ? Math.round(afterDiscount * 0.1) : 0;
  const grandTotal = afterDiscount + vat;
  return {
    totalMat, totalLab, totalExp, directTotal,
    employment, industrial, management, profit, indirectTotal,
    constructionTotal, discount, afterDiscount, vat, grandTotal,
  };
}

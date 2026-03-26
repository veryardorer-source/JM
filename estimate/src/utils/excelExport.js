import * as XLSX from 'xlsx';
import { calcItem, calcSection, calcEstimate } from '../store/useStore';

function won(n) {
  return Math.round(n || 0).toLocaleString('ko-KR');
}

export function exportToExcel(estimate) {
  const wb = XLSX.utils.book_new();
  const calc = calcEstimate(estimate);

  // ── 시트1: 내역서 요약 ──
  const summaryRows = [
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '내  역  서', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['수  신', `: ${estimate.recipient} 귀하`, '', '', '', '', '', '', ''],
    ['작  성  일', `: ${estimate.date.replace(/-/g, '년 ').replace(/-/, '월 ')}일`, '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['공  사  명', `: ${estimate.projectName}`, '', '', '', '', '', '', ''],
    ['계  약  금  액', `: ${won(calc.grandTotal)}원`, '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['아래와 같이 견적합니다.', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['품  명', '규  격', '수  량', '단위', '재  료  비', '노  무  비', '경  비', '합  계', '비  고'],
    ['순 공 사 비', '', 1, '식', won(calc.totalMat), won(calc.totalLab), won(calc.totalExp), won(calc.directTotal), ''],
    ['', '', '', '', '', '', '', '', ''],
    ['직 접 공 사 비 계', '', '', '', won(calc.totalMat), won(calc.totalLab), won(calc.totalExp), won(calc.directTotal), ''],
    ['고용보험', '1.01%', '', '', '', '', '', won(calc.employment), ''],
    ['산재보험', '3.56%', '', '', '', '', '', won(calc.industrial), ''],
    ['일반관리비', '5%', '', '', '', '', '', won(calc.management), ''],
    ['이윤', '10%', '', '', '', '', '', won(calc.profit), ''],
    ['단수정리', '', '', '', '', '', '', '천단위절사', ''],
    ['간 접 공 사 비 계', '', '', '', '', '', '', won(calc.indirectTotal), ''],
    ['총 공 사 비', '', '', '', '', '', '', won(calc.constructionTotal), ''],
    ['D/C', '', '', '', '', '', '', calc.discount ? `-${won(calc.discount)}` : '-', ''],
    ['총 공 사 비', '', '', '', '', '', '', won(calc.afterDiscount), ''],
    ['부 가 세', '10%', '', '', '', '', '', won(calc.vat), ''],
    ['[ 합  계 ]', '', '', '', '', '', '', won(calc.grandTotal), ''],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws1['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 6 }, { wch: 5 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws1, '내역서');

  // ── 시트2: 공종별 집계표 ──
  const aggRows = [
    ['', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '공  종  별  집  계  표', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '품  명', '규  격', '단위', '수량', '재료비 단가', '재료비 금액', '노무비 단가', '노무비 금액', '경비 단가', '경비 금액', '합계 단가', '합계 금액'],
  ];
  estimate.sections.forEach((s, i) => {
    const c = calcSection(s);
    aggRows.push([
      i + 1,
      s.name,
      '',
      '식',
      1,
      won(c.mat), won(c.mat),
      won(c.lab), won(c.lab),
      won(c.exp), won(c.exp),
      won(c.total), won(c.total),
    ]);
  });
  aggRows.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
  aggRows.push([
    '', '합  계', '', '', '',
    '', won(calc.totalMat),
    '', won(calc.totalLab),
    '', won(calc.totalExp),
    '', won(calc.directTotal),
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet(aggRows);
  ws2['!cols'] = [{ wch: 4 }, { wch: 14 }, { wch: 10 }, { wch: 5 }, { wch: 5 },
    { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, '공종별집계표');

  // ── 시트3: 세부 내역서 ──
  const detailRows = [
    ['', '', '', '', '', '', '', '', '', '', '', '', '내역서'],
    ['', '', '', '', '', '', '', '', '', '', '', '', estimate.projectName],
    ['항목', '품  명', '규  격', '단위', '수량',
      '재료비 단가', '재료비 금액', '노무비 단가', '노무비 금액',
      '경비 단가', '경비 금액', '합계 단가', '합계 금액', '비고'],
  ];

  let sectionNum = 0;
  estimate.sections.forEach(section => {
    sectionNum++;
    const sc = calcSection(section);

    // 하위구역 있는 경우
    if (section.subSections.length > 0) {
      detailRows.push([`${sectionNum} ${section.name}`, '', '', '', '', '', '', '', '', '', '', '', '', '']);
      let subNum = 0;
      section.subSections.forEach(ss => {
        subNum++;
        detailRows.push([`${sectionNum}-${subNum} ${ss.name}`, '', '', '', '', '', '', '', '', '', '', '', '', '']);
        ss.items.forEach(item => {
          const c = calcItem(item);
          detailRows.push([
            '', item.name, item.spec, item.unit, item.qty,
            won(item.materialUnit), won(c.mat),
            won(item.laborUnit), won(c.lab),
            won(item.expenseUnit), won(c.exp),
            won(item.materialUnit + item.laborUnit + item.expenseUnit), won(c.total),
            item.note || '',
          ]);
        });
      });
      // 공종 직속 항목도 있으면 출력
      section.items.forEach(item => {
        const c = calcItem(item);
        detailRows.push([
          '', item.name, item.spec, item.unit, item.qty,
          won(item.materialUnit), won(c.mat),
          won(item.laborUnit), won(c.lab),
          won(item.expenseUnit), won(c.exp),
          won(item.materialUnit + item.laborUnit + item.expenseUnit), won(c.total),
          item.note || '',
        ]);
      });
    } else {
      // 하위구역 없는 경우
      detailRows.push([`${sectionNum} ${section.name}`, '', '', '', '', '', '', '', '', '', '', '', '', '']);
      section.items.forEach(item => {
        const c = calcItem(item);
        detailRows.push([
          '', item.name, item.spec, item.unit, item.qty,
          won(item.materialUnit), won(c.mat),
          won(item.laborUnit), won(c.lab),
          won(item.expenseUnit), won(c.exp),
          won(item.materialUnit + item.laborUnit + item.expenseUnit), won(c.total),
          item.note || '',
        ]);
      });
    }

    // 소계
    detailRows.push([
      '', '[소  계]', '', '', '',
      '', won(sc.mat),
      '', won(sc.lab),
      '', won(sc.exp),
      '', won(sc.total),
      '',
    ]);
    detailRows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  });

  // 합계
  detailRows.push([
    '', '[합  계]', '', '', '',
    '', won(calc.totalMat),
    '', won(calc.totalLab),
    '', won(calc.totalExp),
    '', won(calc.directTotal),
    '',
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet(detailRows);
  ws3['!cols'] = [
    { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 5 }, { wch: 6 },
    { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
    { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, '세부내역서');

  const fileName = `${estimate.date}_${estimate.title}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

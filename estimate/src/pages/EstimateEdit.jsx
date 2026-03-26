import { useState } from 'react';
import { WORK_TEMPLATES } from '../data/templates';
import SectionBlock from '../components/SectionBlock';
import { getEstimate, updateEstimate, addSection, calcEstimate, useEstimates } from '../store/useStore';
import { exportToExcel } from '../utils/excelExport';

export default function EstimateEdit({ id, onBack }) {
  useEstimates(); // 리렌더 구독
  const estimate = getEstimate(id);
  const [showTemplates, setShowTemplates] = useState(false);

  if (!estimate) return <div className="p-8 text-center text-gray-500">견적서를 찾을 수 없습니다.</div>;

  const calc = calcEstimate(estimate);

  function Field({ label, field, type = 'text' }) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">{label}</label>
        <input
          type={type}
          value={estimate[field] || ''}
          onChange={e => updateEstimate(id, { [field]: e.target.value })}
          className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 바 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm">← 목록</button>
        <h1 className="font-bold text-gray-800 text-base flex-1 truncate">{estimate.title}</h1>
        <button
          onClick={() => exportToExcel(estimate)}
          className="bg-green-700 text-white text-sm px-4 py-1.5 rounded hover:bg-green-800"
        >
          엑셀 저장
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">기본 정보</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="견적서 제목" field="title" />
            <Field label="수신 (고객명)" field="recipient" />
            <Field label="공사명" field="projectName" />
            <Field label="작성일" field="date" type="date" />
          </div>
        </div>

        {/* 공종 목록 */}
        {estimate.sections.map((section, idx) => (
          <SectionBlock
            key={section.id}
            estimateId={id}
            section={section}
            sectionNum={idx + 1}
          />
        ))}

        {/* 공종 추가 버튼 */}
        <div className="mb-4">
          <button
            onClick={() => setShowTemplates(v => !v)}
            className="w-full py-3 border-2 border-dashed border-green-300 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"
          >
            {showTemplates ? '▲ 공종 목록 닫기' : '+ 공종 추가'}
          </button>
          {showTemplates && (
            <div className="mt-2 grid grid-cols-3 md:grid-cols-6 gap-2">
              {WORK_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => { addSection(id, tpl); setShowTemplates(false); }}
                  className="bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm hover:bg-green-50 hover:border-green-400 text-gray-700"
                >
                  {tpl.name}
                </button>
              ))}
              <button
                onClick={() => {
                  const name = prompt('공종명을 입력하세요');
                  if (name) { addSection(id, { name, subSections: [], items: [] }); setShowTemplates(false); }
                }}
                className="bg-white border border-dashed border-gray-300 rounded-lg py-2 px-3 text-sm hover:bg-gray-50 text-gray-400"
              >
                + 직접 입력
              </button>
            </div>
          )}
        </div>

        {/* 합계 패널 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">견적 합계</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-gray-600 w-48">순 공 사 비</td>
                  <td className="py-1 text-right text-gray-500">재료비 {calc.totalMat.toLocaleString()}</td>
                  <td className="py-1 text-right text-gray-500">노무비 {calc.totalLab.toLocaleString()}</td>
                  <td className="py-1 text-right text-gray-500">경비 {calc.totalExp.toLocaleString()}</td>
                  <td className="py-1 text-right font-medium">{calc.directTotal.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-gray-100 text-gray-500 text-xs">
                  <td className="py-0.5">고용보험 1.01%</td>
                  <td colSpan={3}></td>
                  <td className="py-0.5 text-right">{calc.employment.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-gray-100 text-gray-500 text-xs">
                  <td className="py-0.5">산재보험 3.56%</td>
                  <td colSpan={3}></td>
                  <td className="py-0.5 text-right">{calc.industrial.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-gray-100 text-gray-500 text-xs">
                  <td className="py-0.5">일반관리비 5%</td>
                  <td colSpan={3}></td>
                  <td className="py-0.5 text-right">{calc.management.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-gray-100 text-gray-500 text-xs">
                  <td className="py-0.5">이윤 10%</td>
                  <td colSpan={3}></td>
                  <td className="py-0.5 text-right">{calc.profit.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1 text-gray-600">간 접 공 사 비 계</td>
                  <td colSpan={3}></td>
                  <td className="py-1 text-right">{calc.indirectTotal.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1 text-gray-600">총 공 사 비</td>
                  <td colSpan={3}></td>
                  <td className="py-1 text-right">{calc.constructionTotal.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1 text-gray-600">D / C</td>
                  <td colSpan={3}></td>
                  <td className="py-1 text-right">
                    <input
                      type="number"
                      value={estimate.discount || ''}
                      onChange={e => updateEstimate(id, { discount: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-32 text-right px-2 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-green-500"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200 text-gray-500 text-xs">
                  <td className="py-0.5">부 가 세 10%</td>
                  <td colSpan={3}></td>
                  <td className="py-0.5 text-right">{calc.vat.toLocaleString()}</td>
                </tr>
                <tr className="bg-yellow-50">
                  <td className="py-2 font-bold text-gray-800">[ 합  계 ]</td>
                  <td colSpan={3}></td>
                  <td className="py-2 text-right font-bold text-lg text-green-800">{calc.grandTotal.toLocaleString()} 원</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

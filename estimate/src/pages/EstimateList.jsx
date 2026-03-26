import { useState } from 'react';
import { useEstimates, createEstimate, deleteEstimate, calcEstimate } from '../store/useStore';

export default function EstimateList({ onSelect }) {
  const estimates = useEstimates();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', recipient: '', projectName: '', date: new Date().toISOString().slice(0, 10) });

  function handleCreate() {
    if (!form.title.trim()) return alert('견적서 제목을 입력하세요');
    const id = createEstimate(form);
    setShowNew(false);
    setForm({ title: '', recipient: '', projectName: '', date: new Date().toISOString().slice(0, 10) });
    onSelect(id);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-green-700 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">JM 견적서</h1>
          <p className="text-xs text-green-200 mt-0.5">JM건축인테리어 주식회사</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-white text-green-700 text-sm font-semibold px-4 py-2 rounded hover:bg-green-50"
        >
          + 새 견적서
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 새 견적서 폼 */}
        {showNew && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4">새 견적서 만들기</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">견적서 제목 *</label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="예: 대상힐스 미용실 인테리어"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">수신 (고객명)</label>
                <input
                  value={form.recipient}
                  onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                  placeholder="예: 원장님 귀하"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">공사명</label>
                <input
                  value={form.projectName}
                  onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
                  placeholder="예: 미용실 인테리어"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">작성일</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="bg-green-700 text-white text-sm px-5 py-2 rounded hover:bg-green-800">
                만들기
              </button>
              <button onClick={() => setShowNew(false)} className="text-sm text-gray-500 px-4 py-2 rounded hover:bg-gray-100">
                취소
              </button>
            </div>
          </div>
        )}

        {/* 목록 */}
        {estimates.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg">견적서가 없습니다</p>
            <p className="text-sm mt-1">상단의 "새 견적서" 버튼을 눌러 시작하세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {estimates.map(est => {
              const calc = calcEstimate(est);
              return (
                <div
                  key={est.id}
                  onClick={() => onSelect(est.id)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-green-400 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{est.title}</h3>
                        {est.recipient && <span className="text-xs text-gray-400">{est.recipient}</span>}
                      </div>
                      {est.projectName && <p className="text-sm text-gray-500 mt-0.5">{est.projectName}</p>}
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs text-gray-400">{est.date}</span>
                        <span className="text-xs text-gray-400">공종 {est.sections.length}개</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-green-700 text-lg">{calc.grandTotal.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">원 (부가세 포함)</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`"${est.title}" 견적서를 삭제할까요?`)) deleteEstimate(est.id);
                      }}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

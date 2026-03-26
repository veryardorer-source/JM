import { useState } from 'react';
import EstimateList from './pages/EstimateList';
import EstimateEdit from './pages/EstimateEdit';
import QuantityPage from './pages/QuantityPage';
import './index.css';

export default function App() {
  const [tab, setTab] = useState('quantity'); // 'quantity' | 'estimate'
  const [currentId, setCurrentId] = useState(null);

  // 견적서 편집 중이면 탭바 숨기고 EstimateEdit만 표시
  if (tab === 'estimate' && currentId) {
    return (
      <EstimateEdit
        id={currentId}
        onBack={() => setCurrentId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 탭바 헤더 */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-0">
          {/* 로고/브랜드 */}
          <div className="py-3 pr-6 flex items-center gap-2 border-r border-gray-200 mr-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">JM</span>
            </div>
            <div className="leading-tight">
              <div className="text-xs font-bold text-gray-800">JM건축인테리어</div>
              <div className="text-[10px] text-gray-400">견적 시스템</div>
            </div>
          </div>

          {/* 탭 버튼들 */}
          <button
            onClick={() => setTab('quantity')}
            className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'quantity'
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📐 물량산출
          </button>
          <button
            onClick={() => { setTab('estimate'); setCurrentId(null); }}
            className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'estimate'
                ? 'border-green-600 text-green-700 bg-green-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 견적서
          </button>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1">
        {tab === 'quantity' && <QuantityPage />}
        {tab === 'estimate' && (
          <EstimateList onSelect={id => { setCurrentId(id); }} />
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import Step1 from './components/Step1';
import './index.css';

export default function App() {
  const [step, setStep] = useState(1);
  const [ingredients, setIngredients] = useState([]);

  const handleStep1Complete = (result) => {
    setIngredients(result);
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-emerald-600">🥬 냉장고 레시피</h1>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className={step >= 1 ? 'text-emerald-600 font-semibold' : ''}>재료인식</span>
            <span>›</span>
            <span className={step >= 2 ? 'text-emerald-600 font-semibold' : ''}>레시피</span>
            <span>›</span>
            <span className={step >= 3 ? 'text-emerald-600 font-semibold' : ''}>저장</span>
          </div>
        </div>
      </header>

      <main>
        {step === 1 && <Step1 onComplete={handleStep1Complete} />}
        {step === 2 && (
          <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400">
            <p className="text-4xl mb-4">👨‍🍳</p>
            <p className="font-medium">Step 2 — 레시피 생성 (구현 예정)</p>
            <p className="text-sm mt-2">인식된 재료: {ingredients.join(', ')}</p>
            <button
              onClick={() => setStep(1)}
              className="mt-6 text-sm text-emerald-500 underline"
            >
              ← 재료 다시 선택
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

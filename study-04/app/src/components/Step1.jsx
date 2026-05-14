import { useState, useRef, useCallback } from 'react';
import { analyzeIngredients, resizeImageToBase64 } from '../lib/openrouter';
import Toast from './Toast';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export default function Step1({ onComplete }) {
  const [preview, setPreview] = useState(null);       // data URL (미리보기)
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [addInput, setAddInput] = useState('');
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef();

  const showToast = (message, type = 'error') => setToast({ message, type });

  // 파일 처리 공통 함수
  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      return showToast('JPG, PNG, WEBP 형식만 지원합니다.');
    }
    if (f.size > MAX_SIZE_BYTES) {
      return showToast('10MB 이하 이미지를 사용해주세요.');
    }
    setFile(f);
    setIngredients([]);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  // 드래그&드롭
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // 분석 시작
  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setIngredients([]);
    try {
      const base64 = await resizeImageToBase64(file);
      const result = await analyzeIngredients(base64);
      if (result.length === 0) {
        showToast('식재료를 찾지 못했어요. 사진을 확인해주세요.', 'info');
      } else {
        setIngredients(result);
      }
    } catch (e) {
      if (e.message.includes('429') || e.message.includes('rate')) {
        showToast('잠시 후 다시 시도해주세요. (rate limit)');
      } else {
        showToast('분석에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 재료 삭제
  const removeIngredient = (idx) =>
    setIngredients(prev => prev.filter((_, i) => i !== idx));

  // 재료 추가
  const addIngredient = () => {
    const val = addInput.trim();
    if (!val) return;
    if (ingredients.includes(val)) {
      showToast('이미 있는 재료입니다.', 'info');
      return;
    }
    setIngredients(prev => [...prev, val]);
    setAddInput('');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">냉장고 사진 분석</h2>
      <p className="text-gray-500 text-sm mb-6">냉장고 사진을 올리면 재료를 자동으로 인식합니다.</p>

      {/* 업로드 영역 */}
      <div
        className={`relative border-2 border-dashed rounded-2xl transition-colors cursor-pointer
          ${dragging ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 bg-white hover:border-emerald-400 hover:bg-emerald-50'}`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {preview ? (
          <img
            src={preview}
            alt="미리보기"
            className="w-full max-h-72 object-contain rounded-2xl p-2"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 9l-4-4m0 0L8 9m4-4v12" />
            </svg>
            <p className="text-sm font-medium">클릭하거나 사진을 드래그하세요</p>
            <p className="text-xs">JPG · PNG · WEBP · 최대 10MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {/* 사진 변경 버튼 */}
      {preview && (
        <button
          className="mt-2 text-xs text-gray-400 underline hover:text-gray-600"
          onClick={() => fileInputRef.current.click()}
        >
          다른 사진 선택
        </button>
      )}

      {/* 분석하기 버튼 */}
      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className={`mt-4 w-full py-3 rounded-xl font-semibold text-white transition-all
          ${!file || loading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-emerald-500 hover:bg-emerald-600 active:scale-95'}`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            분석 중...
          </span>
        ) : '🔍 재료 분석하기'}
      </button>

      {/* 재료 목록 */}
      {ingredients.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            인식된 재료 <span className="text-emerald-500">{ingredients.length}개</span>
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {ingredients.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200"
              >
                {item}
                <button
                  onClick={() => removeIngredient(idx)}
                  className="ml-0.5 text-emerald-400 hover:text-red-400 transition-colors leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* 재료 추가 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
              placeholder="재료 직접 추가"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={addIngredient}
              className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              추가
            </button>
          </div>

          {/* 다음 단계 버튼 */}
          <button
            onClick={() => onComplete(ingredients)}
            className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all active:scale-95"
          >
            레시피 추천받기 →
          </button>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

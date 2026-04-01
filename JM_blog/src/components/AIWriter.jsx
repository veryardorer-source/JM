import { useState, useRef } from 'react';
import { getSettings } from '../utils/storage';
import styles from './AIWriter.module.css';

export default function AIWriter({ onNav }) {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('');
  const [images, setImages] = useState([]);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const fileInputRef = useRef(null);

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => [...prev, { name: file.name, data: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleImageRemove = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setStatus({ type: 'error', text: '주제를 입력해주세요.' });
      return;
    }
    const settings = getSettings();
    if (!settings.claudeApiKey) {
      setStatus({ type: 'error', text: 'Claude API 키가 필요합니다. 설정에서 입력해주세요.' });
      return;
    }

    setGenerating(true);
    setStatus({ type: 'info', text: 'AI가 글을 작성하고 있습니다...' });
    setResult(null);

    try {
      const res = await fetch('http://localhost:3001/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.claudeApiKey,
          topic,
          keywords,
          images,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      setStatus({ type: 'success', text: 'AI 글 작성 완료! 내용을 확인하고 발행하세요.' });
    } catch (err) {
      setStatus({ type: 'error', text: `글 생성 실패: ${err.message}` });
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!result) return;
    const settings = getSettings();
    if (!settings.naverId || !settings.naverPw) {
      setStatus({ type: 'error', text: '네이버 아이디/비밀번호가 필요합니다. 설정에서 입력해주세요.' });
      return;
    }

    setPosting(true);
    setStatus({ type: 'info', text: '네이버 블로그에 발행 중... (브라우저가 열립니다)' });

    try {
      const res = await fetch('http://localhost:3001/api/blog/puppeteer-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naverId: settings.naverId,
          naverPw: settings.naverPw,
          title: result.title,
          content: result.content,
          tags: result.tags,
          isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus({ type: 'success', text: '네이버 블로그에 발행 완료!' });
    } catch (err) {
      setStatus({ type: 'error', text: `발행 실패: ${err.message}` });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>AI 블로그 작성</h1>
        <p className={styles.subtitle}>주제와 사진만 넣으면 AI가 자동으로 블로그 글을 작성합니다</p>
      </div>

      {status && (
        <div className={`${styles.status} ${styles[status.type]}`}>{status.text}</div>
      )}

      {/* 입력 영역 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>1. 주제 입력</h2>
        <div className={styles.field}>
          <label>주제 / 제목 *</label>
          <input
            type="text"
            placeholder="예: 소형 아파트 인테리어 리모델링 후기"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>키워드 (선택)</label>
          <input
            type="text"
            placeholder="예: 인테리어, 리모델링, 30평대, 모던"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>추가 요청사항 (선택)</label>
          <input
            type="text"
            placeholder="예: 비용 정보 포함, 시공 기간 언급"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          />
        </div>
      </div>

      {/* 사진 업로드 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>2. 사진 첨부 (선택)</h2>
        <div className={styles.imageUpload}>
          <button
            className={styles.btnUpload}
            onClick={() => fileInputRef.current?.click()}
          >
            + 사진 추가
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageAdd}
          />
          <span className={styles.imageHint}>여러 장 선택 가능. AI가 글 중간에 자연스럽게 배치합니다.</span>
        </div>
        {images.length > 0 && (
          <div className={styles.imageGrid}>
            {images.map((img, i) => (
              <div key={i} className={styles.imageItem}>
                <img src={img.data} alt={img.name} />
                <button
                  className={styles.imageRemove}
                  onClick={() => handleImageRemove(i)}
                >
                  X
                </button>
                <span className={styles.imageLabel}>사진 {i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 생성 버튼 */}
      <div className={styles.generateArea}>
        <button
          className={styles.btnGenerate}
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'AI 작성 중...' : 'AI 글 생성하기'}
        </button>
      </div>

      {/* 결과 미리보기 */}
      {result && (
        <div className={styles.resultArea}>
          <div className={styles.card}>
            <div className={styles.resultHeader}>
              <h2 className={styles.cardTitle}>3. 작성된 글 미리보기</h2>
              <div className={styles.resultActions}>
                <button
                  className={styles.btnRegenerate}
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  다시 생성
                </button>
              </div>
            </div>

            <div className={styles.resultTitle}>
              <label>제목</label>
              <input
                type="text"
                value={result.title}
                onChange={(e) => setResult({ ...result, title: e.target.value })}
              />
            </div>

            <div className={styles.resultTags}>
              <label>태그</label>
              <input
                type="text"
                value={result.tags}
                onChange={(e) => setResult({ ...result, tags: e.target.value })}
              />
            </div>

            <div className={styles.preview}>
              <div dangerouslySetInnerHTML={{ __html: result.content }} />
            </div>
          </div>

          {/* 발행 */}
          <div className={styles.publishArea}>
            <div className={styles.publishOptions}>
              <div className={styles.toggleGroup}>
                <button
                  className={`${styles.toggleBtn} ${isPublic ? styles.active : ''}`}
                  onClick={() => setIsPublic(true)}
                >
                  공개
                </button>
                <button
                  className={`${styles.toggleBtn} ${!isPublic ? styles.active : ''}`}
                  onClick={() => setIsPublic(false)}
                >
                  비공개
                </button>
              </div>
            </div>
            <button
              className={styles.btnPublish}
              onClick={handlePublish}
              disabled={posting}
            >
              {posting ? '발행 중...' : '네이버 블로그에 발행하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

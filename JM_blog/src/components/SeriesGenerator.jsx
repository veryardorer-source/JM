import { useState, useEffect } from 'react';
import { getSites, saveSite, getSettings, saveDraft } from '../utils/storage';
import styles from './SeriesGenerator.module.css';

const PHASES = [
  { key: 'design', label: '���자인/설계', icon: '🎨' },
  { key: 'construction', label: '시공', icon: '🔨' },
  { key: 'finishing', label: '마감', icon: '✨' },
];

export default function SeriesGenerator({ onNav, initialSite }) {
  const [sites, setSites] = useState(getSites());
  const [selectedSite, setSelectedSite] = useState(initialSite || null);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (initialSite) {
      setSelectedSite(initialSite);
    }
  }, [initialSite]);

  // 현장 선택 시 사진 불러오기
  const loadPhotos = async (site) => {
    if (!site?.folderPath) return;
    setLoadingPhotos(true);
    try {
      const res = await fetch(`http://localhost:3001/api/sites/photos?folderPath=${encodeURIComponent(site.folderPath)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhotos(data.images || []);
    } catch (err) {
      setStatus({ type: 'error', text: `사진 로드 실패: ${err.message}` });
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleSelectSite = (site) => {
    setSelectedSite(site);
    setSelectedPhase(null);
    setSelectedPhotos([]);
    setResult(null);
    loadPhotos(site);
  };

  const handleTogglePhoto = (photo) => {
    setSelectedPhotos((prev) => {
      const exists = prev.find((p) => p.path === photo.path);
      if (exists) return prev.filter((p) => p.path !== photo.path);
      return [...prev, photo];
    });
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos([...photos]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSite || !selectedPhase) {
      setStatus({ type: 'error', text: '현장과 단계를 선택해주세요.' });
      return;
    }
    const settings = getSettings();
    if (!settings.claudeApiKey) {
      setStatus({ type: 'error', text: 'Claude API 키가 필요합니다. 설정에서 입력해주���요.' });
      return;
    }

    setGenerating(true);
    setStatus({ type: 'info', text: `${PHASES.find(p => p.key === selectedPhase)?.label} 글을 AI가 작성하고 있습니다...` });
    setResult(null);

    try {
      // 선택된 사진을 base64로 변환
      const imageData = [];
      for (const photo of selectedPhotos.slice(0, 10)) {
        try {
          const res = await fetch(`http://localhost:3001/api/sites/photo?filePath=${encodeURIComponent(photo.path)}`);
          const data = await res.json();
          if (res.ok) imageData.push(data);
        } catch {}
      }

      const res = await fetch('http://localhost:3001/api/ai/generate-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.claudeApiKey,
          siteName: selectedSite.name,
          phase: selectedPhase,
          keywords,
          images: imageData,
          location: selectedSite.location,
          additionalInfo: additionalInfo || selectedSite.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      setStatus({ type: 'success', text: '글 작성 완료! 내용을 확인하고 초안으로 저장하세요.' });
    } catch (err) {
      setStatus({ type: 'error', text: `글 생성 실패: ${err.message}` });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = () => {
    if (!result) return;

    const draft = {
      id: crypto.randomUUID(),
      title: result.title,
      content: result.content,
      tags: result.tags,
      isPublic: true,
      siteName: selectedSite.name,
      siteId: selectedSite.id,
      phase: selectedPhase,
      phaseLabel: result.phaseLabel,
    };
    saveDraft(draft);

    // 현장에 초안 ID 기록
    const updatedSite = { ...selectedSite };
    if (!updatedSite.phases) updatedSite.phases = {};
    if (!updatedSite.phases[selectedPhase]) updatedSite.phases[selectedPhase] = {};
    updatedSite.phases[selectedPhase].generated = true;
    updatedSite.phases[selectedPhase].draftId = draft.id;
    const updatedSites = saveSite(updatedSite);
    setSites(updatedSites);
    setSelectedSite(updatedSite);

    setStatus({ type: 'success', text: '초안이 저장되었습니다! 임시저장 목록에서 확인 후 발행하세요.' });
  };

  const [photoThumbs, setPhotoThumbs] = useState({});

  // 사진 썸네일 로드 (처음 20개만)
  useEffect(() => {
    const loadThumbs = async () => {
      const thumbs = {};
      for (const photo of photos.slice(0, 30)) {
        try {
          const res = await fetch(`http://localhost:3001/api/sites/photo?filePath=${encodeURIComponent(photo.path)}`);
          const data = await res.json();
          if (res.ok) thumbs[photo.path] = data.data;
        } catch {}
      }
      setPhotoThumbs(thumbs);
    };
    if (photos.length > 0) loadThumbs();
  }, [photos]);

  if (sites.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noSites}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
          <p>등록된 현장이 없습니��.</p>
          <p style={{ fontSize: 13, marginTop: 4, color: '#aaa' }}>먼저 현장을 등록해주세요.</p>
          <button onClick={() => onNav('sites')}>현장 등록하기</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>시리즈 글 생성</h1>
        <p className={styles.subtitle}>현장을 선택하고 단계별 블로그 글을 자동으로 생성합니다</p>
      </div>

      {status && (
        <div className={`${styles.status} ${styles[status.type]}`}>{status.text}</div>
      )}

      {/* 1. 현장 선택 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>1. 현장 선택</h2>
        <div className={styles.siteSelect}>
          {sites.map((site) => (
            <button
              key={site.id}
              className={`${styles.siteOption} ${selectedSite?.id === site.id ? styles.selected : ''}`}
              onClick={() => handleSelectSite(site)}
            >
              <div className={styles.siteOptionName}>{site.name}</div>
              <div className={styles.siteOptionMeta}>
                {site.location && `${site.location} · `}
                {site.photoCount || 0}장
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. 단계 선택 */}
      {selectedSite && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>2. 단계 선택</h2>
          <div className={styles.phaseSelect}>
            {PHASES.map((p) => {
              const phaseData = selectedSite.phases?.[p.key];
              const isDone = phaseData?.draftId;
              return (
                <button
                  key={p.key}
                  className={`${styles.phaseBtn} ${selectedPhase === p.key ? styles.selected : ''} ${isDone ? styles.done : ''}`}
                  onClick={() => {
                    setSelectedPhase(p.key);
                    setResult(null);
                  }}
                >
                  <span className={styles.phaseIcon}>{p.icon}</span>
                  <span className={styles.phaseLabel}>{p.label}</span>
                  {isDone && <div className={styles.phaseStatus}>초안 완료 ✓</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 사진 선택 */}
      {selectedSite && selectedPhase && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>3. 사진 선택</h2>
          {loadingPhotos ? (
            <div className={styles.loadingPhotos}>사진을 불러오는 중...</div>
          ) : photos.length === 0 ? (
            <p style={{ color: '#999', fontSize: 14 }}>
              NAS 폴더에서 사진을 찾을 수 없습니다. 현장 관리에서 폴더 경로를 확인해주세요.
            </p>
          ) : (
            <>
              <div className={styles.photoGrid}>
                {photos.map((photo) => {
                  const isSelected = selectedPhotos.some((p) => p.path === photo.path);
                  return (
                    <div
                      key={photo.path}
                      className={`${styles.photoItem} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleTogglePhoto(photo)}
                    >
                      {photoThumbs[photo.path] ? (
                        <img src={photoThumbs[photo.path]} alt={photo.name} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#999' }}>
                          {photo.name.slice(0, 8)}
                        </div>
                      )}
                      {isSelected && (
                        <span className={styles.photoCheck}>
                          {selectedPhotos.findIndex((p) => p.path === photo.path) + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={styles.photoActions}>
                <button className={styles.btnSelectAll} onClick={handleSelectAll}>
                  {selectedPhotos.length === photos.length ? '전체 해제' : '전체 선택'}
                </button>
                <span className={styles.selectedCount}>
                  {selectedPhotos.length}장 선택됨 (최대 10장 사용)
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. 추가 옵션 */}
      {selectedSite && selectedPhase && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>4. 추가 정보 (선택)</h2>
          <div className={styles.field}>
            <label>키워드</label>
            <input
              type="text"
              placeholder="예: 30평대 아파트, 모던 인테리어, 화이트톤"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>추가 정보</label>
            <input
              type="text"
              placeholder="예: 4인 가족, 맞벌이, 수납 많이, 비용 3000만원"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* 생성 버튼 */}
      {selectedSite && selectedPhase && (
        <div className={styles.generateArea}>
          <button
            className={styles.btnGenerate}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'AI 작성 중...' : `${PHASES.find(p => p.key === selectedPhase)?.label} 글 생성하기`}
          </button>
        </div>
      )}

      {/* 결과 미리보기 */}
      {result && (
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <span className={styles.resultPhase}>
              {PHASES.find(p => p.key === selectedPhase)?.icon} {result.phaseLabel}
            </span>
            <div className={styles.resultActions}>
              <button className={styles.btnSaveDraft} onClick={handleSaveDraft}>
                초안 저장
              </button>
              <button
                className={styles.btnRegenerate}
                onClick={handleGenerate}
                disabled={generating}
              >
                다시 생���
              </button>
            </div>
          </div>

          <div className={styles.resultTitle}>
            <input
              type="text"
              value={result.title}
              onChange={(e) => setResult({ ...result, title: e.target.value })}
            />
          </div>

          <div className={styles.resultTags}>
            <input
              type="text"
              value={result.tags}
              placeholder="태그"
              onChange={(e) => setResult({ ...result, tags: e.target.value })}
            />
          </div>

          <div className={styles.preview}>
            <div dangerouslySetInnerHTML={{ __html: result.content }} />
          </div>
        </div>
      )}
    </div>
  );
}

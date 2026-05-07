import { useState } from 'react';
import { getSites, saveSite, deleteSite } from '../utils/storage';
import styles from './SiteManager.module.css';

const PHASES = [
  { key: 'design', label: '디자인/설계', icon: '🎨' },
  { key: 'construction', label: '시공', icon: '🔨' },
  { key: 'finishing', label: '마감', icon: '✨' },
];

export default function SiteManager({ onNav, onSelectSite }) {
  const [sites, setSites] = useState(getSites());
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [form, setForm] = useState({ name: '', folderPath: '', location: '', notes: '' });
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [status, setStatus] = useState(null);

  const resetForm = () => {
    setForm({ name: '', folderPath: '', location: '', notes: '' });
    setPhotos([]);
    setEditingSite(null);
    setShowForm(false);
  };

  const handleEdit = (site) => {
    setForm({
      name: site.name,
      folderPath: site.folderPath,
      location: site.location || '',
      notes: site.notes || '',
    });
    setEditingSite(site);
    setShowForm(true);
    setPhotos([]);
  };

  const handleLoadPhotos = async () => {
    if (!form.folderPath.trim()) {
      setStatus({ type: 'error', text: 'NAS 폴더 경로를 입력해주세요.' });
      return;
    }
    setLoadingPhotos(true);
    setStatus({ type: 'info', text: '사진을 불러오는 중...' });
    try {
      const res = await fetch(`http://localhost:3001/api/sites/photos?folderPath=${encodeURIComponent(form.folderPath)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhotos(data.images || []);
      setStatus({ type: 'success', text: `${data.total}장의 사진을 찾았습니다.` });
    } catch (err) {
      setStatus({ type: 'error', text: `사진 로드 실패: ${err.message}` });
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setStatus({ type: 'error', text: '현장명을 입력해주세요.' });
      return;
    }
    if (!form.folderPath.trim()) {
      setStatus({ type: 'error', text: 'NAS 폴더 경로를 입력해주세요.' });
      return;
    }

    const siteData = {
      id: editingSite?.id || crypto.randomUUID(),
      name: form.name.trim(),
      folderPath: form.folderPath.trim(),
      location: form.location.trim(),
      notes: form.notes.trim(),
      photoCount: photos.length || editingSite?.photoCount || 0,
      phases: editingSite?.phases || {
        design: { generated: false, draftId: null },
        construction: { generated: false, draftId: null },
        finishing: { generated: false, draftId: null },
      },
    };

    const updated = saveSite(siteData);
    setSites(updated);
    setStatus({ type: 'success', text: `현장 "${form.name}" ${editingSite ? '수정' : '등록'} 완료!` });
    resetForm();
  };

  const handleDelete = (site) => {
    if (!confirm(`"${site.name}" 현장을 삭제할까요?`)) return;
    const updated = deleteSite(site.id);
    setSites(updated);
  };

  const handleGoToSeries = (site) => {
    if (onSelectSite) onSelectSite(site);
    if (onNav) onNav('series');
  };

  const getPhaseStatus = (site, phaseKey) => {
    const p = site.phases?.[phaseKey];
    if (!p) return '';
    if (p.draftId) return 'draft';
    if (p.generated) return 'done';
    return '';
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>현장 관리</h1>
          <p className={styles.subtitle}>인테리어 현장을 등록하고 NAS 사진 폴더를 연결하세요</p>
        </div>
        {!showForm && (
          <button className={styles.btnAdd} onClick={() => setShowForm(true)}>
            + 현장 등록
          </button>
        )}
      </div>

      {status && (
        <div className={`${styles.status} ${styles[status.type]}`}>{status.text}</div>
      )}

      {/* 등록/수정 폼 */}
      {showForm && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{editingSite ? '현장 수정' : '새 현장 등록'}</h2>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>현장명 *</label>
              <input
                type="text"
                placeholder="예: 강남 래미안 30평 리모델링"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>지역</label>
              <input
                type="text"
                placeholder="예: 강남구, 분당, 일산"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label>NAS 사진 폴더 경로 *</label>
            <input
              type="text"
              placeholder="예: \\NAS이름\인테리어\강남 래미안"
              value={form.folderPath}
              onChange={(e) => setForm({ ...form, folderPath: e.target.value })}
            />
            <button
              className={styles.btnLoadPhotos}
              onClick={handleLoadPhotos}
              disabled={loadingPhotos}
            >
              {loadingPhotos ? '불러오는 중...' : '사진 확인하기'}
            </button>
          </div>

          {photos.length > 0 && (
            <div className={styles.photoCount}>
              사진 {photos.length}장 확인됨: {photos.slice(0, 5).map(p => p.name).join(', ')}{photos.length > 5 ? ` 외 ${photos.length - 5}장` : ''}
            </div>
          )}

          <div className={styles.field}>
            <label>메모 (선택)</label>
            <input
              type="text"
              placeholder="예: 30평대, 모던 스타일, 4인 가족"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className={styles.formActions}>
            <button className={styles.btnSave} onClick={handleSave}>
              {editingSite ? '수정 완료' : '현장 등록'}
            </button>
            <button className={styles.btnCancel} onClick={resetForm}>취소</button>
          </div>
        </div>
      )}

      {/* 현장 목록 */}
      {sites.length === 0 && !showForm ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏗️</div>
          <p>등록된 현장이 없습니다.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>현장을 등록하고 블로그 시리즈를 생성해보세요.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {sites.map((site) => (
            <div key={site.id} className={styles.siteItem}>
              <div className={styles.siteHeader}>
                <div>
                  <span className={styles.siteName}>{site.name}</span>
                  {site.location && <span className={styles.siteLocation}>{site.location}</span>}
                </div>
                <div className={styles.siteActions}>
                  <button
                    className={`${styles.btnSmall} ${styles.primary}`}
                    onClick={() => handleGoToSeries(site)}
                  >
                    글 생성
                  </button>
                  <button className={styles.btnSmall} onClick={() => handleEdit(site)}>수정</button>
                  <button
                    className={`${styles.btnSmall} ${styles.danger}`}
                    onClick={() => handleDelete(site)}
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className={styles.phaseRow}>
                {PHASES.map((p) => {
                  const phaseStatus = getPhaseStatus(site, p.key);
                  return (
                    <span
                      key={p.key}
                      className={`${styles.phaseBadge} ${phaseStatus ? styles[phaseStatus] : ''}`}
                    >
                      {p.icon} {p.label}
                      {phaseStatus === 'done' && ' ✓'}
                      {phaseStatus === 'draft' && ' (초안)'}
                    </span>
                  );
                })}
              </div>

              <div className={styles.siteMeta}>
                {site.photoCount > 0 && <span>사진 {site.photoCount}장</span>}
                {site.notes && <span>{site.notes}</span>}
                <span>{formatDate(site.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

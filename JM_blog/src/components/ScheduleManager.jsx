import { useState } from 'react';
import { getSchedule, saveSchedule, getDrafts } from '../utils/storage';
import styles from './ScheduleManager.module.css';

const DAYS = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
  { key: 'sun', label: '일' },
];

const DAY_MAP = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };

export default function ScheduleManager({ onNav }) {
  const [schedule, setSchedule] = useState(() => {
    const saved = getSchedule();
    return {
      days: saved.days || ['mon', 'wed', 'fri'],
      time: saved.time || '10:00',
      queue: saved.queue || [],
    };
  });
  const [showDraftPicker, setShowDraftPicker] = useState(false);
  const [status, setStatus] = useState(null);

  const drafts = getDrafts();

  const toggleDay = (day) => {
    setSchedule((prev) => {
      const days = prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
  };

  const handleSaveSchedule = () => {
    saveSchedule(schedule);
    setStatus({ type: 'success', text: '발행 스케줄이 저장되었습니다!' });
  };

  const getNextPublishDates = (count = 6) => {
    const dates = [];
    const now = new Date();
    const current = new Date(now);
    const [h, m] = schedule.time.split(':').map(Number);

    for (let i = 0; i < 30 && dates.length < count; i++) {
      const dayKey = Object.entries(DAY_MAP).find(([, v]) => v === current.getDay())?.[0];
      if (dayKey && schedule.days.includes(dayKey)) {
        const d = new Date(current);
        d.setHours(h, m, 0, 0);
        if (d > now) {
          dates.push(d);
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const addToQueue = (draft) => {
    const nextDates = getNextPublishDates(schedule.queue.length + 3);
    const usedDates = new Set(schedule.queue.map((q) => q.scheduledDate));
    const nextDate = nextDates.find((d) => !usedDates.has(d.toISOString()));

    const queueItem = {
      id: crypto.randomUUID(),
      draftId: draft.id,
      title: draft.title,
      siteName: draft.siteName || '',
      phaseLabel: draft.phaseLabel || '',
      scheduledDate: nextDate?.toISOString() || new Date().toISOString(),
      status: 'pending',
    };

    const updated = {
      ...schedule,
      queue: [...schedule.queue, queueItem],
    };
    setSchedule(updated);
    saveSchedule(updated);
    setShowDraftPicker(false);
    setStatus({ type: 'success', text: `"${draft.title}" 발행 대기열에 추가되었습니다.` });
  };

  const removeFromQueue = (queueId) => {
    const updated = {
      ...schedule,
      queue: schedule.queue.filter((q) => q.id !== queueId),
    };
    setSchedule(updated);
    saveSchedule(updated);
  };

  const markPublished = (queueId) => {
    const updated = {
      ...schedule,
      queue: schedule.queue.map((q) =>
        q.id === queueId ? { ...q, status: 'published' } : q
      ),
    };
    setSchedule(updated);
    saveSchedule(updated);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const day = dayNames[d.getDay()];
    const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return `${month}/${date}(${day}) ${time}`;
  };

  const scheduleSummary = () => {
    if (schedule.days.length === 0) return '발행 요일을 선택해주세요';
    const dayLabels = schedule.days
      .sort((a, b) => DAY_MAP[a] - DAY_MAP[b])
      .map((d) => DAYS.find((day) => day.key === d)?.label);
    return `매주 ${dayLabels.join(', ')} ${schedule.time}에 발행`;
  };

  // 대기열에 없는 초안만 표시
  const queuedDraftIds = new Set(schedule.queue.map((q) => q.draftId));
  const availableDrafts = drafts.filter((d) => !queuedDraftIds.has(d.id));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>발행 스케줄</h1>
        <p className={styles.subtitle}>주간 발행 일정을 관리하고 대기열에 초안을 배치하세요</p>
      </div>

      {status && (
        <div className={`${styles.status} ${styles[status.type]}`}>{status.text}</div>
      )}

      {/* 스케줄 설정 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>발행 요일 설정</h2>
        <div className={styles.daySelect}>
          {DAYS.map((day) => (
            <button
              key={day.key}
              className={`${styles.dayBtn} ${schedule.days.includes(day.key) ? styles.selected : ''}`}
              onClick={() => toggleDay(day.key)}
            >
              {day.label}
            </button>
          ))}
        </div>
        <div className={styles.timeField}>
          <label>발행 시간:</label>
          <input
            type="time"
            value={schedule.time}
            onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
          />
        </div>
        <button className={styles.btnSaveSchedule} onClick={handleSaveSchedule}>
          스케줄 저장
        </button>
      </div>

      {/* 현재 스케줄 요약 */}
      <div className={styles.scheduleInfo}>
        📅 {scheduleSummary()}
      </div>

      {/* 발행 대기열 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>발행 대기열</h2>

        {schedule.queue.length === 0 ? (
          <div className={styles.emptyQueue}>
            <p>대기열이 비어있습니다.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>시리즈 생성에서 초안을 만들고 여기에 추가하세요.</p>
          </div>
        ) : (
          <div className={styles.queue}>
            {schedule.queue.map((item) => (
              <div key={item.id} className={styles.queueItem}>
                <div className={styles.queueInfo}>
                  <div className={styles.queueTitle}>{item.title || '(제목 없음)'}</div>
                  <div className={styles.queueMeta}>
                    {item.siteName && <span>{item.siteName}</span>}
                    {item.phaseLabel && <span>{item.phaseLabel}</span>}
                  </div>
                </div>
                <div className={styles.queueDate}>{formatDate(item.scheduledDate)}</div>
                <span className={`${styles.queueStatus} ${styles[item.status]}`}>
                  {item.status === 'published' ? '발행 완료' : '대기 중'}
                </span>
                <div className={styles.queueActions}>
                  {item.status === 'pending' && (
                    <>
                      <button
                        className={`${styles.btnQueue} ${styles.publish}`}
                        onClick={() => {
                          onNav('drafts');
                        }}
                      >
                        발행하기
                      </button>
                      <button
                        className={styles.btnQueue}
                        onClick={() => removeFromQueue(item.id)}
                      >
                        제거
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 초안 추가 */}
        <button
          className={styles.btnAddToQueue}
          onClick={() => setShowDraftPicker(!showDraftPicker)}
        >
          {showDraftPicker ? '닫기' : '+ 대기열에 초안 추가'}
        </button>

        {showDraftPicker && (
          <div className={styles.draftPicker}>
            {availableDrafts.length === 0 ? (
              <p style={{ color: '#999', fontSize: 13, padding: 12 }}>
                추가할 수 있는 초안이 없습니다. 시리즈 생성에서 새 글을 만들어주세요.
              </p>
            ) : (
              <div className={styles.draftPickerList}>
                {availableDrafts.map((draft) => (
                  <div key={draft.id} className={styles.draftPickerItem}>
                    <div>
                      <div className={styles.draftPickerTitle}>{draft.title || '(제목 없음)'}</div>
                      <div className={styles.draftPickerMeta}>
                        {draft.siteName && `${draft.siteName} · `}
                        {draft.phaseLabel && `${draft.phaseLabel} · `}
                        {new Date(draft.updatedAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    <button onClick={() => addToQueue(draft)}>추가</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

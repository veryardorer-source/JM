import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../utils/storage';
import { getCookieStatus, browserLogin, cookieLogout } from '../utils/naverApi';
import styles from './Settings.module.css';

export default function Settings() {
  const [settings, setSettings] = useState({ claudeApiKey: '', naverId: '' });
  const [cookieLogin, setCookieLogin] = useState({ loggedIn: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setSettings(getSettings());
    checkCookieStatus();
  }, []);

  const checkCookieStatus = async () => {
    try {
      const status = await getCookieStatus();
      setCookieLogin(status);
    } catch {}
  };

  const handleSave = () => {
    saveSettings(settings);
    setMsg({ type: 'success', text: '설정이 저장되었습니다.' });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleBrowserLogin = async () => {
    setLoading(true);
    setMsg({ type: 'info', text: '브라우저가 열립니다. 네이버에 로그인해주세요...' });
    try {
      const result = await browserLogin();
      setCookieLogin({ loggedIn: true });
      setMsg({ type: 'success', text: result.message });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await cookieLogout();
      setCookieLogin({ loggedIn: false });
      setMsg({ type: 'info', text: '로그아웃 되었습니다.' });
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>설정</h1>
        <p className={styles.subtitle}>네이버 블로그 발행 설정</p>
      </div>

      {msg && (
        <div className={`${styles.msg} ${styles[msg.type]}`}>{msg.text}</div>
      )}

      {/* 네이버 로그인 (쿠키 방식) */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>네이버 계정 연결</h2>

        {cookieLogin.loggedIn ? (
          <div className={styles.loggedIn}>
            <div className={styles.loginStatus}>
              <span className={styles.statusDot} />
              <span>네이버 로그인됨</span>
            </div>
            <button className={styles.btnDanger} onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        ) : (
          <div>
            <p className={styles.loginDesc}>
              버튼을 누르면 브라우저가 열립니다. 네이버에 직접 로그인하면 자동으로 연결됩니다.
            </p>
            <button
              className={styles.btnNaver}
              onClick={handleBrowserLogin}
              disabled={loading}
            >
              <span className={styles.naverLogo}>N</span>
              {loading ? '로그인 대기 중...' : '네이버 로그인'}
            </button>
          </div>
        )}
      </div>

      {/* 네이버 블로그 아이디 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>블로그 설정</h2>
        <p className={styles.guide}>
          네이버 블로그 아이디를 입력하세요. (blog.naver.com/<strong>아이디</strong>)
        </p>
        <div className={styles.field}>
          <label>네이버 아이디</label>
          <input
            type="text"
            placeholder="네이버 블로그 아이디"
            value={settings.naverId || ''}
            onChange={(e) => setSettings({ ...settings, naverId: e.target.value })}
          />
        </div>
        <button className={styles.btnPrimary} onClick={handleSave}>
          저장
        </button>
      </div>

      {/* Claude API 설정 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Claude AI 설정</h2>
        <p className={styles.guide}>
          AI 자동 글쓰기에 필요합니다.{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">
            Anthropic Console
          </a>
          에서 API 키를 발급받으세요.
        </p>
        <div className={styles.field}>
          <label>Claude API Key</label>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={settings.claudeApiKey || ''}
            onChange={(e) => setSettings({ ...settings, claudeApiKey: e.target.value })}
          />
        </div>
        <button className={styles.btnPrimary} onClick={handleSave}>
          저장
        </button>
      </div>

      {/* 사용 가이드 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>사용 방법</h2>
        <ol className={styles.steps}>
          <li>"네이버 로그인" 버튼 클릭 → 브라우저에서 직접 로그인 (1회만)</li>
          <li>네이버 블로그 아이디 입력 → 저장</li>
          <li>Claude API 키 입력 → 저장 (AI 글쓰기용)</li>
          <li>글 작성 후 "네이버 발행" 버튼 클릭!</li>
        </ol>
      </div>
    </div>
  );
}

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_PATH = path.join(__dirname, 'naver_cookies.json');

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));

// 쿠키 저장/로드 헬퍼
const saveCookies = (cookies) => {
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
};

const loadCookies = () => {
  try {
    if (fs.existsSync(COOKIES_PATH)) {
      return JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
    }
  } catch {}
  return null;
};

// 쿠키 로그인 상태 확인
app.get('/api/auth/cookie-status', (req, res) => {
  const cookies = loadCookies();
  if (cookies && cookies.length > 0) {
    const naverCookie = cookies.find(c => c.name === 'NID_AUT' || c.name === 'NID_SES');
    res.json({ loggedIn: !!naverCookie, cookieCount: cookies.length });
  } else {
    res.json({ loggedIn: false, cookieCount: 0 });
  }
});

// 브라우저 열어서 수동 로그인 → 쿠키 저장
app.post('/api/auth/browser-login', async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
      defaultViewport: { width: 1280, height: 900 },
    });

    const page = await browser.newPage();
    await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'networkidle2' });

    // 사용자가 로그인할 때까지 대기 (최대 3분)
    // 로그인 성공하면 naver.com으로 리다이렉트됨
    let loggedIn = false;
    for (let i = 0; i < 180; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const url = page.url();
      // 로그인 성공: 로그인 페이지를 벗어남
      if (!url.includes('nidlogin') && !url.includes('captcha') && !url.includes('login')) {
        loggedIn = true;
        break;
      }
      // 브라우저가 닫혔는지 체크
      if (!browser.isConnected()) {
        return res.status(400).json({ error: '브라우저가 닫혔습니다. 다시 시도해주세요.' });
      }
    }

    if (!loggedIn) {
      await browser.close();
      return res.status(408).json({ error: '로그인 시간 초과 (3분). 다시 시도해주세요.' });
    }

    // 쿠키 저장
    await new Promise(r => setTimeout(r, 2000));
    const cookies = await page.cookies();
    saveCookies(cookies);

    // 로그인한 사용자 아이디 추출 시도
    let userId = '';
    try {
      await page.goto('https://www.naver.com', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1000));
      userId = await page.evaluate(() => {
        // 네이버 메인의 로그인 영역에서 아이디 추출
        const el = document.querySelector('.MyView-module__link_login___HpHMW, .link_login, [class*="login"] .id, [class*="Login"] a');
        return el?.textContent?.trim() || '';
      });
    } catch {}

    await browser.close();

    res.json({
      success: true,
      message: '로그인 성공! 쿠키가 저장되었습니다.',
      userId,
    });
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: `로그인 실패: ${err.message}` });
  }
});

// 쿠키 삭제 (로그아웃)
app.post('/api/auth/cookie-logout', (req, res) => {
  try {
    if (fs.existsSync(COOKIES_PATH)) fs.unlinkSync(COOKIES_PATH);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Naver OAuth - 액세스 토큰 교환
app.post('/api/auth/token', async (req, res) => {
  const { code, state, clientId, clientSecret } = req.body;
  try {
    const response = await axios.get('https://nid.naver.com/oauth2.0/token', {
      params: {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        state,
      },
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Naver OAuth - 토큰 갱신
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken, clientId, clientSecret } = req.body;
  try {
    const response = await axios.get('https://nid.naver.com/oauth2.0/token', {
      params: {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      },
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 네이버 블로그 포스팅
app.post('/api/blog/post', async (req, res) => {
  const { accessToken, title, contents, tags, isPublic } = req.body;
  try {
    const params = new URLSearchParams();
    params.append('title', title);
    params.append('contents', contents);
    if (tags) params.append('tags', tags);
    params.append('isPublic', isPublic ? '1' : '0');

    const response = await axios.post(
      'https://openapi.naver.com/v1/blog/writePost.json',
      params,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    const msg = err.response?.data || err.message;
    res.status(err.response?.status || 500).json({ error: msg });
  }
});

// 네이버 사용자 정보 조회
app.get('/api/user/info', async (req, res) => {
  const { accessToken } = req.query;
  try {
    const response = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// Claude AI 블로그 글 생성
app.post('/api/ai/generate', async (req, res) => {
  const { apiKey, topic, keywords, images, tone } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'Claude API 키가 필요합니다.' });
  if (!topic) return res.status(400).json({ error: '주제를 입력해주세요.' });

  try {
    const client = new Anthropic({ apiKey });

    const imageCount = images?.length || 0;
    const imagePositionGuide = imageCount > 0
      ? `\n\n사용자가 ${imageCount}장의 사진을 제공했습니다. 글 중간중간에 자연스럽게 사진을 배치해주세요.
사진 위치를 표시할 때는 {{IMAGE_1}}, {{IMAGE_2}} 등의 형식으로 표시해주세요.
각 사진 아래에는 간단한 설명 캡션도 넣어주세요.`
      : '';

    const systemPrompt = `당신은 네이버 블로그 전문 작가입니다. 다음 규칙을 반드시 따르세요:

1. **글 스타일**: 전문적이면서도 친근한 톤. 정보 전달력이 높고, 독자가 끝까지 읽고 싶은 글.
2. **SEO 최적화**: 네이버 검색 로직(C-Rank, D.I.A.)에 최적화된 글을 작성하세요.
   - 핵심 키워드를 제목, 소제목, 본문에 자연스럽게 반복 (3~5회)
   - 소제목(h2, h3)을 활용해 구조화된 글 작성
   - 2000자 이상의 충실한 본문
   - 문단을 짧게 나누어 가독성 확보
3. **HTML 형식**: 네이버 블로그에 바로 올릴 수 있는 HTML로 작성하세요.
   - <h2>, <h3> 태그로 소제목
   - <p> 태그로 문단
   - <strong>, <em> 태그로 강조
   - <ul>, <li> 태그로 목록
   - 줄바꿈은 <br> 사용
4. **글 구성**:
   - 도입부: 공감을 이끄는 인사 또는 질문으로 시작
   - 본문: 핵심 정보를 소제목별로 정리
   - 마무리: 요약 + 행동 유도(댓글, 공유 등)
5. **태그 추천**: 글 맨 마지막에 <!-- TAGS: 태그1,태그2,태그3 --> 형식으로 추천 태그를 포함하세요.${imagePositionGuide}`;

    const userMessage = `주제: ${topic}
${keywords ? `키워드: ${keywords}` : ''}
${tone ? `추가 톤/스타일 요청: ${tone}` : ''}

위 주제로 네이버 블로그 포스팅을 HTML 형식으로 작성해주세요.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const generatedText = response.content[0].text;

    // 태그 추출
    const tagMatch = generatedText.match(/<!-- TAGS: (.+?) -->/);
    const suggestedTags = tagMatch ? tagMatch[1] : '';

    // 태그 코멘트 제거한 본문
    let cleanContent = generatedText.replace(/<!-- TAGS: .+? -->/, '').trim();

    // 이미지 삽입
    if (images && images.length > 0) {
      images.forEach((img, i) => {
        const placeholder = `{{IMAGE_${i + 1}}}`;
        const imgHtml = `<div style="text-align:center;margin:20px 0;"><img src="${img.data}" alt="${img.name || `사진 ${i + 1}`}" style="max-width:100%;border-radius:8px;"></div>`;
        cleanContent = cleanContent.replace(placeholder, imgHtml);
      });
      // 남은 플레이스홀더 제거
      cleanContent = cleanContent.replace(/\{\{IMAGE_\d+\}\}/g, '');
    }

    // 제목 추출 (첫 h1 또는 h2)
    const titleMatch = cleanContent.match(/<h[12][^>]*>(.+?)<\/h[12]>/);
    const suggestedTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : topic;

    res.json({
      title: suggestedTitle,
      content: cleanContent,
      tags: suggestedTags,
    });
  } catch (err) {
    const msg = err.message || '글 생성 실패';
    res.status(500).json({ error: msg });
  }
});

// Puppeteer 네이버 블로그 자동 발행 (저장된 쿠키 사용)
app.post('/api/blog/puppeteer-post', async (req, res) => {
  const { naverId, title, content, tags, isPublic } = req.body;

  const cookies = loadCookies();
  if (!cookies || cookies.length === 0) {
    return res.status(401).json({ error: '저장된 로그인 정보가 없습니다. 먼저 네이버 로그인을 해주세요.' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
      defaultViewport: { width: 1280, height: 900 },
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 저장된 쿠키 로드
    await page.setCookie(...cookies);

    // 블로그 글쓰기 페이지로 이동
    const blogId = naverId || '';
    const writeUrl = blogId
      ? `https://blog.naver.com/${blogId}/postwrite`
      : 'https://blog.naver.com/GoBlogWrite.naver';
    await page.goto(writeUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    // 로그인 상태 확인 (로그인 페이지로 리다이렉트 되었는지)
    const currentUrl = page.url();
    if (currentUrl.includes('nidlogin') || currentUrl.includes('login')) {
      await browser.close();
      // 쿠키 만료
      if (fs.existsSync(COOKIES_PATH)) fs.unlinkSync(COOKIES_PATH);
      return res.status(401).json({ error: '로그인이 만료되었습니다. 다시 네이버 로그인을 해주세요.' });
    }

    // 제목 입력
    try {
      await page.waitForSelector('.se-title-text', { timeout: 10000 });
      await page.click('.se-title-text');
      await page.keyboard.type(title, { delay: 30 });
    } catch {
      try {
        await page.waitForSelector('[placeholder*="제목"]', { timeout: 5000 });
        await page.click('[placeholder*="제목"]');
        await page.keyboard.type(title, { delay: 30 });
      } catch {
        await browser.close();
        return res.status(500).json({ error: '에디터 제목 입력 실패.' });
      }
    }

    await new Promise(r => setTimeout(r, 500));

    // 본문 입력
    try {
      await page.click('.se-content');
      await new Promise(r => setTimeout(r, 300));

      const plainText = content.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      await page.keyboard.type(plainText, { delay: 10 });
    } catch {
      await browser.close();
      return res.status(500).json({ error: '에디터 본문 입력 실패.' });
    }

    // 발행
    await new Promise(r => setTimeout(r, 1000));
    try {
      const publishBtn = await page.$('.publish_btn__Y5mLP')
        || await page.$('[class*="publish_btn"]')
        || await page.$('[class*="PublishBtn"]');
      if (publishBtn) {
        await publishBtn.click();
        await new Promise(r => setTimeout(r, 2000));

        if (!isPublic) {
          const privateRadio = await page.$('[value="private"]') || await page.$('[class*="private"]');
          if (privateRadio) await privateRadio.click();
        }

        const confirmBtn = await page.$('.confirm_btn')
          || await page.$('[class*="confirm_btn"]')
          || await page.$('[class*="ConfirmBtn"]');
        if (confirmBtn) {
          await confirmBtn.click();
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    } catch {}

    const finalUrl = page.url();
    await browser.close();

    res.json({
      success: true,
      message: '포스팅이 완료되었습니다.',
      url: finalUrl,
    });
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: `자동 발행 실패: ${err.message}` });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ 백엔드 서버 실행 중: http://localhost:${PORT}`);
});

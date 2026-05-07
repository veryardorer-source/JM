export const getSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('naver_settings') || '{}');
  } catch {
    return {};
  }
};

export const saveSettings = (settings) => {
  localStorage.setItem('naver_settings', JSON.stringify(settings));
};

export const getAuth = () => {
  try {
    return JSON.parse(localStorage.getItem('naver_auth') || '{}');
  } catch {
    return {};
  }
};

export const saveAuth = (auth) => {
  localStorage.setItem('naver_auth', JSON.stringify(auth));
};

export const clearAuth = () => {
  localStorage.removeItem('naver_auth');
};

export const getDrafts = () => {
  try {
    return JSON.parse(localStorage.getItem('blog_drafts') || '[]');
  } catch {
    return [];
  }
};

export const saveDraft = (draft) => {
  const drafts = getDrafts();
  const idx = drafts.findIndex((d) => d.id === draft.id);
  if (idx >= 0) {
    drafts[idx] = { ...draft, updatedAt: new Date().toISOString() };
  } else {
    drafts.unshift({ ...draft, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  localStorage.setItem('blog_drafts', JSON.stringify(drafts));
  return drafts;
};

export const deleteDraft = (id) => {
  const drafts = getDrafts().filter((d) => d.id !== id);
  localStorage.setItem('blog_drafts', JSON.stringify(drafts));
  return drafts;
};

export const getPostedList = () => {
  try {
    return JSON.parse(localStorage.getItem('posted_list') || '[]');
  } catch {
    return [];
  }
};

export const addPosted = (post) => {
  const list = getPostedList();
  list.unshift({ ...post, postedAt: new Date().toISOString() });
  localStorage.setItem('posted_list', JSON.stringify(list));
  return list;
};

// === 현장 관리 ===
export const getSites = () => {
  try {
    return JSON.parse(localStorage.getItem('blog_sites') || '[]');
  } catch {
    return [];
  }
};

export const saveSite = (site) => {
  const sites = getSites();
  const idx = sites.findIndex((s) => s.id === site.id);
  if (idx >= 0) {
    sites[idx] = { ...site, updatedAt: new Date().toISOString() };
  } else {
    sites.unshift({ ...site, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  localStorage.setItem('blog_sites', JSON.stringify(sites));
  return sites;
};

export const deleteSite = (id) => {
  const sites = getSites().filter((s) => s.id !== id);
  localStorage.setItem('blog_sites', JSON.stringify(sites));
  return sites;
};

// === 발행 스케줄 ===
export const getSchedule = () => {
  try {
    return JSON.parse(localStorage.getItem('blog_schedule') || '{}');
  } catch {
    return {};
  }
};

export const saveSchedule = (schedule) => {
  localStorage.setItem('blog_schedule', JSON.stringify(schedule));
};

// ===== 페이지 목록 =====
const pages = document.querySelectorAll('.catalog-page');
const totalPages = pages.length;
let currentPage = 0;

// ===== 페이지 네비게이션 초기화 =====
const dotsContainer = document.getElementById('pageDots');
const currentPageEl = document.getElementById('currentPage');
const totalPagesEl = document.getElementById('totalPages');

totalPagesEl.textContent = String(totalPages).padStart(2, '0');

pages.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'page-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => scrollToPage(i));
    dotsContainer.appendChild(dot);
});

// ===== 스크롤 감지 =====
const pageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const pageIndex = Array.from(pages).indexOf(entry.target);
            currentPage = pageIndex;
            updatePageIndicator(pageIndex);
            animatePageContent(entry.target);
            updateNavColor();
        }
    });
}, { threshold: 0.45 });

pages.forEach(page => pageObserver.observe(page));

function updatePageIndicator(index) {
    currentPageEl.textContent = String(index + 1).padStart(2, '0');
    document.querySelectorAll('.page-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function scrollToPage(index) {
    pages[index].scrollIntoView({ behavior: 'smooth' });
}

// ===== 화살표 네비게이션 =====
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 0) scrollToPage(currentPage - 1);
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < totalPages - 1) scrollToPage(currentPage + 1);
});

// ===== 키보드 네비게이션 =====
document.addEventListener('keydown', (e) => {
    if (document.getElementById('galleryModal').classList.contains('active')) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentPage < totalPages - 1) scrollToPage(currentPage + 1);
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentPage > 0) scrollToPage(currentPage - 1);
    }
});

// ===== 페이지 콘텐츠 애니메이션 =====
const animatedPages = new Set();

function animatePageContent(page) {
    if (animatedPages.has(page)) return;
    animatedPages.add(page);
    const elements = page.querySelectorAll('.fade-up');
    elements.forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), 80 + i * 100);
    });
}

document.querySelectorAll(
    '.page-number, .page-label, .page-title, .title-bar, ' +
    '.about-lead, .about-body > p, .about-highlights, ' +
    '.svc-card, .port-item, ' +
    '.proc-step, .proc-img, ' +
    '.back-contact, .back-divider, .back-message'
).forEach(el => el.classList.add('fade-up'));

document.querySelectorAll('.stack-img').forEach(el => el.classList.add('fade-up'));
animatedPages.add(pages[0]);

// ===== 프로젝트별 이미지 맵 구축 =====
// 프로젝트 폴더명 → 이미지 경로 배열
const projectImages = {};

// 모든 port-item에서 프로젝트 정보 수집
document.querySelectorAll('.port-item[data-project]').forEach(item => {
    const proj = item.dataset.project;
    if (!projectImages[proj]) {
        // 이미지 파일 패턴으로 생성 (00.jpg ~ 05.jpg)
        const images = [];
        for (let i = 0; i <= 9; i++) {
            images.push(`images/projects/${proj}/${String(i).padStart(2, '0')}.jpg`);
        }
        projectImages[proj] = images;
    }
});

// ===== 갤러리 모달 =====
const gallery = document.getElementById('galleryModal');
const galleryImg = document.getElementById('galleryImg');
const galleryTitle = document.getElementById('galleryTitle');
const galleryLocation = document.getElementById('galleryLocation');
const galleryCounter = document.getElementById('galleryCounter');
const galleryThumbs = document.getElementById('galleryThumbs');

let galleryImages = [];
let galleryIndex = 0;
let galleryName = '';
let galleryLoc = '';

// 실제 존재하는 이미지만 필터링
async function filterExistingImages(images) {
    const results = await Promise.all(
        images.map(src => new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => resolve(null);
            img.src = src;
        }))
    );
    return results.filter(Boolean);
}

document.querySelectorAll('.port-item[data-project]').forEach(item => {
    item.addEventListener('click', async () => {
        const proj = item.dataset.project;
        galleryName = item.dataset.title;
        galleryLoc = item.dataset.location;

        // 이미지 로드 체크
        const candidates = projectImages[proj] || [];
        galleryImages = await filterExistingImages(candidates);

        if (galleryImages.length === 0) return;

        // 클릭한 이미지와 가장 가까운 인덱스로 시작
        const clickedSrc = item.querySelector('img').src;
        const clickedFile = clickedSrc.split('/').pop();
        galleryIndex = galleryImages.findIndex(s => s.endsWith(clickedFile));
        if (galleryIndex < 0) galleryIndex = 0;

        openGallery();
    });
});

function openGallery() {
    buildThumbs();
    updateGallery();
    gallery.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeGallery() {
    gallery.classList.remove('active');
    document.body.style.overflow = '';
}

function updateGallery() {
    galleryImg.src = galleryImages[galleryIndex];
    galleryTitle.textContent = galleryName;
    galleryLocation.textContent = galleryLoc;
    galleryCounter.textContent = `${galleryIndex + 1} / ${galleryImages.length}`;

    // 썸네일 활성화
    galleryThumbs.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === galleryIndex);
    });

    // 활성 썸네일 스크롤
    const activeThumb = galleryThumbs.querySelector('.gallery-thumb.active');
    if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function buildThumbs() {
    galleryThumbs.innerHTML = '';
    galleryImages.forEach((src, i) => {
        const thumb = document.createElement('div');
        thumb.className = 'gallery-thumb' + (i === galleryIndex ? ' active' : '');
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        thumb.appendChild(img);
        thumb.addEventListener('click', () => {
            galleryIndex = i;
            updateGallery();
        });
        galleryThumbs.appendChild(thumb);
    });
}

function galleryNext() {
    galleryIndex = (galleryIndex + 1) % galleryImages.length;
    updateGallery();
}

function galleryPrev() {
    galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
    updateGallery();
}

document.getElementById('galleryClose').addEventListener('click', closeGallery);
document.getElementById('galleryNext').addEventListener('click', galleryNext);
document.getElementById('galleryPrev').addEventListener('click', galleryPrev);

document.querySelector('.gallery-backdrop').addEventListener('click', closeGallery);

document.addEventListener('keydown', (e) => {
    if (!gallery.classList.contains('active')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowRight') galleryNext();
    if (e.key === 'ArrowLeft') galleryPrev();
});

// ===== 페이지 네비 색상 자동 조절 =====
function updateNavColor() {
    const arrows = document.querySelectorAll('.page-arrow');
    const isDark = currentPage === 0 || currentPage === totalPages - 1;

    if (isDark) {
        currentPageEl.style.color = 'rgba(255,255,255,0.9)';
        document.querySelector('.total-pages').style.color = 'rgba(255,255,255,0.4)';
        document.querySelectorAll('.page-dot').forEach(d => {
            if (!d.classList.contains('active')) {
                d.style.background = 'rgba(255,255,255,0.2)';
                d.style.boxShadow = 'none';
            } else {
                d.style.background = 'rgba(255,255,255,0.9)';
                d.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.15)';
            }
        });
        arrows.forEach(a => {
            a.style.borderColor = 'rgba(255,255,255,0.2)';
            a.style.background = 'rgba(255,255,255,0.08)';
            a.querySelector('svg').style.stroke = 'rgba(255,255,255,0.7)';
        });
    } else {
        currentPageEl.style.color = '';
        document.querySelector('.total-pages').style.color = '';
        document.querySelectorAll('.page-dot').forEach(d => {
            d.style.background = '';
            d.style.boxShadow = '';
        });
        arrows.forEach(a => {
            a.style.borderColor = '';
            a.style.background = '';
            a.querySelector('svg').style.stroke = '';
        });
    }
}

updateNavColor();

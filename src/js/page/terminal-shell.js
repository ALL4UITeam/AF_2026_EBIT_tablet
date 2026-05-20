const menuBtn = document.getElementById('alMenuBtn');
const sidenav = document.getElementById('alSidenav');

menuBtn?.addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
    sidenav?.classList.toggle('is-open');
    const expanded = sidenav?.classList.contains('is-open') ?? false;
    menuBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', expanded ? '메뉴 닫기' : '메뉴 열기');
});

const photoPage = document.querySelector('[data-term-photo-page]');
const photoFileInput = document.getElementById('term-photo-file');
const photoCountEl = photoPage?.querySelector('[data-term-photo-count]');
photoFileInput?.addEventListener('change', () => {
    const n = Math.min(photoFileInput.files?.length ?? 0, 3);
    if (photoCountEl) {
        photoCountEl.textContent = String(n);
    }
});

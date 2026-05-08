/** GLightbox는 `meta.html`에서 로드되는 전역 `window.GLightbox`를 사용합니다. */

export function initGlightbox() {
    if (typeof window.GLightbox !== 'function') return;
    if (!document.querySelector('.glightbox')) return;

    window.GLightbox({
        selector: '.glightbox',
        loop: true,
        keyboardNavigation: true,
        touchNavigation: true,
    });
}

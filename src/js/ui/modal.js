function qs(selector, parent = document) {
    return parent.querySelector(selector);
}

function qsa(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
}

function setOpen(modal, open) {
    if (!modal) return;
    modal.dataset.open = open ? 'true' : 'false';
    modal.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) {
        const dialog = modal.querySelector('[role="dialog"]');
        if (dialog instanceof HTMLElement) {
            dialog.focus({ preventScroll: true });
        }
    }
}

export function initModals() {
    document.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        const togglePw = target.closest('[data-al-pw-toggle]');
        if (togglePw instanceof HTMLButtonElement) {
            const wrap = togglePw.closest('.modal-detail__control--password');
            const pwInput = wrap?.querySelector('.modal-detail__text-input--password');
            if (pwInput instanceof HTMLInputElement) {
                e.preventDefault();
                const isPassword = pwInput.type === 'password';
                pwInput.type = isPassword ? 'text' : 'password';
                togglePw.classList.toggle('is-visible', isPassword);
                togglePw.setAttribute('aria-label', isPassword ? '비밀번호 숨기기' : '비밀번호 표시');
                togglePw.setAttribute('aria-pressed', String(isPassword));
                return;
            }
        }

        const openBtn = target.closest('[data-al-modal-open]');
        if (openBtn) {
            const id = openBtn.getAttribute('data-al-modal-open');
            if (!id) return;
            const modal = qs(`#${CSS.escape(id)}`);
            setOpen(modal, true);
            return;
        }

        const closeBtn = target.closest('[data-al-modal-close]');
        if (closeBtn) {
            const id = closeBtn.getAttribute('data-al-modal-close');
            const modal = id ? qs(`#${CSS.escape(id)}`) : closeBtn.closest('[data-al-modal-backdrop]');
            setOpen(modal, false);
            return;
        }

        const backdrop = target.closest('[data-al-modal-backdrop]');
        if (backdrop && target === backdrop) {
            setOpen(backdrop, false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        qsa('[data-al-modal-backdrop][data-open="true"]').forEach((modal) => {
            setOpen(modal, false);
        });
    });
}

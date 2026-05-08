/**
 * 권한 관리 페이지 (`07_사용자관리_권한관리.html`)
 */
export function initPermissionMgmtPage() {
    const root = document.getElementById('permMgmtPage');
    if (!root) return;

    const detailName = root.querySelector('[data-perm-mgmt-detail-name]');
    const detailNum = root.querySelector('[data-perm-mgmt-detail-num]');

    root.querySelectorAll('[data-perm-mgmt-group]').forEach((card) => {
        card.addEventListener('click', () => {
            root.querySelectorAll('[data-perm-mgmt-group]').forEach((c) => {
                c.classList.remove('perm-mgmt__group-card--active');
            });
            card.classList.add('perm-mgmt__group-card--active');

            const name = card.getAttribute('data-perm-mgmt-group') || '';
            const cur = card.getAttribute('data-perm-mgmt-current') || '';
            if (detailName) detailName.textContent = name;
            if (detailNum) detailNum.textContent = cur;
        });
    });

    const selectAll = root.querySelector('[data-perm-mgmt-select-all]');
    const tree = root.querySelector('[data-perm-mgmt-tree]');
    const treeChecks = tree
        ? [...tree.querySelectorAll('input[type="checkbox"][data-perm-node-check]')]
        : [];

    selectAll?.addEventListener('change', () => {
        const master = /** @type {HTMLInputElement} */ (selectAll);
        const on = master.checked;
        treeChecks.forEach((cb) => {
            if (cb instanceof HTMLInputElement) cb.checked = on;
        });
    });

    root.querySelectorAll('[data-perm-tree-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const branch = btn.closest('[data-perm-tree-branch]');
            if (!branch || branch.hasAttribute('data-perm-tree-leaf')) return;
            branch.classList.toggle('is-collapsed');
            const collapsed = branch.classList.contains('is-collapsed');
            btn.setAttribute('aria-expanded', String(!collapsed));
        });
    });

    root.querySelectorAll('[data-perm-tree-branch]:not([data-perm-tree-leaf])').forEach((branch) => {
        const btn = branch.querySelector('[data-perm-tree-toggle]');
        const collapsed = branch.classList.contains('is-collapsed');
        btn?.setAttribute('aria-expanded', String(!collapsed));
    });

    root.querySelector('.perm-mgmt__search-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
    });
}

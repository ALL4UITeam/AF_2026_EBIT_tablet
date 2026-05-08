import '../../scss/main.scss';

import { initFileUpload, renderFileList, makeFileId } from '../ui/fileUpload.js';
import { initModals } from '../ui/modal.js';
import { initTabs } from '../ui/tabs.js';
import { initToggle } from '../ui/toggle.js';
import { initPagination } from '../ui/pagination.js';
import { initSidenav } from '../ui/sidenav.js';
import { initGlightbox } from '../ui/glightbox.js';
import { initPermissionMgmtPage } from '../ui/permissionMgmt.js';
import '../common/CustomSelect.js';

/**
 * @typedef {{ id: string, file: File }} GuideFileRow
 */

function initGuidePage() {
    const root = document.getElementById('alContent');
    if (!root) return;

    /** @type {{ files: GuideFileRow[], filteredFiles: GuideFileRow[], currentPage: number, pageSize: number }} */
    const model = {
        files: [],
        filteredFiles: [],
        currentPage: 1,
        pageSize: 5,
    };

    const { render: renderPagination } = initPagination(
        root,
        () => ({
            currentPage: model.currentPage,
            totalPages: Math.max(1, Math.ceil(model.filteredFiles.length / model.pageSize)),
        }),
        (page) => {
            const totalPages = Math.max(1, Math.ceil(model.filteredFiles.length / model.pageSize));
            model.currentPage = Math.min(Math.max(1, page), totalPages);
            refreshListView();
        }
    );

    function handleDownload(fileId) {
        const target = model.files.find((item) => item.id === fileId);
        if (!target) return;

        const url = URL.createObjectURL(target.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = target.file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function handleRemove(fileId) {
        model.files = model.files.filter((item) => item.id !== fileId);
        applyFilter();
    }

    function refreshListView() {
        const totalPages = Math.max(1, Math.ceil(model.filteredFiles.length / model.pageSize));
        if (model.currentPage > totalPages) {
            model.currentPage = totalPages;
        }

        const start = (model.currentPage - 1) * model.pageSize;
        const pageSlice = model.filteredFiles.slice(start, start + model.pageSize);

        renderFileList(root, pageSlice, (action, fileId) => {
            if (action === 'download') handleDownload(fileId);
            if (action === 'remove') handleRemove(fileId);
        });

        renderPagination();
    }

    function applyFilter() {
        const kw = root.querySelector('[data-al-guide-kw]');
        const keyword = (kw instanceof HTMLInputElement ? kw.value : '').trim().toLowerCase();

        model.filteredFiles = keyword
            ? model.files.filter(({ file }) => file.name.toLowerCase().includes(keyword))
            : [...model.files];

        const tot = root.querySelector('[data-al-total-count]');
        if (tot) tot.textContent = String(model.filteredFiles.length);

        model.currentPage = 1;
        refreshListView();
    }

    function appendValidFiles(/** @type {File[]} */ newFiles) {
        newFiles.forEach((file) => {
            const id = makeFileId(file);
            if (!model.files.some((row) => row.id === id)) {
                model.files.push({ id, file });
            }
        });
        applyFilter();
    }

    initFileUpload({ root, onValidFiles: appendValidFiles });
    initModals();
    initTabs(root);
    initToggle(root);
    initDatePop(root);
    initOperationTaskAttach(root);
    initBrightnessControls(root);
    initBatterySocRanges(root);
    initIssueFilterTabs(root);
    initMapLegendToggles(root);

    const searchBtn = root.querySelector('[data-al-guide-search]');
    const kw = root.querySelector('[data-al-guide-kw]');

    const runSearch = () => applyFilter();
    searchBtn?.addEventListener('click', runSearch);
    kw?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runSearch();
    });

    applyFilter();
}

function initOperationTaskAttach(root) {
    const backdrop = root.querySelector('#operation-task-content');
    if (!backdrop) return;

    const attach = backdrop.querySelector('.op-task__attach');
    if (!attach) return;

    const input = attach.querySelector('#operationTaskApkFile');
    const pickBtn = attach.querySelector('[data-al-file-pick]');
    const dropzone = attach.querySelector('[data-al-file-dropzone]');
    const message = attach.querySelector('[data-al-file-message]');

    const clearMessage = () => {
        if (!message) return;
        message.replaceChildren();
        message.setAttribute('hidden', '');
    };

    const openPicker = () => {
        clearMessage();
        input?.click();
    };

    pickBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        openPicker();
    });

    dropzone?.addEventListener('click', (e) => {
        if (pickBtn && e.target instanceof Node && pickBtn.contains(e.target)) return;
        openPicker();
    });

    dropzone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('file-upload__dropzone--active', 'al-file-upload__dropzone--active');
    });

    dropzone?.addEventListener('dragleave', () => {
        dropzone.classList.remove('file-upload__dropzone--active', 'al-file-upload__dropzone--active');
    });

    dropzone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('file-upload__dropzone--active', 'al-file-upload__dropzone--active');
    });
}

function initDatePop(root) {
    const closeAll = () => {
        root.querySelectorAll('[data-date-pop]').forEach((pop) => {
            if (pop instanceof HTMLElement) pop.hidden = true;
        });
    };

    const getDateValue = (button) => {
        const days = button.closest('.date-pop__days');
        if (!days) return '';
        const buttons = [...days.querySelectorAll('button')];
        const index = buttons.indexOf(button);
        const day = button.textContent?.trim().padStart(2, '0') || '';

        if (index < 2) return `2026-03-${day}`;
        if (index > 31) return `2026-05-${day}`;
        return `2026-04-${day}`;
    };

    const paintSelectedDays = (field) => {
        const start = field.dataset.dateStart;
        const end = field.dataset.dateEnd;

        field.querySelectorAll('.date-pop__days button').forEach((button) => {
            if (!(button instanceof HTMLButtonElement)) return;
            const value = getDateValue(button);
            button.classList.toggle('is-selected', value === start || value === end);
            button.classList.toggle('is-range', Boolean(start && end && value > start && value < end));
        });
    };

    root.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        const field = target.closest('.form__field--date');
        const dayButton = target.closest('.date-pop__days button');

        if (dayButton && field instanceof HTMLElement && dayButton instanceof HTMLButtonElement) {
            const pop = field.querySelector('[data-date-pop]');
            const input = field.querySelector('.form__input');
            const value = getDateValue(dayButton);

            if (!field.dataset.dateStart || field.dataset.dateEnd) {
                field.dataset.dateStart = value;
                field.dataset.dateEnd = '';
                if (input instanceof HTMLInputElement) input.value = `${value} ~ `;
            } else {
                const start = field.dataset.dateStart;
                const sorted = [start, value].sort();
                field.dataset.dateStart = sorted[0];
                field.dataset.dateEnd = sorted[1];
                if (input instanceof HTMLInputElement) input.value = `${sorted[0]} ~ ${sorted[1]}`;
                if (pop instanceof HTMLElement) pop.hidden = true;
            }

            paintSelectedDays(field);
            return;
        }

        if (!(field instanceof HTMLElement)) return;

        const pop = field.querySelector('[data-date-pop]');
        if (!(pop instanceof HTMLElement)) return;

        if (target.closest('[data-date-pop]')) return;

        const toggle = target.closest('[data-date-toggle]');
        if (toggle && field.contains(toggle)) {
            const wasHidden = pop.hidden;
            closeAll();
            pop.hidden = !wasHidden;
            paintSelectedDays(field);
            return;
        }

        if (!pop.hidden) {
            closeAll();
            paintSelectedDays(field);
        }
    });

    document.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        if (root.contains(target) && target.closest('.form__field--date')) return;
        closeAll();
    });

    root.querySelectorAll('.form__field--date').forEach((field) => {
        if (!(field instanceof HTMLElement)) return;
        field.dataset.dateStart = '2026-03-31';
        field.dataset.dateEnd = '2026-04-07';
        paintSelectedDays(field);
    });
}

function initIssueFilterTabs(root) {
    root.addEventListener('click', (event) => {
        const target = /** @type {HTMLElement} */ (event.target);
        const tab = target.closest('[data-issue-filter]');
        if (!(tab instanceof HTMLElement) || !root.contains(tab)) return;

        const card = tab.closest('.al-app-dashboard__card');
        if (!card) return;

        const filter = tab.dataset.issueFilter;
        card.querySelectorAll('[data-issue-type]').forEach((row) => {
            if (!(row instanceof HTMLElement)) return;

            const isVisible = filter === 'all' || row.dataset.issueType === filter;
            row.hidden = !isVisible;
        });
    });
}

function initMapLegendToggles(root) {
    root.addEventListener('click', (event) => {
        const target = /** @type {HTMLElement} */ (event.target);
        const button = target.closest('[data-map-legend-toggle]');
        if (!(button instanceof HTMLButtonElement) || !root.contains(button)) return;

        const isPressed = button.getAttribute('aria-pressed') === 'true';
        button.setAttribute('aria-pressed', String(!isPressed));
    });
}

function initBrightnessControls(root) {
    const clampBrightness = (value) => Math.min(100, Math.max(0, value));

    root.querySelectorAll('.adx-br').forEach((control) => {
        const bar = control.querySelector('.adx-br__bar');
        const fill = control.querySelector('.adx-br__fill');
        const thumb = control.querySelector('.adx-br__thumb');
        const valueText = control.querySelector('.adx-br__val');

        if (!(bar instanceof HTMLElement) || !(fill instanceof HTMLElement) || !(thumb instanceof HTMLElement)) return;

        let currentValue = clampBrightness(Number(bar.getAttribute('aria-valuenow')) || 0);
        let isDragging = false;

        const render = (value) => {
            currentValue = clampBrightness(value);
            const displayValue = Math.round(currentValue);

            bar.setAttribute('aria-valuenow', String(displayValue));
            bar.setAttribute('aria-valuetext', `${displayValue}%`);
            fill.style.width = `${currentValue}%`;
            thumb.style.left = `calc(${currentValue}% - 9px)`;

            if (valueText) {
                valueText.innerHTML = `${displayValue}<span>%</span>`;
            }
        };

        const updateFromPointer = (event) => {
            const rect = bar.getBoundingClientRect();
            if (!rect.width) return;

            const nextValue = ((event.clientX - rect.left) / rect.width) * 100;
            render(nextValue);
        };

        bar.tabIndex = bar.tabIndex < 0 ? 0 : bar.tabIndex;
        render(currentValue);

        bar.addEventListener('pointerdown', (event) => {
            isDragging = true;
            bar.setPointerCapture?.(event.pointerId);
            updateFromPointer(event);
        });

        bar.addEventListener('pointermove', (event) => {
            if (!isDragging) return;
            updateFromPointer(event);
        });

        bar.addEventListener('pointerup', () => {
            isDragging = false;
        });

        bar.addEventListener('pointercancel', () => {
            isDragging = false;
        });

        bar.addEventListener('keydown', (event) => {
            const keySteps = {
                ArrowLeft: -5,
                ArrowDown: -5,
                ArrowRight: 5,
                ArrowUp: 5,
                PageDown: -10,
                PageUp: 10,
            };

            if (event.key === 'Home') {
                event.preventDefault();
                render(0);
                return;
            }

            if (event.key === 'End') {
                event.preventDefault();
                render(100);
                return;
            }

            const step = keySteps[event.key];
            if (typeof step !== 'number') return;

            event.preventDefault();
            render(currentValue + step);
        });
    });
}

function initBatterySocRanges(root) {
    root.querySelectorAll('.battery-board__soc-filter').forEach((control) => {
        const range = control.querySelector('.battery-board__soc-range');
        const valueText = control.querySelector('.battery-board__soc-value strong');

        if (!(range instanceof HTMLInputElement)) return;

        const render = () => {
            const min = Number(range.min || 0);
            const max = Number(range.max || 100);
            const value = Number(range.value || 0);
            const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;

            range.style.setProperty('--battery-soc-percent', `${Math.min(100, Math.max(0, percent))}%`);

            if (valueText) {
                valueText.textContent = String(value);
            }
        };

        range.addEventListener('input', render);
        render();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initSidenav();
    initGlightbox();
    initPermissionMgmtPage();
});

initGuidePage();

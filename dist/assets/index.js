(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const DEFAULT_MAX_BYTES = 500 * 1024 * 1024;
function formatSize(size) {
  if (!Number.isFinite(size) || size < 0) return "0B";
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}MB`;
  if (size >= 1024) return `${Math.ceil(size / 1024)}KB`;
  return `${size}B`;
}
function makeFileId(file) {
  return `${file.name}__${file.size}__${file.lastModified}`;
}
function initFileUpload({ root, onValidFiles, maxBytes = DEFAULT_MAX_BYTES }) {
  const scope = root.querySelector("[data-al-file-upload]");
  if (!scope) return;
  const input = scope.querySelector("[data-al-file-input]");
  const pickBtn = scope.querySelector("[data-al-file-pick]");
  const dropzone = scope.querySelector("[data-al-file-dropzone]");
  const message = scope.querySelector("[data-al-file-message]");
  const showErrors = (errors) => {
    if (!message) return;
    message.replaceChildren();
    if (!errors.length) {
      message.setAttribute("hidden", "");
      message.removeAttribute("role");
      return;
    }
    const ul = document.createElement("ul");
    ul.className = "al-file-upload__message-list";
    errors.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      ul.appendChild(li);
    });
    message.appendChild(ul);
    message.removeAttribute("hidden");
    message.setAttribute("role", "alert");
  };
  const validate = (files) => {
    const valids = [];
    const errors = [];
    for (const file of files) {
      if (file.size > maxBytes) {
        errors.push(`${file.name} — 파일당 최대 500MB까지 허용됩니다.`);
        continue;
      }
      valids.push(file);
    }
    return { valids, errors };
  };
  const handleFiles = (fileList) => {
    const list = [...fileList];
    if (!list.length) return;
    const { valids, errors } = validate(list);
    if (errors.length) {
      showErrors(errors);
    } else {
      showErrors([]);
    }
    if (valids.length) {
      onValidFiles(valids);
    }
    if (input) {
      input.value = "";
    }
  };
  const openPicker = () => {
    showErrors([]);
    input == null ? void 0 : input.click();
  };
  pickBtn == null ? void 0 : pickBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openPicker();
  });
  dropzone == null ? void 0 : dropzone.addEventListener("click", () => {
    openPicker();
  });
  input == null ? void 0 : input.addEventListener("change", (e) => {
    const target = (
      /** @type {HTMLInputElement} */
      e.target
    );
    handleFiles(target.files || []);
  });
  dropzone == null ? void 0 : dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("file-upload__dropzone--active");
    dropzone.classList.add("al-file-upload__dropzone--active");
  });
  dropzone == null ? void 0 : dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("file-upload__dropzone--active");
    dropzone.classList.remove("al-file-upload__dropzone--active");
  });
  dropzone == null ? void 0 : dropzone.addEventListener("drop", (e) => {
    var _a;
    e.preventDefault();
    dropzone.classList.remove("file-upload__dropzone--active");
    dropzone.classList.remove("al-file-upload__dropzone--active");
    handleFiles(((_a = e.dataTransfer) == null ? void 0 : _a.files) || []);
  });
}
function renderFileList(root, pageFiles, dispatch) {
  const list = root.querySelector("[data-al-file-list]");
  if (!list) return;
  list.innerHTML = "";
  if (!pageFiles.length) {
    const empty = document.createElement("li");
    empty.className = "file-upload__item file-upload__item--empty al-file-upload__item al-file-upload__item--empty";
    empty.textContent = "파일이 없습니다.";
    list.appendChild(empty);
    return;
  }
  pageFiles.forEach(({ id, file }) => {
    const li = document.createElement("li");
    li.className = "file-upload__item al-file-upload__item";
    li.dataset.alFileId = id;
    const name = document.createElement("span");
    name.className = "file-upload__name al-file-upload__name";
    name.textContent = `${file.name} [${formatSize(file.size)}]`;
    const actions = document.createElement("div");
    actions.className = "file-upload__item-actions al-file-upload__item-actions";
    const dlBtn = document.createElement("button");
    dlBtn.type = "button";
    dlBtn.className = "file-upload__btn al-file-upload__btn";
    dlBtn.dataset.action = "download";
    dlBtn.textContent = "다운로드";
    actions.append(dlBtn);
    li.append(name, actions);
    list.appendChild(li);
  });
  list.onclick = (e) => {
    const btn = (
      /** @type {HTMLElement} */
      e.target.closest("button[data-action]")
    );
    if (!btn) return;
    const item = (
      /** @type {HTMLElement} */
      e.target.closest("[data-al-file-id]")
    );
    const fileId = item == null ? void 0 : item.dataset.alFileId;
    if (!fileId) return;
    const { action } = btn.dataset;
    if (action === "download" || action === "remove") {
      dispatch(action, fileId);
    }
  };
}
function qs(selector, parent = document) {
  return parent.querySelector(selector);
}
function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}
function setOpen(modal, open) {
  if (!modal) return;
  modal.dataset.open = open ? "true" : "false";
  modal.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) {
    const dialog = modal.querySelector('[role="dialog"]');
    if (dialog instanceof HTMLElement) {
      dialog.focus({ preventScroll: true });
    }
  }
}
function initModals() {
  document.addEventListener("click", (e) => {
    const target = (
      /** @type {HTMLElement} */
      e.target
    );
    const togglePw = target.closest("[data-al-pw-toggle]");
    if (togglePw instanceof HTMLButtonElement) {
      const wrap = togglePw.closest(".modal-detail__control--password");
      const pwInput = wrap == null ? void 0 : wrap.querySelector(".modal-detail__text-input--password");
      if (pwInput instanceof HTMLInputElement) {
        e.preventDefault();
        const isPassword = pwInput.type === "password";
        pwInput.type = isPassword ? "text" : "password";
        togglePw.classList.toggle("is-visible", isPassword);
        togglePw.setAttribute("aria-label", isPassword ? "비밀번호 숨기기" : "비밀번호 표시");
        togglePw.setAttribute("aria-pressed", String(isPassword));
        return;
      }
    }
    const openBtn = target.closest("[data-al-modal-open]");
    if (openBtn) {
      const id = openBtn.getAttribute("data-al-modal-open");
      if (!id) return;
      const modal = qs(`#${CSS.escape(id)}`);
      setOpen(modal, true);
      return;
    }
    const closeBtn = target.closest("[data-al-modal-close]");
    if (closeBtn) {
      const id = closeBtn.getAttribute("data-al-modal-close");
      const modal = id ? qs(`#${CSS.escape(id)}`) : closeBtn.closest("[data-al-modal-backdrop]");
      setOpen(modal, false);
      return;
    }
    const backdrop = target.closest("[data-al-modal-backdrop]");
    if (backdrop && target === backdrop) {
      setOpen(backdrop, false);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    qsa('[data-al-modal-backdrop][data-open="true"]').forEach((modal) => {
      setOpen(modal, false);
    });
  });
}
function initTabs(root) {
  root.addEventListener("click", (e) => {
    const target = (
      /** @type {HTMLElement} */
      e.target
    );
    const tabsRoot = target.closest("[data-al-tabs]");
    if (!tabsRoot || !root.contains(tabsRoot)) return;
    const btn = target.closest('[role="tab"]');
    if (!btn || !tabsRoot.contains(btn)) return;
    const tabId = btn.getAttribute("data-al-tab");
    if (!tabId) return;
    const tablist = tabsRoot.querySelector('[role="tablist"]');
    const tabs = tablist ? [...tablist.querySelectorAll('[role="tab"]')] : [];
    tabs.forEach((tab) => {
      const isSel = tab === btn;
      tab.setAttribute("aria-selected", isSel ? "true" : "false");
      tab.tabIndex = isSel ? 0 : -1;
      tab.classList.toggle("tabs__tab--active", isSel);
      tab.classList.toggle("al-tabs__tab--active", isSel);
      const panelId = tab.getAttribute("aria-controls");
      const currentTabId = tab.getAttribute("data-al-tab");
      const panel = panelId ? document.getElementById(panelId) : currentTabId ? tabsRoot.querySelector(`[data-al-tabpanel="${CSS.escape(currentTabId)}"]`) : null;
      if (panel) {
        panel.classList.toggle("tabs__panel--active", isSel);
        panel.classList.toggle("al-tabs__panel--active", isSel);
        if (isSel) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
      }
    });
  });
}
function initToggle(root) {
  root.addEventListener("click", (e) => {
    const target = (
      /** @type {HTMLElement} */
      e.target
    );
    const sw = target.closest("[data-al-toggle]");
    if (!sw || !root.contains(sw)) return;
    if (sw.getAttribute("role") !== "switch") return;
    const pressed = sw.getAttribute("aria-checked") === "true";
    const next = !pressed;
    sw.setAttribute("aria-checked", next ? "true" : "false");
  });
}
function buildPageItems(current, total) {
  if (total <= 1) return [1];
  if (total <= 9) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  if (current <= 5) {
    return [1, 2, 3, 4, 5, 6, 7, 8, "ellipsis", total];
  }
  if (current >= total - 4) {
    return [1, "ellipsis", total - 7, total - 6, total - 5, total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 2, current - 1, current, current + 1, current + 2, "ellipsis", total];
}
function initPagination(root, getModel, onPageChange) {
  const nav = root.querySelector("[data-al-pagination]");
  if (!nav) {
    return { render: () => {
    } };
  }
  const demoTotal = Number(nav.getAttribute("data-al-pagination-total"));
  const demoCurrent = Number(nav.getAttribute("data-al-pagination-current"));
  const demoModel = Number.isFinite(demoTotal) && demoTotal > 0 ? {
    currentPage: Number.isFinite(demoCurrent) && demoCurrent > 0 ? demoCurrent : 1,
    totalPages: demoTotal
  } : null;
  const pagesEl = nav.querySelector("[data-al-pagination-pages]");
  const firstBtn = nav.querySelector("[data-al-page-first]");
  const prevBtn = nav.querySelector("[data-al-page-prev]");
  const nextBtn = nav.querySelector("[data-al-page-next]");
  const lastBtn = nav.querySelector("[data-al-page-last]");
  const render = () => {
    const { currentPage, totalPages } = demoModel || getModel();
    if (firstBtn) firstBtn.disabled = currentPage <= 1 || totalPages <= 1;
    if (prevBtn) prevBtn.disabled = currentPage <= 1 || totalPages <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages || totalPages <= 1;
    if (lastBtn) lastBtn.disabled = currentPage >= totalPages || totalPages <= 1;
    if (!pagesEl) return;
    pagesEl.innerHTML = "";
    const items = buildPageItems(currentPage, totalPages);
    items.forEach((item) => {
      if (item === "ellipsis") {
        const span = document.createElement("span");
        span.className = "al-pagination__ellipsis";
        span.setAttribute("aria-hidden", "true");
        span.textContent = "…";
        pagesEl.appendChild(span);
        return;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "al-pagination__page";
      btn.dataset.alPageNum = String(item);
      btn.textContent = String(item);
      if (item === currentPage) {
        btn.classList.add("al-pagination__page--active");
        btn.setAttribute("aria-current", "page");
      }
      pagesEl.appendChild(btn);
    });
  };
  nav.addEventListener("click", (e) => {
    const target = (
      /** @type {HTMLElement} */
      e.target
    );
    const { currentPage, totalPages } = demoModel || getModel();
    const setPage = (page) => {
      if (demoModel) {
        demoModel.currentPage = Math.min(Math.max(1, page), demoModel.totalPages);
        render();
        return;
      }
      onPageChange(page);
    };
    const pageBtn = target.closest("[data-al-page-num]");
    if (pageBtn) {
      const page = Number(pageBtn.getAttribute("data-al-page-num"));
      if (!Number.isFinite(page)) return;
      setPage(page);
      return;
    }
    if (target.closest("[data-al-page-first]")) {
      setPage(1);
      return;
    }
    if (target.closest("[data-al-page-prev]")) {
      setPage(Math.max(1, currentPage - 1));
      return;
    }
    if (target.closest("[data-al-page-next]")) {
      setPage(Math.min(totalPages, currentPage + 1));
      return;
    }
    if (target.closest("[data-al-page-last]")) {
      setPage(totalPages);
    }
  });
  return { render };
}
const MQ_TABLET = window.matchMedia("(max-width: 1279px)");
function initNavAccordion() {
  const triggers = document.querySelectorAll(".al-sidenav__trigger");
  triggers.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".al-sidenav__item");
      if (!item) return;
      const wasOpen = item.classList.contains("is-open");
      document.querySelectorAll(".al-sidenav__item.is-open").forEach((el) => {
        el.classList.remove("is-open");
        const b = el.querySelector(".al-sidenav__trigger");
        if (b) b.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}
function initDrawer() {
  const sidenav = document.getElementById("alSidenav");
  const backdrop = document.getElementById("alBackdrop");
  const menuBtn = document.getElementById("alMenuBtn");
  if (!sidenav || !backdrop || !menuBtn) return;
  function open() {
    sidenav.classList.add("is-open");
    backdrop.classList.add("is-visible");
    document.body.classList.add("al-drawer-open");
    menuBtn.setAttribute("aria-expanded", "true");
  }
  function close() {
    sidenav.classList.remove("is-open");
    backdrop.classList.remove("is-visible");
    document.body.classList.remove("al-drawer-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
  menuBtn.addEventListener("click", () => {
    if (!MQ_TABLET.matches) return;
    sidenav.classList.contains("is-open") ? close() : open();
  });
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && MQ_TABLET.matches && sidenav.classList.contains("is-open")) {
      close();
    }
  });
  function sync() {
    if (!MQ_TABLET.matches) close();
  }
  MQ_TABLET.addEventListener("change", sync);
  sync();
}
function initSidenav() {
  initNavAccordion();
  initDrawer();
}
function initGlightbox() {
  if (typeof window.GLightbox !== "function") return;
  if (!document.querySelector(".glightbox")) return;
  window.GLightbox({
    selector: ".glightbox",
    loop: true,
    keyboardNavigation: true,
    touchNavigation: true
  });
}
function initPermissionMgmtPage() {
  var _a;
  const root = document.getElementById("permMgmtPage");
  if (!root) return;
  const detailName = root.querySelector("[data-perm-mgmt-detail-name]");
  const detailNum = root.querySelector("[data-perm-mgmt-detail-num]");
  root.querySelectorAll("[data-perm-mgmt-group]").forEach((card) => {
    card.addEventListener("click", () => {
      root.querySelectorAll("[data-perm-mgmt-group]").forEach((c) => {
        c.classList.remove("perm-mgmt__group-card--active");
      });
      card.classList.add("perm-mgmt__group-card--active");
      const name = card.getAttribute("data-perm-mgmt-group") || "";
      const cur = card.getAttribute("data-perm-mgmt-current") || "";
      if (detailName) detailName.textContent = name;
      if (detailNum) detailNum.textContent = cur;
    });
  });
  const selectAll = root.querySelector("[data-perm-mgmt-select-all]");
  const tree = root.querySelector("[data-perm-mgmt-tree]");
  const treeChecks = tree ? [...tree.querySelectorAll('input[type="checkbox"][data-perm-node-check]')] : [];
  selectAll == null ? void 0 : selectAll.addEventListener("change", () => {
    const master = (
      /** @type {HTMLInputElement} */
      selectAll
    );
    const on = master.checked;
    treeChecks.forEach((cb) => {
      if (cb instanceof HTMLInputElement) cb.checked = on;
    });
  });
  root.querySelectorAll("[data-perm-tree-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const branch = btn.closest("[data-perm-tree-branch]");
      if (!branch || branch.hasAttribute("data-perm-tree-leaf")) return;
      branch.classList.toggle("is-collapsed");
      const collapsed = branch.classList.contains("is-collapsed");
      btn.setAttribute("aria-expanded", String(!collapsed));
    });
  });
  root.querySelectorAll("[data-perm-tree-branch]:not([data-perm-tree-leaf])").forEach((branch) => {
    const btn = branch.querySelector("[data-perm-tree-toggle]");
    const collapsed = branch.classList.contains("is-collapsed");
    btn == null ? void 0 : btn.setAttribute("aria-expanded", String(!collapsed));
  });
  (_a = root.querySelector(".perm-mgmt__search-form")) == null ? void 0 : _a.addEventListener("submit", (e) => {
    e.preventDefault();
  });
}
class CustomSelect {
  constructor(selectElement) {
    this.select = selectElement;
    this.options = Array.from(this.select.options);
    this.selectedIndex = this.select.selectedIndex;
    this.isOpen = false;
    this.activeIndex = Math.max(0, this.selectedIndex);
    this.typeBuffer = "";
    this.typeTimer = null;
    this.init();
  }
  init() {
    this.boundKeydown = this.onKeydown.bind(this);
    if (this.select.dataset.customSelectReady === "true") return;
    this.select.dataset.customSelectReady = "true";
    this.select.style.display = "none";
    this.createCustomSelect();
    this.setupEvents();
  }
  createCustomSelect() {
    var _a;
    const wrapper = document.createElement("div");
    wrapper.className = "custom-select";
    wrapper.dataset.customSelect = "true";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "custom-select__button";
    button.textContent = ((_a = this.select.options[this.select.selectedIndex]) == null ? void 0 : _a.text) || "";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    const dropdown = document.createElement("div");
    dropdown.className = "custom-select__dropdown";
    dropdown.setAttribute("role", "listbox");
    dropdown.setAttribute("tabindex", "-1");
    this.options.forEach((option, index) => {
      const item = document.createElement("div");
      item.className = "custom-select__option";
      item.setAttribute("role", "option");
      item.id = `cs-opt-${Math.random().toString(16).slice(2)}-${index}`;
      if (index === this.selectedIndex) {
        item.classList.add("is-selected");
        item.setAttribute("aria-selected", "true");
      }
      item.textContent = option.text;
      item.dataset.value = option.value;
      item.dataset.index = index;
      item.addEventListener("click", () => {
        this.selectOption(index);
      });
      dropdown.appendChild(item);
    });
    this.select.parentNode.insertBefore(wrapper, this.select);
    wrapper.appendChild(button);
    wrapper.appendChild(dropdown);
    wrapper.appendChild(this.select);
    this.wrapper = wrapper;
    this.button = button;
    this.dropdown = dropdown;
    this.setActiveIndex(this.activeIndex, { scroll: false });
  }
  setupEvents() {
    this.boundPosition = this.updateDropdownPosition.bind(this);
    this.button.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });
    this.button.addEventListener("keydown", this.boundKeydown);
    document.addEventListener("click", (e) => {
      if (!this.wrapper.contains(e.target)) {
        this.close();
      }
    });
    document.addEventListener("custom-select:open", (e) => {
      var _a;
      if (((_a = e.detail) == null ? void 0 : _a.id) !== this.wrapper.dataset.csId) this.close();
    });
    this.select.addEventListener("change", () => {
      this.updateButton();
    });
    if (!this.wrapper.dataset.csId) {
      this.wrapper.dataset.csId = `cs-${Math.random().toString(16).slice(2)}`;
    }
    window.addEventListener("resize", this.boundPosition);
    window.addEventListener("scroll", this.boundPosition, true);
  }
  toggle() {
    this.isOpen = !this.isOpen;
    this.wrapper.classList.toggle("is-open", this.isOpen);
    this.button.setAttribute("aria-expanded", this.isOpen ? "true" : "false");
    if (this.isOpen) {
      document.dispatchEvent(new CustomEvent("custom-select:open", { detail: { id: this.wrapper.dataset.csId } }));
      this.setDropDirection();
      this.setActiveIndex(this.select.selectedIndex, { scroll: true });
    } else {
      this.wrapper.classList.remove("is-up");
    }
  }
  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.wrapper.classList.add("is-open");
    this.button.setAttribute("aria-expanded", "true");
    document.dispatchEvent(new CustomEvent("custom-select:open", { detail: { id: this.wrapper.dataset.csId } }));
    this.setDropDirection();
    this.setActiveIndex(this.select.selectedIndex, { scroll: true });
  }
  onKeydown(e) {
    const key = e.key;
    if (key === "ArrowDown") {
      e.preventDefault();
      if (!this.isOpen) this.open();
      this.setActiveIndex(Math.min(this.options.length - 1, this.activeIndex + 1), { scroll: true });
      return;
    }
    if (key === "ArrowUp") {
      e.preventDefault();
      if (!this.isOpen) this.open();
      this.setActiveIndex(Math.max(0, this.activeIndex - 1), { scroll: true });
      return;
    }
    if (key === "Home") {
      e.preventDefault();
      if (!this.isOpen) this.open();
      this.setActiveIndex(0, { scroll: true });
      return;
    }
    if (key === "End") {
      e.preventDefault();
      if (!this.isOpen) this.open();
      this.setActiveIndex(this.options.length - 1, { scroll: true });
      return;
    }
    if (key === "Enter" || key === " ") {
      e.preventDefault();
      if (!this.isOpen) {
        this.open();
        return;
      }
      this.selectOption(this.activeIndex);
      return;
    }
    if (key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }
    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.typeBuffer += key.toLowerCase();
      clearTimeout(this.typeTimer);
      this.typeTimer = setTimeout(() => this.typeBuffer = "", 450);
      const idx = this.options.findIndex((o) => o.text.toLowerCase().startsWith(this.typeBuffer));
      if (idx >= 0) {
        if (!this.isOpen) this.open();
        this.setActiveIndex(idx, { scroll: true });
      }
    }
  }
  setActiveIndex(index, { scroll }) {
    this.activeIndex = Math.max(0, Math.min(this.options.length - 1, index));
    const items = [...this.dropdown.querySelectorAll(".custom-select__option")];
    items.forEach((el, i) => {
      el.classList.toggle("is-active", i === this.activeIndex);
    });
    const active = items[this.activeIndex];
    if (active == null ? void 0 : active.id) {
      this.button.setAttribute("aria-activedescendant", active.id);
    }
    if (scroll && active) {
      const rect = active.getBoundingClientRect();
      const dRect = this.dropdown.getBoundingClientRect();
      if (rect.top < dRect.top) active.scrollIntoView({ block: "nearest" });
      if (rect.bottom > dRect.bottom) active.scrollIntoView({ block: "nearest" });
    }
  }
  setDropDirection() {
    this.updateDropdownPosition();
  }
  updateDropdownPosition() {
    if (!this.isOpen) return;
    const rect = this.button.getBoundingClientRect();
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const dropdownHeight = Math.min(this.dropdown.scrollHeight || 240, 240);
    const isUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    this.wrapper.classList.toggle("is-up", isUp);
  }
  close() {
    this.isOpen = false;
    this.wrapper.classList.remove("is-open");
    this.wrapper.classList.remove("is-up");
    this.button.setAttribute("aria-expanded", "false");
  }
  selectOption(index) {
    this.select.selectedIndex = index;
    this.selectedIndex = index;
    const event = new Event("change", { bubbles: true });
    this.select.dispatchEvent(event);
    this.updateButton();
    this.updateOptions();
    this.close();
  }
  updateButton() {
    var _a;
    this.button.textContent = ((_a = this.select.options[this.select.selectedIndex]) == null ? void 0 : _a.text) || "";
  }
  updateOptions() {
    this.dropdown.querySelectorAll(".custom-select__option").forEach((item, index) => {
      if (index === this.select.selectedIndex) {
        item.classList.add("is-selected");
        item.setAttribute("aria-selected", "true");
      } else {
        item.classList.remove("is-selected");
        item.setAttribute("aria-selected", "false");
      }
    });
    this.setActiveIndex(this.select.selectedIndex, { scroll: false });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("select.form__select, select[data-custom-select], select.js-custom-select").forEach((select) => {
    if (select.closest(".custom-select")) return;
    new CustomSelect(select);
  });
});
function initGuidePage() {
  const root = document.getElementById("alContent");
  if (!root) return;
  const model = {
    files: [],
    filteredFiles: [],
    currentPage: 1,
    pageSize: 5
  };
  const { render: renderPagination } = initPagination(
    root,
    () => ({
      currentPage: model.currentPage,
      totalPages: Math.max(1, Math.ceil(model.filteredFiles.length / model.pageSize))
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
    const a = document.createElement("a");
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
      if (action === "download") handleDownload(fileId);
      if (action === "remove") handleRemove(fileId);
    });
    renderPagination();
  }
  function applyFilter() {
    const kw2 = root.querySelector("[data-al-guide-kw]");
    const keyword = (kw2 instanceof HTMLInputElement ? kw2.value : "").trim().toLowerCase();
    model.filteredFiles = keyword ? model.files.filter(({ file }) => file.name.toLowerCase().includes(keyword)) : [...model.files];
    const tot = root.querySelector("[data-al-total-count]");
    if (tot) tot.textContent = String(model.filteredFiles.length);
    model.currentPage = 1;
    refreshListView();
  }
  function appendValidFiles(newFiles) {
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
  const searchBtn = root.querySelector("[data-al-guide-search]");
  const kw = root.querySelector("[data-al-guide-kw]");
  const runSearch = () => applyFilter();
  searchBtn == null ? void 0 : searchBtn.addEventListener("click", runSearch);
  kw == null ? void 0 : kw.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
  });
  applyFilter();
}
function initOperationTaskAttach(root) {
  const backdrop = root.querySelector("#operation-task-content");
  if (!backdrop) return;
  const attach = backdrop.querySelector(".op-task__attach");
  if (!attach) return;
  const input = attach.querySelector("#operationTaskApkFile");
  const pickBtn = attach.querySelector("[data-al-file-pick]");
  const dropzone = attach.querySelector("[data-al-file-dropzone]");
  const message = attach.querySelector("[data-al-file-message]");
  const clearMessage = () => {
    if (!message) return;
    message.replaceChildren();
    message.setAttribute("hidden", "");
  };
  const openPicker = () => {
    clearMessage();
    input == null ? void 0 : input.click();
  };
  pickBtn == null ? void 0 : pickBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openPicker();
  });
  dropzone == null ? void 0 : dropzone.addEventListener("click", (e) => {
    if (pickBtn && e.target instanceof Node && pickBtn.contains(e.target)) return;
    openPicker();
  });
  dropzone == null ? void 0 : dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("file-upload__dropzone--active", "al-file-upload__dropzone--active");
  });
  dropzone == null ? void 0 : dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("file-upload__dropzone--active", "al-file-upload__dropzone--active");
  });
  dropzone == null ? void 0 : dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("file-upload__dropzone--active", "al-file-upload__dropzone--active");
  });
}
function initDatePop(root) {
  const closeAll = () => {
    root.querySelectorAll("[data-date-pop]").forEach((pop) => {
      if (pop instanceof HTMLElement) pop.hidden = true;
    });
  };
  const getDateValue = (button) => {
    var _a;
    const days = button.closest(".date-pop__days");
    if (!days) return "";
    const buttons = [...days.querySelectorAll("button")];
    const index = buttons.indexOf(button);
    const day = ((_a = button.textContent) == null ? void 0 : _a.trim().padStart(2, "0")) || "";
    if (index < 2) return `2026-03-${day}`;
    if (index > 31) return `2026-05-${day}`;
    return `2026-04-${day}`;
  };
  const paintSelectedDays = (field) => {
    const start = field.dataset.dateStart;
    const end = field.dataset.dateEnd;
    field.querySelectorAll(".date-pop__days button").forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      const value = getDateValue(button);
      button.classList.toggle("is-selected", value === start || value === end);
      button.classList.toggle("is-range", Boolean(start && end && value > start && value < end));
    });
  };
  root.addEventListener("click", (e) => {
    const target = (
      /** @type {HTMLElement} */
      e.target
    );
    const field = target.closest(".form__field--date");
    const dayButton = target.closest(".date-pop__days button");
    if (dayButton && field instanceof HTMLElement && dayButton instanceof HTMLButtonElement) {
      const pop2 = field.querySelector("[data-date-pop]");
      const input = field.querySelector(".form__input");
      const value = getDateValue(dayButton);
      if (!field.dataset.dateStart || field.dataset.dateEnd) {
        field.dataset.dateStart = value;
        field.dataset.dateEnd = "";
        if (input instanceof HTMLInputElement) input.value = `${value} ~ `;
      } else {
        const start = field.dataset.dateStart;
        const sorted = [start, value].sort();
        field.dataset.dateStart = sorted[0];
        field.dataset.dateEnd = sorted[1];
        if (input instanceof HTMLInputElement) input.value = `${sorted[0]} ~ ${sorted[1]}`;
        if (pop2 instanceof HTMLElement) pop2.hidden = true;
      }
      paintSelectedDays(field);
      return;
    }
    if (!(field instanceof HTMLElement)) return;
    const pop = field.querySelector("[data-date-pop]");
    if (!(pop instanceof HTMLElement)) return;
    if (target.closest("[data-date-pop]")) return;
    const toggle = target.closest("[data-date-toggle]");
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
  document.addEventListener("click", (e) => {
    const target = (
      /** @type {HTMLElement} */
      e.target
    );
    if (root.contains(target) && target.closest(".form__field--date")) return;
    closeAll();
  });
  root.querySelectorAll(".form__field--date").forEach((field) => {
    if (!(field instanceof HTMLElement)) return;
    field.dataset.dateStart = "2026-03-31";
    field.dataset.dateEnd = "2026-04-07";
    paintSelectedDays(field);
  });
}
function initIssueFilterTabs(root) {
  root.addEventListener("click", (event) => {
    const target = (
      /** @type {HTMLElement} */
      event.target
    );
    const tab = target.closest("[data-issue-filter]");
    if (!(tab instanceof HTMLElement) || !root.contains(tab)) return;
    const card = tab.closest(".al-app-dashboard__card");
    if (!card) return;
    const filter = tab.dataset.issueFilter;
    card.querySelectorAll("[data-issue-type]").forEach((row) => {
      if (!(row instanceof HTMLElement)) return;
      const isVisible = filter === "all" || row.dataset.issueType === filter;
      row.hidden = !isVisible;
    });
  });
}
function initMapLegendToggles(root) {
  root.addEventListener("click", (event) => {
    const target = (
      /** @type {HTMLElement} */
      event.target
    );
    const button = target.closest("[data-map-legend-toggle]");
    if (!(button instanceof HTMLButtonElement) || !root.contains(button)) return;
    const isPressed = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!isPressed));
  });
}
function initBrightnessControls(root) {
  const clampBrightness = (value) => Math.min(100, Math.max(0, value));
  root.querySelectorAll(".adx-br").forEach((control) => {
    const bar = control.querySelector(".adx-br__bar");
    const fill = control.querySelector(".adx-br__fill");
    const thumb = control.querySelector(".adx-br__thumb");
    const valueText = control.querySelector(".adx-br__val");
    if (!(bar instanceof HTMLElement) || !(fill instanceof HTMLElement) || !(thumb instanceof HTMLElement)) return;
    let currentValue = clampBrightness(Number(bar.getAttribute("aria-valuenow")) || 0);
    let isDragging = false;
    const render = (value) => {
      currentValue = clampBrightness(value);
      const displayValue = Math.round(currentValue);
      bar.setAttribute("aria-valuenow", String(displayValue));
      bar.setAttribute("aria-valuetext", `${displayValue}%`);
      fill.style.width = `${currentValue}%`;
      thumb.style.left = `calc(${currentValue}% - 9px)`;
      if (valueText) {
        valueText.innerHTML = `${displayValue}<span>%</span>`;
      }
    };
    const updateFromPointer = (event) => {
      const rect = bar.getBoundingClientRect();
      if (!rect.width) return;
      const nextValue = (event.clientX - rect.left) / rect.width * 100;
      render(nextValue);
    };
    bar.tabIndex = bar.tabIndex < 0 ? 0 : bar.tabIndex;
    render(currentValue);
    bar.addEventListener("pointerdown", (event) => {
      var _a;
      isDragging = true;
      (_a = bar.setPointerCapture) == null ? void 0 : _a.call(bar, event.pointerId);
      updateFromPointer(event);
    });
    bar.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      updateFromPointer(event);
    });
    bar.addEventListener("pointerup", () => {
      isDragging = false;
    });
    bar.addEventListener("pointercancel", () => {
      isDragging = false;
    });
    bar.addEventListener("keydown", (event) => {
      const keySteps = {
        ArrowLeft: -5,
        ArrowDown: -5,
        ArrowRight: 5,
        ArrowUp: 5,
        PageDown: -10,
        PageUp: 10
      };
      if (event.key === "Home") {
        event.preventDefault();
        render(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        render(100);
        return;
      }
      const step = keySteps[event.key];
      if (typeof step !== "number") return;
      event.preventDefault();
      render(currentValue + step);
    });
  });
}
function initBatterySocRanges(root) {
  root.querySelectorAll(".battery-board__soc-filter").forEach((control) => {
    const range = control.querySelector(".battery-board__soc-range");
    const valueText = control.querySelector(".battery-board__soc-value strong");
    if (!(range instanceof HTMLInputElement)) return;
    const render = () => {
      const min = Number(range.min || 0);
      const max = Number(range.max || 100);
      const value = Number(range.value || 0);
      const percent = max === min ? 0 : (value - min) / (max - min) * 100;
      range.style.setProperty("--battery-soc-percent", `${Math.min(100, Math.max(0, percent))}%`);
      if (valueText) {
        valueText.textContent = String(value);
      }
    };
    range.addEventListener("input", render);
    render();
  });
}
document.addEventListener("DOMContentLoaded", () => {
  initSidenav();
  initGlightbox();
  initPermissionMgmtPage();
});
initGuidePage();

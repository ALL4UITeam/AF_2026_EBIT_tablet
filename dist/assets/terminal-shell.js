const menuBtn = document.getElementById("alMenuBtn");
const sidenav = document.getElementById("alSidenav");
menuBtn == null ? void 0 : menuBtn.addEventListener("click", () => {
  document.body.classList.toggle("nav-open");
  sidenav == null ? void 0 : sidenav.classList.toggle("is-open");
  const expanded = (sidenav == null ? void 0 : sidenav.classList.contains("is-open")) ?? false;
  menuBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
  menuBtn.setAttribute("aria-label", expanded ? "메뉴 닫기" : "메뉴 열기");
});
const photoPage = document.querySelector("[data-term-photo-page]");
const photoFileInput = document.getElementById("term-photo-file");
const photoCountEl = photoPage == null ? void 0 : photoPage.querySelector("[data-term-photo-count]");
photoFileInput == null ? void 0 : photoFileInput.addEventListener("change", () => {
  var _a;
  const n = Math.min(((_a = photoFileInput.files) == null ? void 0 : _a.length) ?? 0, 3);
  if (photoCountEl) {
    photoCountEl.textContent = String(n);
  }
});

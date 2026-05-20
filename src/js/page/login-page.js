const pwInput = document.querySelector('#password');
const toggleBtn = document.querySelector('.login-card__pw-toggle');

toggleBtn?.addEventListener('click', () => {
  if (!pwInput) return;
  const isHidden = pwInput.type === 'password';
  pwInput.type = isHidden ? 'text' : 'password';
  toggleBtn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
  toggleBtn.setAttribute('aria-label', isHidden ? '비밀번호 숨기기' : '비밀번호 표시');
});

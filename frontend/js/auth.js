/* auth.js — Login & Register Logic */

document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  redirectIfLoggedIn();
  initPasswordStrength();
  initForms();
});

/* ── Tab Switch ─────────────────────────────────────────────── */
function switchTab(tab) {
  document.getElementById('form-login').classList.toggle('active', tab === 'login');
  document.getElementById('form-register').classList.toggle('active', tab === 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  clearErrors();
}

function clearErrors() {
  ['login-error', 'register-error'].forEach(id => {
    const el = document.getElementById(id);
    el.style.display = 'none'; el.textContent = '';
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.style.display = 'block';
}

/* ── Password Strength ──────────────────────────────────────── */
function initPasswordStrength() {
  document.getElementById('reg-password')?.addEventListener('input', function () {
    const val = this.value;
    const bars = [document.getElementById('pb1'), document.getElementById('pb2'), document.getElementById('pb3')];
    const label = document.getElementById('pw-label');
    bars.forEach(b => b.className = 'pw-bar');

    if (val.length === 0) { label.textContent = ''; return; }
    if (val.length < 6) {
      bars[0].classList.add('weak');
      label.textContent = 'Weak'; label.style.color = 'var(--danger)';
    } else if (val.length < 10 || !/\d/.test(val)) {
      bars[0].classList.add('medium'); bars[1].classList.add('medium');
      label.textContent = 'Medium'; label.style.color = 'var(--warning)';
    } else {
      bars.forEach(b => b.classList.add('strong'));
      label.textContent = 'Strong'; label.style.color = 'var(--success)';
    }
  });
}

/* ── Forms ──────────────────────────────────────────────────── */
function initForms() {
  // Login
  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) { showError('login-error', 'Please fill in all fields.'); return; }

    const btn = document.getElementById('login-btn');
    btn.classList.add('btn-loading'); btn.disabled = true;
    try {
      const data = await AuthAPI.login(email, password);
      const user = data.user || data;
      setCurrentUser({ id: user.id, name: user.name, email: user.email });
      showToast('Welcome back, ' + user.name + '!', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 800);
    } catch (err) {
      showError('login-error', err.message || 'Invalid email or password.');
      btn.classList.remove('btn-loading'); btn.disabled = false;
    }
  });

  // Register
  document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;

    if (!name || !email || !password || !confirm) { showError('register-error', 'Please fill in all fields.'); return; }
    if (password.length < 6) { showError('register-error', 'Password must be at least 6 characters.'); return; }
    if (password !== confirm) { showError('register-error', 'Passwords do not match.'); return; }

    const btn = document.getElementById('register-btn');
    btn.classList.add('btn-loading'); btn.disabled = true;
    try {
      await AuthAPI.register(name, email, password);
      showToast('Account created! Please sign in.', 'success');
      document.getElementById('login-email').value = email;
      switchTab('login');
    } catch (err) {
      showError('register-error', err.message || 'Registration failed. Try again.');
    } finally {
      btn.classList.remove('btn-loading'); btn.disabled = false;
    }
  });
}

/* ============================================================
   USI AIRLINES — common.js
   Shared utilities — Load SECOND (after api.js)
   ============================================================ */

/* ── Auth Helpers ───────────────────────────────────────────── */
function isLoggedIn() { return !!sessionStorage.getItem('userId'); }

async function requireAuth() {
  // Fast path: sessionStorage still populated (same tab, no refresh)
  if (isLoggedIn()) return;

  // Slow path: sessionStorage was cleared (page refresh / new tab).
  // Ask the backend — the session cookie is still valid.
  try {
    const data = await AuthAPI.getProfile();
    if (data && data.user) {
      setCurrentUser(data.user); // repopulate sessionStorage
      return;
    }
  } catch (_) {
    // 401 or network error → not logged in
  }

  window.location.href = 'auth.html';
}

function redirectIfLoggedIn() {
  if (isLoggedIn()) { window.location.href = 'index.html'; }
}

function getCurrentUser() {
  return {
    id:    sessionStorage.getItem('userId'),
    name:  sessionStorage.getItem('userName'),
    email: sessionStorage.getItem('userEmail'),
  };
}

function setCurrentUser(user) {
  sessionStorage.setItem('userId',    user.id);
  sessionStorage.setItem('userName',  user.name);
  sessionStorage.setItem('userEmail', user.email);
}

function clearAuth() { sessionStorage.clear(); }

/* ── Formatters ─────────────────────────────────────────────── */
function formatPrice(amount) {
  if (amount === null || amount === undefined) return 'PKR —';
  return 'PKR ' + Number(amount).toLocaleString('en-PK');
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(dep, arr) {
  if (!dep || !arr) return '—';
  const diff = (new Date(arr) - new Date(dep)) / 60000;
  const h = Math.floor(diff / 60), m = diff % 60;
  return `${h}h ${m}m`;
}

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ── Toast ──────────────────────────────────────────────────── */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', warning: '!', info: '✦' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <div class="toast__icon">${icons[type] || icons.info}</div>
    <span class="toast__message">${message}</span>
    <button class="toast__close" onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 320);
  }, 3500);
}

/* ── Page Loader ─────────────────────────────────────────────── */
function hideLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) loader.classList.add('hidden');
}

/* ── Navbar ──────────────────────────────────────────────────── */
function renderNavbar(activePage = '') {
  const user = getCurrentUser();
  const loggedIn = isLoggedIn();

  const navLinks = [
    { href: 'flights.html',     label: 'Flights' },
    { href: 'my-bookings.html', label: 'My Trips' },
    { href: 'profile.html',     label: 'Profile' },
  ];

  const linksHTML = navLinks.map(l =>
    `<li><a href="${l.href}" class="${activePage === l.href ? 'active' : ''}">${l.label}</a></li>`
  ).join('');

  const authHTML = loggedIn
    ? `<span class="navbar__user">✦ ${user.name}</span>
       <button class="btn btn-outline btn-sm" onclick="handleLogout()">Sign Out</button>`
    : `<a href="auth.html" class="btn btn-outline btn-sm">Sign In</a>`;

  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.id = 'navbar';
  nav.innerHTML = `
    <div class="container navbar__inner">
      <a href="index.html" class="navbar__logo">✈ USI <span class="logo-accent">Airlines</span></a>
      <ul class="navbar__links">${linksHTML}</ul>
      <div class="navbar__auth">${authHTML}</div>
    </div>`;

  document.body.insertBefore(nav, document.body.firstChild);

  // Scroll effect
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });
  if (window.scrollY > 20) nav.classList.add('scrolled');
}

/* ── Footer ─────────────────────────────────────────────────── */
function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="container footer__inner">
      <div>
        <div class="footer__brand-logo">USI <span>Airlines</span></div>
        <p class="footer__brand-text">Premium air travel redefined. Fly to the world's finest destinations with unmatched comfort.</p>
      </div>
      <div>
        <p class="footer__col-title">Explore</p>
        <ul class="footer__links">
          <li><a href="flights.html">Search Flights</a></li>
          <li><a href="my-bookings.html">My Trips</a></li>
          <li><a href="profile.html">Profile</a></li>
        </ul>
      </div>
      <div>
        <p class="footer__col-title">Company</p>
        <ul class="footer__links">
          <li><a href="#">About USI</a></li>
          <li><a href="#">Destinations</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>
      <div>
        <p class="footer__col-title">Legal</p>
        <ul class="footer__links">
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms of Service</a></li>
          <li><a href="#">Cookie Policy</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <div class="container">
        <span class="footer__copy">© ${new Date().getFullYear()} USI Airlines. All rights reserved.</span>
      </div>
    </div>`;
  document.body.appendChild(footer);
}

/* ── Logout ─────────────────────────────────────────────────── */
async function handleLogout() {
  try { await AuthAPI.logout(); } catch (_) {}
  clearAuth();
  window.location.href = 'auth.html';
}

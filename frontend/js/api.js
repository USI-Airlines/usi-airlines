/* ============================================================
   USI AIRLINES — api.js
   Central API Layer — Load FIRST before all other JS
   Backend: http://localhost:3000 | Auth: Session (cookies)
   ============================================================ */

const API_BASE = 'http://localhost:3000/api';

const DEFAULT_OPTS = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
};

async function apiRequest(method, endpoint, body = null) {
  const opts = { ...DEFAULT_OPTS, method };
  if (body) opts.body = JSON.stringify(body);

  console.log(`[USI API] ${method} ${API_BASE + endpoint}`);

  const res = await fetch(API_BASE + endpoint, opts);
  const data = await res.json().catch(() => ({}));

  console.log(`[USI API] Response (${res.status}):`, data);

  // 401 interceptor — session expired while frontend still thinks logged in
  if (res.status === 401) {
    if (sessionStorage.getItem('userId')) {
      // Stale frontend state: clear it so the next requireAuth() redirects cleanly
      sessionStorage.clear();
    }
    throw new Error(data.message || data.error || 'Not authenticated');
  }

  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
}

/* ── Auth ── */
const AuthAPI = {
  login: (email, password) => apiRequest('POST', '/auth/login', { email, password }),
  register: (name, email, password) => apiRequest('POST', '/auth/register', { name, email, password }),
  logout: () => apiRequest('POST', '/auth/logout'),
  getProfile: () => apiRequest('GET', '/auth/profile'),
  updateProfile: (data) => apiRequest('PUT', '/auth/profile', data),
};

/* ── Flights ── */
const FlightsAPI = {
  search: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.origin) qs.set('origin', params.origin);
    if (params.destination) qs.set('destination', params.destination);
    if (params.date) qs.set('date', params.date);
    const query = qs.toString() ? '?' + qs.toString() : '';
    const raw = await apiRequest('GET', '/flights' + query);

    // Normalize: handle array OR {flights:[]} OR {data:[]} OR {result:[]}
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.flights)) return raw.flights;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.result)) return raw.result;

    console.warn('[USI API] Unexpected flights response format:', raw);
    return [];
  },

  // Get single flight by ID — uses GET /flights/:id
  getById: async (id) => {
    const raw = await apiRequest('GET', `/flights/${id}`);
    // Backend returns { flight: {...} }
    if (raw && raw.flight) return raw.flight;
    if (raw && raw.id) return raw; // plain object fallback
    throw new Error('Flight not found');
  },
};

/* ── Bookings ── */
const BookingsAPI = {
  // user_id backend session se khud leta hai, sirf flight_id bhejna hai
  create: (flight_id) => apiRequest('POST', '/bookings', { flight_id }),
  getByUser: async (userId) => {
    const raw = await apiRequest('GET', `/bookings/${userId}`);
    // Backend returns { bookings: [...] } — unwrap to plain array
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.bookings)) return raw.bookings;
    return [];
  },
  cancel: (id) => apiRequest('DELETE', `/bookings/${id}`),
};

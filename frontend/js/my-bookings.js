/* my-bookings.js — My Trips Logic */

let allBookings = [];
let activeFilter = 'all';
let pendingCancelId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await requireAuth();
  renderNavbar('my-bookings.html');
  renderFooter();
  await loadBookings();
  initTabs();
  hideLoader();
});

async function loadBookings() {
  const user = getCurrentUser();
  const list = document.getElementById('bookings-list');
  list.innerHTML = `<div class="flights-skeleton">${Array(3).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>`;
  try {
    allBookings = await BookingsAPI.getByUser(user.id);
    if (!Array.isArray(allBookings)) allBookings = [];
    document.getElementById('myb-sub').textContent =
      `${allBookings.length} booking${allBookings.length !== 1 ? 's' : ''} found`;
    renderBookings();
  } catch (err) {
    list.innerHTML = `<div class="flights-error">Could not load bookings. Make sure you are logged in and the server is running.</div>`;
    document.getElementById('myb-sub').textContent = '';
  }
}

function renderBookings() {
  let bookings = allBookings;
  if (activeFilter !== 'all') {
    bookings = allBookings.filter(b => b.status === activeFilter);
  }

  const list = document.getElementById('bookings-list');
  if (bookings.length === 0) {
    list.innerHTML = `
      <div class="myb-empty">
        <div class="myb-empty__icon">✈️</div>
        <h3 class="myb-empty__title">No trips yet</h3>
        <p class="myb-empty__sub">${activeFilter !== 'all' ? `No ${activeFilter} bookings.` : 'Start exploring destinations and book your first flight.'}</p>
        <a href="flights.html" class="btn btn-primary">Search Flights</a>
      </div>`;
    return;
  }

  list.innerHTML = bookings.map(b => renderBookingCard(b)).join('');
}

function renderBookingCard(b) {
  // Backend returns flat fields — no nested b.flight object
  const origin = b.origin || '—';
  const dest = b.destination || '—';
  const depTime = b.departure_time ? formatTime(b.departure_time) : '—';
  const depDate = b.departure_time ? formatDate(b.departure_time) : '—';
  const flightNum = b.flight_number || '—';
  const bookDate = formatDate(b.booking_date);
  const isCancelled = b.status === 'cancelled';
  const statusClass = isCancelled ? 'badge-danger' : 'badge-success';
  const statusText = isCancelled ? 'Cancelled' : 'Confirmed';

  const cancelBtn = !isCancelled
    ? `<button class="btn btn-danger btn-sm" onclick="openCancelModal(${b.id})">Cancel</button>`
    : '';

  return `
    <div class="card booking-card ${isCancelled ? 'cancelled' : ''}" id="booking-${b.id}">
      <div>
        <div class="bc-route">${origin} → ${dest}</div>
        <div class="bc-sub">
          <span>✈ ${flightNum}</span>
          <span>📅 ${depDate} at ${depTime}</span>
          <span>Booked: ${bookDate}</span>
        </div>
        <div class="bc-ref">REF #USI-${String(b.id).padStart(6, '0')}</div>
      </div>
      <div class="bc-actions">
        <span class="badge ${statusClass}">${statusText}</span>
        ${cancelBtn}
      </div>
    </div>`;
}

function initTabs() {
  document.querySelectorAll('.myb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.myb-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      renderBookings();
    });
  });
}

/* ── Cancel Modal ── */
function openCancelModal(bookingId) {
  pendingCancelId = bookingId;
  document.getElementById('cancel-modal').classList.add('open');
  document.getElementById('confirm-cancel-btn').onclick = doCancel;
}

function closeModal() {
  document.getElementById('cancel-modal').classList.remove('open');
  pendingCancelId = null;
}

async function doCancel() {
  const btn = document.getElementById('confirm-cancel-btn');
  btn.classList.add('btn-loading'); btn.disabled = true;
  try {
    await BookingsAPI.cancel(pendingCancelId);
    // Update local state instead of full reload
    const booking = allBookings.find(b => b.id === pendingCancelId);
    if (booking) booking.status = 'cancelled';
    closeModal();
    renderBookings();
    showToast('Booking cancelled successfully.', 'success');
  } catch (err) {
    showToast(err.message || 'Could not cancel booking.', 'error');
  } finally {
    btn.classList.remove('btn-loading'); btn.disabled = false;
  }
}

// Close modal on overlay click
document.getElementById('cancel-modal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

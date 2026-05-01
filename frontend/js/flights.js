/* flights.js — Flight Search Logic */

let allFlights = [];
let currentSort = 'price';
let currentTimeFilter = null;
let maxPrice = 500000;
let passengers = 1;

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('flights.html');
  renderFooter();
  prefillFromURL();
  initFilters();
  await loadFlights();
  hideLoader();
});

function prefillFromURL() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('origin')) document.getElementById('f-origin').value = p.get('origin');
  if (p.get('destination')) document.getElementById('f-dest').value = p.get('destination');
  if (p.get('date')) document.getElementById('f-date').value = p.get('date');
  if (p.get('passengers')) { passengers = parseInt(p.get('passengers')) || 1; document.getElementById('f-pass').value = passengers; }
}

async function loadFlights() {
  showSkeleton();
  const origin = document.getElementById('f-origin').value.trim();
  const dest = document.getElementById('f-dest').value.trim();
  const date = document.getElementById('f-date').value;
  try {
    allFlights = await FlightsAPI.search({ origin, destination: dest, date });
    // FlightsAPI.search always returns an array (normalized in api.js)
    renderFlights();
  } catch (err) {
    console.error('[USI] loadFlights error:', err);
    document.getElementById('flights-results').innerHTML = `
      <div class="flights-error">
        <p><strong>Could not load flights.</strong></p>
        <p style="margin-top:0.5rem;font-size:13px">${err.message}</p>
        <p style="margin-top:0.5rem;font-size:12px;opacity:0.7">Check F12 Console for details. Make sure backend is running at http://localhost:3000</p>
      </div>`;
    document.getElementById('results-count').textContent = '';
  }
}

function showSkeleton() {
  document.getElementById('flights-results').innerHTML = `
    <div class="flights-skeleton">
      ${Array(4).fill('<div class="skeleton skeleton-card"></div>').join('')}
    </div>`;
}

function renderFlights() {
  let flights = [...allFlights];

  // Time filter
  if (currentTimeFilter) {
    flights = flights.filter(f => {
      const h = new Date(f.departure_time).getHours();
      if (currentTimeFilter === 'morning') return h >= 6 && h < 12;
      if (currentTimeFilter === 'afternoon') return h >= 12 && h < 18;
      if (currentTimeFilter === 'evening') return h >= 18;
      return true;
    });
  }

  // Price filter
  flights = flights.filter(f => parseFloat(f.price) <= maxPrice);

  // Sort
  if (currentSort === 'price') flights.sort((a, b) => a.price - b.price);
  if (currentSort === 'departure') flights.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));

  const countEl = document.getElementById('results-count');
  const container = document.getElementById('flights-results');

  if (flights.length === 0) {
    countEl.innerHTML = '';
    container.innerHTML = `
      <div class="flights-empty">
        <div class="flights-empty__icon">✈️</div>
        <h3 class="flights-empty__title">No flights found</h3>
        <p class="flights-empty__sub">Try adjusting your search or filters</p>
        <button class="btn btn-outline-dark" onclick="resetAndLoad()">Clear Filters</button>
      </div>`;
    return;
  }

  countEl.innerHTML = `Showing <strong>${flights.length}</strong> flight${flights.length !== 1 ? 's' : ''}`;
  container.innerHTML = `<div class="results-list">${flights.map(renderFlightCard).join('')}</div>`;
}

function renderFlightCard(f) {
  const dep = formatTime(f.departure_time);
  const arr = formatTime(f.arrival_time);
  const dur = formatDuration(f.departure_time, f.arrival_time);
  const origin = f.origin || '—';
  const dest = f.destination || '—';
  const seats = f.seats_available;
  const seatsClass = seats <= 5 ? '' : 'plenty';
  const seatsText = seats <= 5 ? `⚠ Only ${seats} seats left` : `✔ ${seats} seats available`;
  const total = (parseFloat(f.price) * passengers).toLocaleString('en-PK');

  return `
    <div class="card flight-card">
      <div>
        <div class="flight-card__num">${f.flight_number}</div>
        <div class="flight-card__airline">USI Airlines</div>
      </div>
      <div class="flight-route">
        <div class="flight-point">
          <div class="flight-point__time">${dep}</div>
          <div class="flight-point__code">${origin.slice(0, 3).toUpperCase()}</div>
          <div class="mt-sm" style="font-size:11px;color:var(--steel)">${origin}</div>
        </div>
        <div class="flight-line">
          <div class="flight-line__bar"><span class="flight-line__plane">✈</span></div>
          <div class="flight-line__dur">${dur}</div>
        </div>
        <div class="flight-point">
          <div class="flight-point__time">${arr}</div>
          <div class="flight-point__code">${dest.slice(0, 3).toUpperCase()}</div>
          <div class="mt-sm" style="font-size:11px;color:var(--steel)">${dest}</div>
        </div>
      </div>
      <div class="flight-card__right">
        <div>
          <div class="flight-price">PKR ${total}</div>
          <div class="flight-price__label">${passengers > 1 ? `for ${passengers} passengers` : 'per passenger'}</div>
        </div>
        <div class="flight-seats ${seatsClass}">${seatsText}</div>
        <a href="booking.html?flightId=${f.id}&passengers=${passengers}" class="btn btn-outline-gold btn-sm">Book Now →</a>
      </div>
    </div>`;
}

function initFilters() {
  // Sort chips
  document.querySelectorAll('.filter-chip[data-sort]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-sort]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentSort = chip.dataset.sort;
      renderFlights();
    });
  });

  // Time chips
  document.querySelectorAll('.filter-chip[data-time]').forEach(chip => {
    chip.addEventListener('click', () => {
      if (chip.classList.contains('active')) {
        chip.classList.remove('active');
        currentTimeFilter = null;
      } else {
        document.querySelectorAll('.filter-chip[data-time]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentTimeFilter = chip.dataset.time;
      }
      renderFlights();
    });
  });

  // Price slider
  const slider = document.getElementById('price-slider');
  const priceVal = document.getElementById('price-val');
  slider.addEventListener('input', () => {
    maxPrice = parseInt(slider.value);
    priceVal.textContent = maxPrice === 500000 ? 'Any' : 'PKR ' + maxPrice.toLocaleString();
    renderFlights();
  });

  // Reset
  document.getElementById('reset-filters').addEventListener('click', resetAndLoad);

  // Search form re-submit
  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    const o = document.getElementById('f-origin').value.trim();
    const d = document.getElementById('f-dest').value.trim();
    const dt = document.getElementById('f-date').value;
    const ps = document.getElementById('f-pass').value;
    if (o) p.set('origin', o);
    if (d) p.set('destination', d);
    if (dt) p.set('date', dt);
    p.set('passengers', ps);
    passengers = parseInt(ps) || 1;
    history.replaceState(null, '', '?' + p.toString());
    loadFlights();
  });
}

function resetAndLoad() {
  currentTimeFilter = null;
  maxPrice = 500000;
  currentSort = 'price';
  document.getElementById('price-slider').value = 500000;
  document.getElementById('price-val').textContent = 'Any';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.filter-chip[data-sort="price"]').classList.add('active');
  renderFlights();
}

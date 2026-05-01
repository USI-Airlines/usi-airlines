/* index.js — Landing Page Logic */

const DESTINATIONS = [
  { icon: '🕌', city: 'Dubai',     country: 'UAE',          price: 'From PKR 45,000' },
  { icon: '🏛️', city: 'London',    country: 'United Kingdom', price: 'From PKR 120,000' },
  { icon: '🗼', city: 'Paris',     country: 'France',        price: 'From PKR 135,000' },
  { icon: '🏙️', city: 'New York',  country: 'USA',           price: 'From PKR 160,000' },
  { icon: '🌊', city: 'Istanbul',  country: 'Turkey',        price: 'From PKR 55,000' },
  { icon: '🌸', city: 'Bangkok',   country: 'Thailand',      price: 'From PKR 48,000' },
  { icon: '🌴', city: 'Karachi',   country: 'Pakistan',      price: 'From PKR 8,000' },
  { icon: '🏔️', city: 'Islamabad', country: 'Pakistan',      price: 'From PKR 6,500' },
];

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('index.html');
  renderFooter();
  hideLoader();
  renderDestinations();
  initSearchForm();
  initCounters();
});

function renderDestinations() {
  const list = document.getElementById('destinations-list');
  if (!list) return;
  list.innerHTML = DESTINATIONS.map(d => `
    <div class="dest-card" onclick="searchDest('${d.city}')">
      <div class="dest-card__icon">${d.icon}</div>
      <div class="dest-card__city">${d.city}</div>
      <div class="dest-card__country">${d.country}</div>
      <div class="dest-card__price">${d.price}</div>
    </div>`).join('');
}

function searchDest(city) {
  const params = new URLSearchParams({ destination: city });
  window.location.href = 'flights.html?' + params.toString();
}

function initSearchForm() {
  // Set today as min date
  const dateInput = document.getElementById('s-date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  document.getElementById('hero-search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const origin = document.getElementById('s-origin').value.trim();
    const dest   = document.getElementById('s-dest').value.trim();
    const date   = document.getElementById('s-date').value;
    const pass   = document.getElementById('s-pass').value || 1;

    if (!origin && !dest && !date) {
      window.location.href = 'flights.html';
      return;
    }
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin);
    if (dest)   params.set('destination', dest);
    if (date)   params.set('date', date);
    params.set('passengers', pass);
    window.location.href = 'flights.html?' + params.toString();
  });
}

function initCounters() {
  const counters = document.querySelectorAll('.stat__num[data-target]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      let current = 0;
      const step = Math.ceil(target / 60);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString();
        if (current >= target) clearInterval(timer);
      }, 24);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

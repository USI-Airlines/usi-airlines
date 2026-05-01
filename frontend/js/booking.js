/* booking.js — Booking Flow Logic */

let flightData = null;
let passengers = 1;
let currentStep = 1;

document.addEventListener('DOMContentLoaded', async () => {
  await requireAuth();
  renderNavbar('booking.html');
  await loadFlightData();
  hideLoader();
});

async function loadFlightData() {
  const p = new URLSearchParams(window.location.search);
  const flightId = p.get('flightId');
  passengers = parseInt(p.get('passengers')) || 1;

  if (!flightId) {
    showBookingError('No flight selected. Please search for a flight first.', 'flights.html');
    return;
  }

  try {
    // Direct single-flight fetch — GET /api/flights/:id
    flightData = await FlightsAPI.getById(flightId);
    renderStep(1);
  } catch (err) {
    showBookingError('Could not load flight details. ' + err.message, 'flights.html');
  }
}

function showBookingError(msg, backHref) {
  document.getElementById('booking-content').innerHTML = `
    <div class="booking-error" style="margin-top:4rem">
      <h3>Oops!</h3>
      <p style="color:var(--steel);margin-bottom:2rem">${msg}</p>
      <a href="${backHref}" class="btn btn-outline-dark">← Go Back</a>
    </div>`;
}

function setStep(n) {
  currentStep = n;
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`step-ind-${i}`);
    el.classList.remove('active', 'done');
    if (i < n) el.classList.add('done');
    else if (i === n) el.classList.add('active');
  }
}

function renderStep(n) {
  setStep(n);
  if (n === 1) renderPassengerStep();
  if (n === 2) renderPaymentStep();
  if (n === 3) renderConfirmation();
}

/* ── Summary Sidebar HTML ── */
function summaryHTML() {
  const total = (parseFloat(flightData.price) * passengers).toLocaleString('en-PK');
  return `
    <div class="summary-card">
      <div class="summary-title">Flight Summary</div>
      <div class="summary-route">
        <div class="summary-city">${flightData.origin}</div>
        <div class="summary-arrow">→</div>
        <div class="summary-city">${flightData.destination}</div>
      </div>
      <div class="summary-detail"><span class="summary-detail__label">Flight</span><span class="summary-detail__value">${flightData.flight_number}</span></div>
      <div class="summary-detail"><span class="summary-detail__label">Departure</span><span class="summary-detail__value">${formatTime(flightData.departure_time)}</span></div>
      <div class="summary-detail"><span class="summary-detail__label">Arrival</span><span class="summary-detail__value">${formatTime(flightData.arrival_time)}</span></div>
      <div class="summary-detail"><span class="summary-detail__label">Date</span><span class="summary-detail__value">${formatDate(flightData.departure_time)}</span></div>
      <div class="summary-detail"><span class="summary-detail__label">Passengers</span><span class="summary-detail__value">${passengers}</span></div>
      <div class="summary-divider"></div>
      <div class="summary-detail"><span class="summary-detail__label">Price/Person</span><span class="summary-detail__value">PKR ${parseFloat(flightData.price).toLocaleString('en-PK')}</span></div>
      <div class="summary-total__label">Total Amount</div>
      <div class="summary-total__amount">PKR ${total}</div>
    </div>`;
}

/* ── Step 1: Passenger Details ── */
function renderPassengerStep() {
  document.getElementById('booking-content').innerHTML = `
    <div class="booking-layout">
      <div>
        <div class="booking-section">
          <h2 class="booking-section__title">Passenger Details</h2>
          <p class="booking-section__sub">Please enter the passenger information</p>
          <div class="card">
            <form id="passenger-form" novalidate>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="p-name">Full Name</label>
                  <input class="form-input" type="text" id="p-name" placeholder="As per ID/Passport" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="p-cnic">CNIC / Passport No.</label>
                  <input class="form-input" type="text" id="p-cnic" placeholder="e.g. 35201-1234567-1" required />
                </div>
              </div>
              <div class="form-group mt-md">
                <label class="form-label" for="p-contact">Contact Number</label>
                <input class="form-input" type="tel" id="p-contact" placeholder="+92 300 0000000" required />
              </div>
              <div class="form-group mt-md">
                <label class="form-label" for="p-notes">Special Requests (Optional)</label>
                <textarea class="form-input" id="p-notes" rows="3" placeholder="Wheelchair, meal preference, etc."></textarea>
              </div>
              <div class="booking-nav">
                <a href="flights.html" class="btn btn-outline-dark">← Back to Flights</a>
                <button type="submit" class="btn btn-primary btn-lg">Continue to Payment →</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      ${summaryHTML()}
    </div>`;

  document.getElementById('passenger-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('p-name').value.trim();
    const cnic = document.getElementById('p-cnic').value.trim();
    const contact = document.getElementById('p-contact').value.trim();
    if (!name || !cnic || !contact) { showToast('Please fill in all required fields.', 'warning'); return; }
    renderStep(2);
  });
}

/* ── Step 2: Payment ── */
function renderPaymentStep() {
  const total = (parseFloat(flightData.price) * passengers).toLocaleString('en-PK');
  document.getElementById('booking-content').innerHTML = `
    <div class="booking-layout">
      <div>
        <div class="booking-section">
          <h2 class="booking-section__title">Payment Details</h2>
          <p class="booking-section__sub">Secure payment — your data is encrypted</p>
          <div class="card">
            <div class="card-icons">
              <span class="card-icon">VISA</span>
              <span class="card-icon">MC</span>
              <span class="card-icon">AMEX</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="cc-num">Card Number</label>
              <input class="form-input" type="text" id="cc-num" placeholder="1234 5678 9012 3456" maxlength="19" />
            </div>
            <div class="card-input-row mt-md">
              <div class="form-group">
                <label class="form-label" for="cc-exp">Expiry Date</label>
                <input class="form-input" type="text" id="cc-exp" placeholder="MM / YY" maxlength="7" />
              </div>
              <div class="form-group">
                <label class="form-label" for="cc-cvv">CVV</label>
                <input class="form-input" type="text" id="cc-cvv" placeholder="•••" maxlength="3" />
              </div>
            </div>
            <div class="form-group mt-md">
              <label class="form-label" for="cc-name">Name on Card</label>
              <input class="form-input" type="text" id="cc-name" placeholder="As printed on card" />
            </div>
            <div class="booking-nav">
              <button class="btn btn-outline-dark" onclick="renderStep(1)">← Back</button>
              <button class="btn btn-primary btn-lg" id="confirm-btn" onclick="confirmBooking()">
                Confirm & Pay PKR ${total} →
              </button>
            </div>
          </div>
        </div>
      </div>
      ${summaryHTML()}
    </div>`;

  // Card number formatting
  document.getElementById('cc-num').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  });
}

/* ── Confirm Booking ── */
async function confirmBooking() {
  const btn = document.getElementById('confirm-btn');
  btn.classList.add('btn-loading'); btn.disabled = true;
  try {
    // Backend session se user_id khud leta hai — sirf flight_id bhejna hai
    const result = await BookingsAPI.create(flightData.id);
    // Backend returns: { message: '...', booking_id: 5 }
    window._bookingId = result.booking_id || result.id || result.bookingId || '—';
    renderStep(3);
    renderConfirmation();
  } catch (err) {
    showToast(err.message || 'Booking failed. Please try again.', 'error');
    btn.classList.remove('btn-loading'); btn.disabled = false;
  }
}

/* ── Step 3: Confirmation ── */
function renderConfirmation() {
  const bookingId = window._bookingId || '—';
  document.getElementById('booking-content').innerHTML = `
    <div class="booking-confirm fade-up">
      <span class="confirm-icon">✅</span>
      <h2 class="confirm-title">Booking Confirmed!</h2>
      <p class="confirm-sub">Your flight has been successfully booked.</p>
      <p class="confirm-sub">Booking Reference:</p>
      <div class="confirm-ref">#USI-${String(bookingId).padStart(6, '0')}</div>
      <div class="card" style="max-width:440px;margin:1.5rem auto;text-align:left">
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--steel)">Route</span><span>${flightData.origin} → ${flightData.destination}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--steel)">Flight</span><span>${flightData.flight_number}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--steel)">Date</span><span>${formatDate(flightData.departure_time)}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--steel)">Departure</span><span>${formatTime(flightData.departure_time)}</span></div>
        </div>
      </div>
      <div class="confirm-actions">
        <a href="my-bookings.html" class="btn btn-primary btn-lg">View My Bookings</a>
        <a href="index.html" class="btn btn-outline-dark btn-lg">Back to Home</a>
      </div>
    </div>`;
}

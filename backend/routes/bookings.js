const express = require('express');
const router = express.Router();
const db = require('../db');

// Book a flight
router.post('/', (req, res) => {
  const user_id = req.session.user?.id;
  if (!user_id) return res.status(401).json({ error: 'Please login first' });

  const { flight_id } = req.body;
  db.query('SELECT * FROM flights WHERE id = ?', [flight_id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Flight not found' });
    if (results[0].seats_available <= 0) return res.status(400).json({ error: 'No seats available' });

    db.query('INSERT INTO bookings (user_id, flight_id) VALUES (?, ?)', [user_id, flight_id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Booking failed' });
      db.query('UPDATE flights SET seats_available = seats_available - 1 WHERE id = ?', [flight_id]);
      res.json({ message: 'Flight booked successfully!', booking_id: result.insertId });
    });
  });
});

// Get user bookings
router.get('/:userId', (req, res) => {
  db.query(
    `SELECT b.id, b.booking_date, b.status,
            f.flight_number, f.origin, f.destination,
            f.departure_time, f.arrival_time, f.price
     FROM bookings b
     JOIN flights f ON b.flight_id = f.id
     WHERE b.user_id = ?`,
    [req.params.userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error fetching bookings' });
      res.json({ bookings: results });
    }
  );
});

// Cancel booking
router.delete('/:id', (req, res) => {
  const user_id = req.session.user?.id;
  if (!user_id) return res.status(401).json({ error: 'Please login first' });

  db.query('UPDATE bookings SET status = "cancelled" WHERE id = ? AND user_id = ?', [req.params.id, user_id], (err, result) => {
    if (err || result.affectedRows === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking cancelled!' });
  });
});

module.exports = router;

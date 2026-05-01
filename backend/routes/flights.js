const express = require('express');
const router = express.Router();
const db = require('../db');

// Search / Get all flights
router.get('/', (req, res) => {
  const { origin, destination, date } = req.query;
  let query = 'SELECT * FROM flights WHERE 1=1';
  let params = [];

  if (origin)      { query += ' AND origin = ?';                params.push(origin); }
  if (destination) { query += ' AND destination = ?';           params.push(destination); }
  if (date)        { query += ' AND DATE(departure_time) = ?';  params.push(date); }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error fetching flights' });
    res.json({ flights: results });
  });
});

// Get single flight
router.get('/:id', (req, res) => {
  db.query('SELECT * FROM flights WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Flight not found' });
    res.json({ flight: results[0] });
  });
});

module.exports = router;

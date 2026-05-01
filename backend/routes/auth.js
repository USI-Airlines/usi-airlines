const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// Register
router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    db.query(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [name, email, hash, phone || null],
      (err, result) => {
        if (err) return res.status(400).json({ error: 'Email already exists' });
        const user = { id: result.insertId, name, email, phone: phone || null };
        req.session.user = user;
        res.json({ message: 'Registered successfully!', user });
      }
    );
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    bcrypt.compare(password, results[0].password, (err, match) => {
      if (!match) return res.status(401).json({ error: 'Invalid email or password' });
      const user = { id: results[0].id, name: results[0].name, email: results[0].email, phone: results[0].phone };
      req.session.user = user;
      res.json({ message: 'Login successful!', user });
    });
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully!' });
});

// Get Profile
router.get('/profile', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  db.query('SELECT id, name, email, phone, created_at FROM users WHERE id = ?', [req.session.user.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: results[0] });
  });
});

// Update Profile
router.put('/profile', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { name, phone } = req.body;
  db.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.session.user.id], (err) => {
    if (err) return res.status(500).json({ error: 'Update failed' });
    req.session.user.name = name;
    res.json({ message: 'Profile updated!', user: { ...req.session.user, name, phone } });
  });
});

module.exports = router;

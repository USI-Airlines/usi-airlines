const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();

// ── CORS — must come before session & routes ─────────────────────
// credentials: true lets the browser send/receive the session cookie
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));

app.use(express.json());

// ── Session ──────────────────────────────────────────────────────
app.use(session({
    secret: process.env.SESSION_SECRET || 'usi_airlines_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',   // works for same-origin dev (localhost/127.0.0.1)
        maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
    }
}));

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/flights', require('./routes/flights'));
app.use('/api/bookings', require('./routes/bookings'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

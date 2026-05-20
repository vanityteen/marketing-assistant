const express = require('express')
const path = require('path')
const cors = require('cors')
const cookieSession = require('cookie-session')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Stateless cookie-based sessions (works in serverless)
app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET || 'marketing-assistant-secret-key',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  httpOnly: true,
  sameSite: 'lax',
}))

app.use('/api/auth', require('./routes/auth.cjs'))
app.use('/api/events', require('./routes/events.cjs'))
app.use('/api/leads', require('./routes/leads.cjs'))
app.use('/api/contacts', require('./routes/contacts.cjs'))
app.use('/api/settings', require('./routes/settings.cjs'))

// Static file serving for local production testing only
// On Vercel, static files are served by Vercel's edge network
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, '..', 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
  })
}

// Only listen when running directly (not as serverless function)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

module.exports = app

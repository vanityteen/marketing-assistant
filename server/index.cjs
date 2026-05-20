const express = require('express')
const path = require('path')
const cors = require('cors')
const session = require('express-session')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(session({
  secret: 'marketing-assistant-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}))

app.use('/api/auth', require('./routes/auth.cjs'))
app.use('/api/events', require('./routes/events.cjs'))
app.use('/api/leads', require('./routes/leads.cjs'))
app.use('/api/contacts', require('./routes/contacts.cjs'))
app.use('/api/settings', require('./routes/settings.cjs'))

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

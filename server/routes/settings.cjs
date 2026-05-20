const router = require('express').Router()
const db = require('../db.cjs')

// Get settings for current user
router.get('/', (req, res) => {
  const userId = req.session.userId || 1
  let settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId)
  if (!settings) {
    db.prepare('INSERT INTO settings (user_id, recovery_days) VALUES (?, 7)').run(userId)
    settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId)
  }
  res.json({ settings })
})

// Update recovery days
router.put('/recovery', (req, res) => {
  const userId = req.session.userId || 1
  const { recovery_days } = req.body
  db.prepare("UPDATE settings SET recovery_days = ?, updated_at = datetime('now') WHERE user_id = ?")
    .run(recovery_days, userId)
  const settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId)
  res.json({ settings })
})

module.exports = router

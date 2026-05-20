const router = require('express').Router()
const db = require('../db.cjs')

// Get settings for current user
router.get('/', async (req, res) => {
  const userId = req.session.userId || 1
  let settings = await db.get('SELECT * FROM settings WHERE user_id = ?', [userId])
  if (!settings) {
    await db.run('INSERT INTO settings (user_id, recovery_days) VALUES (?, 7)', [userId])
    settings = await db.get('SELECT * FROM settings WHERE user_id = ?', [userId])
  }
  res.json({ settings })
})

// Update recovery days
router.put('/recovery', async (req, res) => {
  const userId = req.session.userId || 1
  const { recovery_days } = req.body
  await db.run("UPDATE settings SET recovery_days = ?, updated_at = datetime('now') WHERE user_id = ?", [recovery_days, userId])
  const settings = await db.get('SELECT * FROM settings WHERE user_id = ?', [userId])
  res.json({ settings })
})

module.exports = router

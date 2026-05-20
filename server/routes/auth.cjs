const router = require('express').Router()
const db = require('../db.cjs')

// Simple login - for demo purposes
router.post('/login', (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: '请输入用户名' })

  let user = db.prepare('SELECT * FROM users WHERE name = ?').get(name)
  if (!user) {
    const result = db.prepare('INSERT INTO users (name) VALUES (?)').run(name)
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
    // Create default settings
    db.prepare('INSERT INTO settings (user_id, recovery_days) VALUES (?, 7)').run(user.id)
  }

  req.session.userId = user.id
  res.json({ user })
})

// Get current user
router.get('/me', (req, res) => {
  // For demo, default to user 1
  const userId = req.session.userId || 1
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (!user) return res.status(401).json({ error: '未登录' })
  res.json({ user })
})

// Update role
router.put('/role', (req, res) => {
  const userId = req.session.userId || 1
  const { role } = req.body
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  res.json({ user })
})

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy()
  res.json({ message: '已退出登录' })
})

module.exports = router

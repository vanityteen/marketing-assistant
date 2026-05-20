const router = require('express').Router()
const db = require('../db.cjs')

// Simple login - for demo purposes
router.post('/login', async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: '请输入用户名' })

  let user = await db.get('SELECT * FROM users WHERE name = ?', [name])
  if (!user) {
    const result = await db.run('INSERT INTO users (name) VALUES (?)', [name])
    user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid])
    // Create default settings
    await db.run('INSERT INTO settings (user_id, recovery_days) VALUES (?, 7)', [user.id])
  }

  req.session.userId = user.id
  res.json({ user })
})

// Get current user
router.get('/me', async (req, res) => {
  // For demo, default to user 1
  const userId = req.session.userId || 1
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId])
  if (!user) return res.status(401).json({ error: '未登录' })
  res.json({ user })
})

// Update role
router.put('/role', async (req, res) => {
  const userId = req.session.userId || 1
  const { role } = req.body
  await db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId])
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId])
  res.json({ user })
})

// Logout
router.post('/logout', (req, res) => {
  req.session = null
  res.json({ message: '已退出登录' })
})

module.exports = router

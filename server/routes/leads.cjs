const router = require('express').Router()
const db = require('../db.cjs')

// Get public lead pool (unclaimed leads)
router.get('/public', (req, res) => {
  const leads = db.prepare(`
    SELECT l.*, e.name as event_name
    FROM leads l
    LEFT JOIN events e ON l.event_id = e.id
    WHERE l.owner_id IS NULL
    ORDER BY l.created_at DESC
  `).all()

  const stats = {
    available: leads.length,
    today: db.prepare("SELECT COUNT(*) as count FROM leads WHERE owner_id IS NULL AND date(created_at) = date('now')").get().count,
    recovery: db.prepare(`
      SELECT COUNT(*) as count FROM leads
      WHERE owner_id IS NOT NULL AND status = 'pending'
      AND julianday('now') - julianday(claimed_at) > (
        SELECT recovery_days FROM settings WHERE user_id = owner_id LIMIT 1
      )
    `).get().count
  }

  res.json({ leads, stats })
})

// Get personal leads for current user
router.get('/personal', (req, res) => {
  const userId = req.session.userId || 1
  const { status } = req.query

  let sql = `
    SELECT l.*, e.name as event_name
    FROM leads l
    LEFT JOIN events e ON l.event_id = e.id
    WHERE l.owner_id = ?
  `
  const params = [userId]

  if (status && status !== 'all') {
    sql += ' AND l.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY l.created_at DESC'
  const leads = db.prepare(sql).all(...params)

  const stats = {
    pending: db.prepare("SELECT COUNT(*) as count FROM leads WHERE owner_id = ? AND status = 'pending'").get(userId).count,
    contacted: db.prepare("SELECT COUNT(*) as count FROM leads WHERE owner_id = ? AND status = 'contacted'").get(userId).count,
    negotiating: db.prepare("SELECT COUNT(*) as count FROM leads WHERE owner_id = ? AND status = 'negotiating'").get(userId).count,
    converted: db.prepare("SELECT COUNT(*) as count FROM leads WHERE owner_id = ? AND status = 'converted'").get(userId).count,
    abandoned: db.prepare("SELECT COUNT(*) as count FROM leads WHERE owner_id = ? AND status = 'abandoned'").get(userId).count
  }

  res.json({ leads, stats })
})

// Claim a lead from public pool
router.post('/:id/claim', (req, res) => {
  const userId = req.session.userId || 1
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id)

  if (!lead) return res.status(404).json({ error: '线索不存在' })
  if (lead.owner_id) return res.status(400).json({ error: '该线索已被领用' })

  db.prepare("UPDATE leads SET owner_id = ?, claimed_at = datetime('now') WHERE id = ?").run(userId, req.params.id)
  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id)
  res.json({ lead: updated, message: '线索领用成功' })
})

// Follow up on a lead
router.post('/:id/follow', (req, res) => {
  const userId = req.session.userId || 1
  const { status, rating, note } = req.body
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id)

  if (!lead) return res.status(404).json({ error: '线索不存在' })

  // Update lead status and rating
  if (status) {
    db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, req.params.id)
  }
  if (rating !== undefined) {
    db.prepare('UPDATE leads SET rating = ? WHERE id = ?').run(rating, req.params.id)
  }

  // Create follow up record
  db.prepare('INSERT INTO follow_ups (lead_id, user_id, status, rating, note) VALUES (?, ?, ?, ?, ?)')
    .run(req.params.id, userId, status || lead.status, rating ?? lead.rating, note || '')

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id)
  res.json({ lead: updated, message: '跟进记录已保存' })
})

// Get follow up history
router.get('/:id/follow-ups', (req, res) => {
  const followUps = db.prepare(`
    SELECT f.*, u.name as user_name
    FROM follow_ups f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE f.lead_id = ?
    ORDER BY f.created_at DESC
  `).all(req.params.id)

  res.json({ followUps })
})

// Submit lead via form (public, no auth needed)
router.post('/submit', (req, res) => {
  const { event_id, name, phone, custom_data } = req.body

  if (!event_id || !name || !phone) {
    return res.status(400).json({ error: '请填写必要字段' })
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(event_id)
  if (!event) return res.status(404).json({ error: '活动不存在' })

  const result = db.prepare(`
    INSERT INTO leads (name, phone, event_id, custom_data)
    VALUES (?, ?, ?, ?)
  `).run(name, phone, event_id, JSON.stringify(custom_data || {}))

  res.status(201).json({ message: '信息提交成功', id: result.lastInsertRowid })
})

module.exports = router

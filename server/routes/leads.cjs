const router = require('express').Router()
const db = require('../db.cjs')

// Get public lead pool (unclaimed leads)
router.get('/public', async (req, res) => {
  const leads = await db.all(`
    SELECT l.*, e.name as event_name
    FROM leads l
    LEFT JOIN events e ON l.event_id = e.id
    WHERE l.owner_id IS NULL
    ORDER BY l.created_at DESC
  `)

  const availableCount = leads.length
  const todayCount = (await db.get("SELECT COUNT(*) as count FROM leads WHERE owner_id IS NULL AND date(created_at) = date('now')")).count
  const recoveryCount = (await db.get(`
    SELECT COUNT(*) as count FROM leads
    WHERE owner_id IS NOT NULL AND status = 'pending'
    AND julianday('now') - julianday(claimed_at) > (
      SELECT recovery_days FROM settings WHERE user_id = owner_id LIMIT 1
    )
  `)).count

  const stats = {
    available: availableCount,
    today: todayCount,
    recovery: recoveryCount
  }

  res.json({ leads, stats })
})

// Get personal leads for current user
router.get('/personal', async (req, res) => {
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
  const leads = await db.all(sql, params)

  const [
    pendingResult, contactedResult, negotiatingResult,
    convertedResult, abandonedResult
  ] = await Promise.all([
    db.get("SELECT COUNT(*) as count FROM leads WHERE owner_id = ? AND status = 'pending'", [userId]),
    db.get("SELECT COUNT(*) as count FROM leads WHERE owner_id = ? AND status = 'contacted'", [userId]),
    db.get("SELECT COUNT(*) as count FROM leads WHERE owner_id = ? AND status = 'negotiating'", [userId]),
    db.get("SELECT COUNT(*) as count FROM leads WHERE owner_id = ? AND status = 'converted'", [userId]),
    db.get("SELECT COUNT(*) as count FROM leads WHERE owner_id = ? AND status = 'abandoned'", [userId]),
  ])

  const stats = {
    pending: pendingResult.count,
    contacted: contactedResult.count,
    negotiating: negotiatingResult.count,
    converted: convertedResult.count,
    abandoned: abandonedResult.count,
  }

  res.json({ leads, stats })
})

// Claim a lead from public pool
router.post('/:id/claim', async (req, res) => {
  const userId = req.session.userId || 1
  const lead = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id])

  if (!lead) return res.status(404).json({ error: '线索不存在' })
  if (lead.owner_id) return res.status(400).json({ error: '该线索已被领用' })

  await db.run("UPDATE leads SET owner_id = ?, claimed_at = datetime('now') WHERE id = ?", [userId, req.params.id])
  const updated = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id])
  res.json({ lead: updated, message: '线索领用成功' })
})

// Follow up on a lead
router.post('/:id/follow', async (req, res) => {
  const userId = req.session.userId || 1
  const { status, rating, note } = req.body
  const lead = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id])

  if (!lead) return res.status(404).json({ error: '线索不存在' })

  // Update lead status and rating
  if (status) {
    await db.run('UPDATE leads SET status = ? WHERE id = ?', [status, req.params.id])
  }
  if (rating !== undefined) {
    await db.run('UPDATE leads SET rating = ? WHERE id = ?', [rating, req.params.id])
  }

  // Create follow up record
  await db.run('INSERT INTO follow_ups (lead_id, user_id, status, rating, note) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, userId, status || lead.status, rating ?? lead.rating, note || ''])

  const updated = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id])
  res.json({ lead: updated, message: '跟进记录已保存' })
})

// Get follow up history
router.get('/:id/follow-ups', async (req, res) => {
  const followUps = await db.all(`
    SELECT f.*, u.name as user_name
    FROM follow_ups f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE f.lead_id = ?
    ORDER BY f.created_at DESC
  `, [req.params.id])

  res.json({ followUps })
})

// Submit lead via form (public, no auth needed)
router.post('/submit', async (req, res) => {
  const { event_id, name, phone, custom_data } = req.body

  if (!event_id || !name || !phone) {
    return res.status(400).json({ error: '请填写必要字段' })
  }

  const event = await db.get('SELECT * FROM events WHERE id = ?', [event_id])
  if (!event) return res.status(404).json({ error: '活动不存在' })

  const result = await db.run(`
    INSERT INTO leads (name, phone, event_id, custom_data)
    VALUES (?, ?, ?, ?)
  `, [name, phone, event_id, JSON.stringify(custom_data || {})])

  res.status(201).json({ message: '信息提交成功', id: result.lastInsertRowid })
})

module.exports = router

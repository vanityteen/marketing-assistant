const router = require('express').Router()
const db = require('../db.cjs')
const QRCode = require('qrcode')

// List all events
router.get('/', (req, res) => {
  const { status, search } = req.query
  let sql = 'SELECT e.*, COUNT(l.id) as lead_count FROM events e LEFT JOIN leads l ON l.event_id = e.id'
  const params = []
  const conditions = []

  if (status && status !== 'all') {
    conditions.push('e.status = ?')
    params.push(status)
  }
  if (search) {
    conditions.push('e.name LIKE ?')
    params.push(`%${search}%`)
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }
  sql += ' GROUP BY e.id ORDER BY e.created_at DESC'

  const events = db.prepare(sql).all(...params)

  // Calculate ROI for each event
  const result = events.map(event => ({
    ...event,
    roi: event.expense > 0 ? Math.round((event.budget / event.expense) * 100) : 0,
    form_fields: JSON.parse(event.form_fields || '[]')
  }))

  res.json({ events: result })
})

// Get single event
router.get('/:id', (req, res) => {
  const event = db.prepare(`
    SELECT e.*, COUNT(l.id) as lead_count
    FROM events e LEFT JOIN leads l ON l.event_id = e.id
    WHERE e.id = ?
    GROUP BY e.id
  `).get(req.params.id)

  if (!event) return res.status(404).json({ error: '活动不存在' })

  event.form_fields = JSON.parse(event.form_fields || '[]')
  event.roi = event.expense > 0 ? Math.round((event.budget / event.expense) * 100) : 0

  // Get associated leads
  const leads = db.prepare('SELECT * FROM leads WHERE event_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id)

  res.json({ event, leads })
})

// Create event
router.post('/', (req, res) => {
  const userId = req.session.userId || 1
  const { name, start_date, end_date, budget, description, form_fields } = req.body

  if (!name || !start_date || !end_date) {
    return res.status(400).json({ error: '请填写必要字段' })
  }

  const result = db.prepare(`
    INSERT INTO events (name, start_date, end_date, budget, description, form_fields, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, start_date, end_date, budget || 0, description || '', JSON.stringify(form_fields || []), userId)

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid)
  event.form_fields = JSON.parse(event.form_fields || '[]')

  res.status(201).json({ event })
})

// Update event
router.put('/:id', (req, res) => {
  const { name, start_date, end_date, budget, expense, description, status, form_fields } = req.body
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
  if (!event) return res.status(404).json({ error: '活动不存在' })

  db.prepare(`
    UPDATE events SET name = ?, start_date = ?, end_date = ?, budget = ?, expense = ?,
    description = ?, status = ?, form_fields = ? WHERE id = ?
  `).run(
    name || event.name, start_date || event.start_date, end_date || event.end_date,
    budget ?? event.budget, expense ?? event.expense,
    description ?? event.description, status || event.status,
    form_fields ? JSON.stringify(form_fields) : event.form_fields,
    req.params.id
  )

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
  updated.form_fields = JSON.parse(updated.form_fields || '[]')
  res.json({ event: updated })
})

// Delete event
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id)
  res.json({ message: '活动已删除' })
})

// Generate QR code for event
router.get('/:id/qrcode', async (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
  if (!event) return res.status(404).json({ error: '活动不存在' })

  try {
    // Generate a URL that points to the lead submission form
    const baseUrl = req.protocol + '://' + req.get('host')
    const formUrl = `${baseUrl}/submit/${req.params.id}`
    const qrDataUrl = await QRCode.toDataURL(formUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#333333', light: '#ffffff' }
    })
    res.json({ qrcode: qrDataUrl, url: formUrl })
  } catch (err) {
    res.status(500).json({ error: '二维码生成失败' })
  }
})

module.exports = router

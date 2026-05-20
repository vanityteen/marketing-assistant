const router = require('express').Router()
const db = require('../db.cjs')
const QRCode = require('qrcode')

// List all events
router.get('/', async (req, res) => {
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

  const events = await db.all(sql, params)

  // Calculate ROI for each event
  const result = events.map(event => ({
    ...event,
    roi: event.expense > 0 ? Math.round((event.budget / event.expense) * 100) : 0,
    form_fields: JSON.parse(event.form_fields || '[]')
  }))

  res.json({ events: result })
})

// Get single event
router.get('/:id', async (req, res) => {
  const event = await db.get(`
    SELECT e.*, COUNT(l.id) as lead_count
    FROM events e LEFT JOIN leads l ON l.event_id = e.id
    WHERE e.id = ?
    GROUP BY e.id
  `, [req.params.id])

  if (!event) return res.status(404).json({ error: '活动不存在' })

  event.form_fields = JSON.parse(event.form_fields || '[]')
  event.roi = event.expense > 0 ? Math.round((event.budget / event.expense) * 100) : 0

  // Get associated leads
  const leads = await db.all('SELECT * FROM leads WHERE event_id = ? ORDER BY created_at DESC LIMIT 10', [req.params.id])

  res.json({ event, leads })
})

// Create event
router.post('/', async (req, res) => {
  const userId = req.session.userId || 1
  const { name, start_date, end_date, budget, description, form_fields } = req.body

  if (!name || !start_date || !end_date) {
    return res.status(400).json({ error: '请填写必要字段' })
  }

  const result = await db.run(`
    INSERT INTO events (name, start_date, end_date, budget, description, form_fields, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [name, start_date, end_date, budget || 0, description || '', JSON.stringify(form_fields || []), userId])

  const event = await db.get('SELECT * FROM events WHERE id = ?', [result.lastInsertRowid])
  event.form_fields = JSON.parse(event.form_fields || '[]')

  res.status(201).json({ event })
})

// Update event
router.put('/:id', async (req, res) => {
  const { name, start_date, end_date, budget, expense, description, status, form_fields } = req.body
  const event = await db.get('SELECT * FROM events WHERE id = ?', [req.params.id])
  if (!event) return res.status(404).json({ error: '活动不存在' })

  await db.run(`
    UPDATE events SET name = ?, start_date = ?, end_date = ?, budget = ?, expense = ?,
    description = ?, status = ?, form_fields = ? WHERE id = ?
  `, [
    name || event.name, start_date || event.start_date, end_date || event.end_date,
    budget ?? event.budget, expense ?? event.expense,
    description ?? event.description, status || event.status,
    form_fields ? JSON.stringify(form_fields) : event.form_fields,
    req.params.id
  ])

  const updated = await db.get('SELECT * FROM events WHERE id = ?', [req.params.id])
  updated.form_fields = JSON.parse(updated.form_fields || '[]')
  res.json({ event: updated })
})

// Delete event
router.delete('/:id', async (req, res) => {
  await db.run('DELETE FROM events WHERE id = ?', [req.params.id])
  res.json({ message: '活动已删除' })
})

// Generate QR code for event
router.get('/:id/qrcode', async (req, res) => {
  const event = await db.get('SELECT * FROM events WHERE id = ?', [req.params.id])
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

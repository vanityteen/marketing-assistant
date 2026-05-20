const router = require('express').Router()
const db = require('../db.cjs')

// Get all contacts (all leads with status)
router.get('/', (req, res) => {
  const { status, search } = req.query
  let sql = `
    SELECT l.*, e.name as event_name
    FROM leads l
    LEFT JOIN events e ON l.event_id = e.id
    WHERE 1=1
  `
  const params = []

  if (status && status !== 'all') {
    sql += ' AND l.status = ?'
    params.push(status)
  }
  if (search) {
    sql += ' AND (l.name LIKE ? OR l.phone LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  sql += ' ORDER BY l.created_at DESC'
  const contacts = db.prepare(sql).all(...params)

  const total = db.prepare('SELECT COUNT(*) as count FROM leads').get().count

  const statusCounts = {
    pending: db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'pending'").get().count,
    contacted: db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'contacted'").get().count,
    negotiating: db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'negotiating'").get().count,
    converted: db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'converted'").get().count,
    abandoned: db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'abandoned'").get().count
  }

  res.json({ contacts, total, statusCounts })
})

module.exports = router

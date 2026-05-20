const router = require('express').Router()
const db = require('../db.cjs')

// Get all contacts (all leads with status)
router.get('/', async (req, res) => {
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
  const contacts = await db.all(sql, params)

  const totalResult = await db.get('SELECT COUNT(*) as count FROM leads')
  const total = totalResult.count

  const [
    pendingResult, contactedResult, negotiatingResult,
    convertedResult, abandonedResult
  ] = await Promise.all([
    db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'pending'"),
    db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'contacted'"),
    db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'negotiating'"),
    db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'converted'"),
    db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'abandoned'"),
  ])

  const statusCounts = {
    pending: pendingResult.count,
    contacted: contactedResult.count,
    negotiating: negotiatingResult.count,
    converted: convertedResult.count,
    abandoned: abandonedResult.count,
  }

  res.json({ contacts, total, statusCounts })
})

module.exports = router

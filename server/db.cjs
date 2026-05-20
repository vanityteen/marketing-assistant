const { createClient } = require('@libsql/client')
const path = require('path')
const fs = require('fs')

let client = null
let initialized = false

function getClient() {
  if (client) return client

  if (process.env.TURSO_DATABASE_URL) {
    // Production mode: connect to Turso (serverless SQLite-compatible)
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  } else {
    // Development mode: local SQLite file
    const dbPath = path.join(__dirname, '..', 'data', 'marketing.db')
    const dataDir = path.dirname(dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    client = createClient({
      url: `file:${dbPath}`,
    })
  }

  return client
}

async function ensureInitialized() {
  if (initialized) return
  initialized = true

  const db = getClient()

  // Try WAL mode for local dev (harmless if it fails on Turso)
  try { await db.execute('PRAGMA journal_mode = WAL') } catch {}
  try { await db.execute('PRAGMA foreign_keys = ON') } catch {}

  // Create tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'marketer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      budget REAL DEFAULT 0,
      expense REAL DEFAULT 0,
      description TEXT,
      status TEXT DEFAULT 'active',
      form_fields TEXT DEFAULT '[]',
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      event_id INTEGER REFERENCES events(id),
      status TEXT DEFAULT 'pending',
      owner_id INTEGER REFERENCES users(id),
      rating INTEGER DEFAULT 0,
      custom_data TEXT DEFAULT '{}',
      claimed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id),
      user_id INTEGER REFERENCES users(id),
      status TEXT,
      rating INTEGER,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      recovery_days INTEGER DEFAULT 7,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Seed initial data if empty
  const countResult = await db.execute('SELECT COUNT(*) as count FROM users')
  const userCount = Number(countResult.rows[0].count)
  if (userCount === 0) {
    await db.execute({ sql: 'INSERT INTO users (name, role) VALUES (?, ?)', args: ['张三', 'marketer'] })
    await db.execute({ sql: 'INSERT INTO users (name, role) VALUES (?, ?)', args: ['李经理', 'salesperson'] })

    await db.execute({
      sql: 'INSERT INTO events (name, start_date, end_date, budget, expense, description, status, form_fields, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        '夏季促销活动', '2026-06-01', '2026-06-30', 10000, 6500,
        '夏季促销活动，针对新品进行推广，通过线上线下结合的方式吸引客户参与，提升品牌知名度和产品销量。',
        'active',
        JSON.stringify([
          { name: '姓名', type: 'text', required: true },
          { name: '手机号码', type: 'text', required: true },
          { name: '感兴趣的产品', type: 'select', required: false, options: '产品A,产品B,产品C,其他' }
        ]),
        1
      ]
    })
    await db.execute({
      sql: 'INSERT INTO events (name, start_date, end_date, budget, expense, description, status, form_fields, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        '春季展会活动', '2026-04-01', '2026-04-30', 8000, 4000,
        '春季行业展会参展活动，展示公司最新产品和解决方案。',
        'ended',
        JSON.stringify([
          { name: '姓名', type: 'text', required: true },
          { name: '手机号码', type: 'text', required: true }
        ]),
        1
      ]
    })
    await db.execute({
      sql: 'INSERT INTO events (name, start_date, end_date, budget, expense, description, status, form_fields, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        '新品发布会', '2026-05-15', '2026-05-30', 15000, 8500,
        '新品发布会，邀请行业客户和媒体参加，重点推广新一代产品。',
        'active',
        JSON.stringify([
          { name: '姓名', type: 'text', required: true },
          { name: '手机号码', type: 'text', required: true },
          { name: '公司名称', type: 'text', required: false }
        ]),
        1
      ]
    })

    // Public pool leads (no owner)
    await db.execute({ sql: 'INSERT INTO leads (name, phone, event_id, status, owner_id, rating, claimed_at) VALUES (?, ?, ?, ?, ?, ?, ?)', args: ['张三', '13812341234', 1, 'pending', null, 0, null] })
    await db.execute({ sql: 'INSERT INTO leads (name, phone, event_id, status, owner_id, rating, claimed_at) VALUES (?, ?, ?, ?, ?, ?, ?)', args: ['李四', '13956785678', 2, 'pending', null, 0, null] })
    await db.execute({ sql: 'INSERT INTO leads (name, phone, event_id, status, owner_id, rating, claimed_at) VALUES (?, ?, ?, ?, ?, ?, ?)', args: ['王五', '13790129012', 1, 'pending', null, 0, null] })
    await db.execute({ sql: 'INSERT INTO leads (name, phone, event_id, status, owner_id, rating, claimed_at) VALUES (?, ?, ?, ?, ?, ?, ?)', args: ['赵六', '13634563456', 3, 'pending', null, 0, null] })
    // Personal leads (owned by user 1)
    await db.execute({ sql: 'INSERT INTO leads (name, phone, event_id, status, owner_id, rating, claimed_at) VALUES (?, ?, ?, ?, ?, ?, ?)', args: ['钱七', '13511112222', 1, 'pending', 1, 0, '2026-05-10'] })
    await db.execute({ sql: 'INSERT INTO leads (name, phone, event_id, status, owner_id, rating, claimed_at) VALUES (?, ?, ?, ?, ?, ?, ?)', args: ['孙八', '13622223333', 1, 'contacted', 1, 3, '2026-05-09'] })
    await db.execute({ sql: 'INSERT INTO leads (name, phone, event_id, status, owner_id, rating, claimed_at) VALUES (?, ?, ?, ?, ?, ?, ?)', args: ['周九', '13733334444', 2, 'negotiating', 1, 4, '2026-05-11'] })
    await db.execute({ sql: 'INSERT INTO leads (name, phone, event_id, status, owner_id, rating, claimed_at) VALUES (?, ?, ?, ?, ?, ?, ?)', args: ['吴十', '13844445555', 1, 'converted', 1, 5, '2026-05-08'] })

    // Settings
    await db.execute({ sql: 'INSERT INTO settings (user_id, recovery_days) VALUES (?, ?)', args: [1, 7] })

    console.log('✅ Seed data inserted successfully')
  }
}

module.exports = {
  // Get a single row
  async get(sql, params = []) {
    await ensureInitialized()
    const result = await getClient().execute({ sql, args: params })
    return result.rows[0] || null
  },

  // Get all rows
  async all(sql, params = []) {
    await ensureInitialized()
    const result = await getClient().execute({ sql, args: params })
    return result.rows
  },

  // Execute a write query
  async run(sql, params = []) {
    await ensureInitialized()
    const result = await getClient().execute({ sql, args: params })
    return {
      lastInsertRowid: result.lastInsertRowid != null ? Number(result.lastInsertRowid) : null,
      changes: result.rowsAffected,
    }
  },
}

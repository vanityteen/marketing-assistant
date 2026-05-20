const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'marketing.db')

// Ensure data directory exists
const fs = require('fs')
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'marketer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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
  );

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
  );

  CREATE TABLE IF NOT EXISTS follow_ups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER REFERENCES leads(id),
    user_id INTEGER REFERENCES users(id),
    status TEXT,
    rating INTEGER,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id),
    recovery_days INTEGER DEFAULT 7,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

// Seed initial data if tables are empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count
if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (name, role) VALUES (?, ?)')
  insertUser.run('张三', 'marketer')
  insertUser.run('李经理', 'salesperson')

  const insertEvent = db.prepare(`
    INSERT INTO events (name, start_date, end_date, budget, expense, description, status, form_fields, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertEvent.run(
    '夏季促销活动', '2026-06-01', '2026-06-30', 10000, 6500,
    '夏季促销活动，针对新品进行推广，通过线上线下结合的方式吸引客户参与，提升品牌知名度和产品销量。',
    'active',
    JSON.stringify([
      { name: '姓名', type: 'text', required: true },
      { name: '手机号码', type: 'text', required: true },
      { name: '感兴趣的产品', type: 'select', required: false, options: '产品A,产品B,产品C,其他' }
    ]),
    1
  )
  insertEvent.run(
    '春季展会活动', '2026-04-01', '2026-04-30', 8000, 4000,
    '春季行业展会参展活动，展示公司最新产品和解决方案。',
    'ended',
    JSON.stringify([
      { name: '姓名', type: 'text', required: true },
      { name: '手机号码', type: 'text', required: true }
    ]),
    1
  )
  insertEvent.run(
    '新品发布会', '2026-05-15', '2026-05-30', 15000, 8500,
    '新品发布会，邀请行业客户和媒体参加，重点推广新一代产品。',
    'active',
    JSON.stringify([
      { name: '姓名', type: 'text', required: true },
      { name: '手机号码', type: 'text', required: true },
      { name: '公司名称', type: 'text', required: false }
    ]),
    1
  )

  const insertLead = db.prepare(`
    INSERT INTO leads (name, phone, event_id, status, owner_id, rating, claimed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  // Public pool leads (no owner)
  insertLead.run('张三', '13812341234', 1, 'pending', null, 0, null)
  insertLead.run('李四', '13956785678', 2, 'pending', null, 0, null)
  insertLead.run('王五', '13790129012', 1, 'pending', null, 0, null)
  insertLead.run('赵六', '13634563456', 3, 'pending', null, 0, null)
  // Personal leads (owned by user 1)
  insertLead.run('钱七', '13511112222', 1, 'pending', 1, 0, '2026-05-10')
  insertLead.run('孙八', '13622223333', 1, 'contacted', 1, 3, '2026-05-09')
  insertLead.run('周九', '13733334444', 2, 'negotiating', 1, 4, '2026-05-11')
  insertLead.run('吴十', '13844445555', 1, 'converted', 1, 5, '2026-05-08')

  // Settings
  db.prepare('INSERT INTO settings (user_id, recovery_days) VALUES (?, ?)').run(1, 7)

  console.log('✅ Seed data inserted successfully')
}

module.exports = db

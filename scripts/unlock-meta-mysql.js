const path = require('path')
const fs = require('fs')

delete process.env.NC_DB

const dotenv = require('dotenv')
const envDir = path.join(__dirname, '..', 'packages', 'nocodb')
const envCandidates = ['.env', '.env.local', '.env.example'].map((f) => path.join(envDir, f))
const envPath = envCandidates.find((p) => fs.existsSync(p))
if (envPath) dotenv.config({ path: envPath })

const ncDb = process.env.NC_DB
if (!ncDb) {
  console.error('NC_DB is not set')
  process.exit(1)
}

const url = new URL(ncDb)
const user = url.searchParams.get('u')
const password = url.searchParams.get('p')
const database = url.searchParams.get('d')
const host = url.hostname || 'localhost'
const port = url.port ? Number(url.port) : 3306

if (!user || !password || !database) {
  console.error('NC_DB must include u, p, d query params')
  process.exit(1)
}

const mysql = require('mysql2/promise')

async function unlockTable(conn, table) {
  try {
    const [res] = await conn.execute(`UPDATE \`${table}\` SET is_locked=0`)
    const affectedRows = typeof res?.affectedRows === 'number' ? res.affectedRows : null
    console.log(`Unlocked ${table}${affectedRows === null ? '' : ` (affectedRows=${affectedRows})`}`)
    return true
  } catch (e) {
    if (String(e?.message || '').includes("doesn't exist")) return false
    console.error(`Failed unlocking ${table}:`, e?.message || e)
    return false
  }
}

async function main() {
  const conn = await mysql.createConnection({ host, port, user, password, database })
  const [tablesRows] = await conn.query('SHOW TABLES')
  const tableNames = tablesRows.map((r) => Object.values(r)[0])
  const lockLike = tableNames.filter((n) => String(n).includes('lock') || String(n).includes('migr'))
  console.log(`Found ${tableNames.length} tables; lock-like: ${lockLike.join(', ') || '(none)'}`)

  const candidates = Array.from(new Set(['nc_migrations_lock', 'knex_migrations_lock', ...lockLike]))
  const unlocked = []
  for (const table of candidates) {
    const ok = await unlockTable(conn, table)
    if (ok) unlocked.push(table)
  }
  await conn.end()
  if (!unlocked.length) {
    console.log('No lock table found (nothing to unlock)')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

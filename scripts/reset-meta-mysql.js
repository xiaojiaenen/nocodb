const path = require('path')

delete process.env.NC_DB

const dotenv = require('dotenv')
dotenv.config({ path: path.join(__dirname, '..', 'packages', 'nocodb', '.env') })

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

async function main() {
  const conn = await mysql.createConnection({ host, port, user, password })
  await conn.query(`DROP DATABASE IF EXISTS \`${database}\``)
  await conn.query(`CREATE DATABASE \`${database}\``)
  await conn.end()
  console.log(`Reset database ${database}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

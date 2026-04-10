import fs from 'fs'
import path from 'path'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzQ-qUNPC2LtjZIdeLbl3RM55Ci7lLWrcwJ72W8BNwHmnV9xE_JVyeThrqtGro6Ev70/exec'
const CONFIG_FILE = path.join(process.cwd(), 'autosave-users.json')
const sessionCache = new Set()

function loadUsers() {
  try { if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) } catch (e) {}
  return {}
}

let handler = async (m, { conn }) => {
  try {
    const users = loadUsers()
    const botId = conn.user.jid.split('@')[0]
    const user = users[botId]
    if (!user?.email) return

    const senderJid = m.sender
    if (!senderJid || senderJid.endsWith('@g.us')) return
    if (m.key?.fromMe) return
    if (sessionCache.has(senderJid)) return
    sessionCache.add(senderJid)

    const phone = '+' + senderJid.split('@')[0]
    const name = m.pushName || ('WA ' + phone)

    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_contact',
        userEmail: user.email,
        name, phone,
        secret: 'ORISHA2026SECRET'
      }),
      redirect: 'follow'
    })
    const result = await res.json()
    console.log(`[AutoSave] ${name} (${phone}) → ${result.status}`)
  } catch (err) {
    console.error('[AutoSave] Erreur:', err.message)
  }
}

handler.all = true
handler.command = false
export default handler

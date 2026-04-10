import fs from 'fs'
import path from 'path'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzQ-qUNPC2LtjZIdeLbl3RM55Ci7lLWrcwJ72W8BNwHmnV9xE_JVyeThrqtGro6Ev70/exec'
const CONFIG_FILE = path.join(process.cwd(), 'autosave-users.json')

function loadUsers() {
  try { if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) } catch (e) {}
  return {}
}
function saveUsers(u) { try { fs.writeFileSync(CONFIG_FILE, JSON.stringify(u, null, 2)) } catch (e) {} }

let handler = async (m, { conn, args }) => {
  const email = args[0]?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return conn.reply(m.chat, '❌ Email invalide.\n\nUtilise :\n.activate ton@gmail.com', m)

  conn.reply(m.chat, '⏳ Activation en cours...', m)
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'validate_email', userEmail: email, secret: 'ORISHA2026SECRET' }),
      redirect: 'follow'
    })
    const result = await res.json()
    if (result.success) {
      const users = loadUsers()
      const botId = conn.user.jid.split('@')[0]
      users[botId] = { email, activatedAt: new Date().toISOString() }
      saveUsers(users)
      conn.reply(m.chat, `✅ *Activation réussie !*\n\n📧 Gmail : ${email}\n\nChaque inconnu qui t'écrit sera automatiquement sauvegardé dans tes contacts Google. 📲`, m)
    } else {
      conn.reply(m.chat, `❌ Échec : ${result.error}`, m)
    }
  } catch (err) {
    conn.reply(m.chat, `❌ Erreur : ${err.message}`, m)
  }
}

handler.command = /^activate$/i
export default handler

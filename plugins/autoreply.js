import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'autosave-users.json')

function loadUsers() {
  try { if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) } catch (e) {}
  return {}
}
function saveUsers(u) { try { fs.writeFileSync(CONFIG_FILE, JSON.stringify(u, null, 2)) } catch (e) {} }

let handler = async (m, { conn, args }) => {
  const users = loadUsers()
  const botId = conn.user.jid.split('@')[0]
  const sub = args[0]?.toLowerCase()

  if (sub === 'on') {
    users[botId] = { ...users[botId], autoreply: { ...users[botId]?.autoreply, enabled: true } }
    saveUsers(users)
    return conn.reply(m.chat, '✅ Réponse automatique *activée* !', m)
  }

  if (sub === 'off') {
    users[botId] = { ...users[botId], autoreply: { ...users[botId]?.autoreply, enabled: false } }
    saveUsers(users)
    return conn.reply(m.chat, '✅ Réponse automatique *désactivée*.', m)
  }

  if (sub === 'set') {
    const msg = args.slice(1).join(' ').trim()
    if (!msg) return conn.reply(m.chat, '❌ Message vide.\n\nUtilise : .autoreply set Votre message', m)
    users[botId] = { ...users[botId], autoreply: { ...users[botId]?.autoreply, message: msg } }
    saveUsers(users)
    return conn.reply(m.chat, `✅ Message défini :\n\n"${msg}"`, m)
  }

  const status = users[botId]?.autoreply?.enabled ? '✅ Activée' : '❌ Désactivée'
  const msg = users[botId]?.autoreply?.message || 'Non défini'
  conn.reply(m.chat, [
    `📋 *Réponse Automatique*`,
    ``,
    `Statut : ${status}`,
    `Message : "${msg}"`,
    ``,
    `Commandes :`,
    `• .autoreply on`,
    `• .autoreply off`,
    `• .autoreply set <message>`
  ].join('\n'), m)
}

handler.command = /^autoreply$/i
export default handler

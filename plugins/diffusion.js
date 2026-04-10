import fs from 'fs'
import path from 'path'

const BROADCAST_FILE = path.join(process.cwd(), 'broadcast-list.json')

function loadBroadcast() {
  try { if (fs.existsSync(BROADCAST_FILE)) return JSON.parse(fs.readFileSync(BROADCAST_FILE, 'utf8')) } catch (e) {}
  return { contacts: [] }
}

function saveBroadcast(data) {
  try { fs.writeFileSync(BROADCAST_FILE, JSON.stringify(data, null, 2)) } catch (e) {}
}

let handler = async (m, { conn, args, text }) => {
  const data = loadBroadcast()
  const contacts = data.contacts || []
  const sub = args[0]?.toLowerCase()

  if (!sub || sub === 'liste') {
    if (contacts.length === 0)
      return conn.reply(m.chat, '📋 *Liste vide*\n\nAjoutez : .diffusion ajouter +229XX', m)
    let msg = `📋 *Liste de diffusion*\n\n👥 ${contacts.length} contacts\n\n`
    contacts.slice(0, 20).forEach((c, i) => { msg += `${i + 1}. ${c.name} — ${c.phone}\n` })
    if (contacts.length > 20) msg += `\n_... et ${contacts.length - 20} autres_`
    return conn.reply(m.chat, msg, m)
  }

  if (sub === 'ajouter') {
    const phone = args[1]?.trim()
    if (!phone?.startsWith('+'))
      return conn.reply(m.chat, '❌ Format : .diffusion ajouter +229XXXXXXXX', m)
    const exists = contacts.find(c => c.phone === phone)
    if (exists) return conn.reply(m.chat, `⚠️ ${phone} déjà dans la liste.`, m)
    contacts.push({ phone, name: phone, addedAt: new Date().toISOString() })
    saveBroadcast({ contacts })
    return conn.reply(m.chat, `✅ ${phone} ajouté. Total : ${contacts.length}`, m)
  }

  if (sub === 'supprimer') {
    const phone = args[1]?.trim()
    if (!phone?.startsWith('+'))
      return conn.reply(m.chat, '❌ Format : .diffusion supprimer +229XXXXXXXX', m)
    const before = contacts.length
    data.contacts = contacts.filter(c => c.phone !== phone)
    saveBroadcast(data)
    return conn.reply(m.chat, data.contacts.length < before ? `✅ ${phone} supprimé.` : `⚠️ ${phone} non trouvé.`, m)
  }

  if (sub === 'stats') {
    const lists = Math.ceil(contacts.length / 256)
    return conn.reply(m.chat, `📊 *Stats Diffusion*\n\n👥 Contacts : ${contacts.length}\n📦 Listes : ${lists}\n📏 Max/liste : 256`, m)
  }

  if (sub === 'vider') {
    saveBroadcast({ contacts: [] })
    return conn.reply(m.chat, '✅ Liste vidée.', m)
  }

  if (sub === 'envoyer') {
    const message = args.slice(1).join(' ').trim()
    if (!message) return conn.reply(m.chat, '❌ Message vide.\n\nUtilise : .diffusion envoyer Votre message', m)
    if (contacts.length === 0) return conn.reply(m.chat, '⚠️ Liste vide.', m)
    await conn.reply(m.chat, `📤 Envoi à ${contacts.length} contacts...`, m)
    let sent = 0, failed = 0
    for (const contact of contacts) {
      try {
        await conn.sendMessage(contact.phone.replace('+', '') + '@s.whatsapp.net', { text: message })
        sent++
        await new Promise(r => setTimeout(r, 1500))
      } catch (e) { failed++ }
    }
    return conn.reply(m.chat, `✅ *Diffusion terminée !*\n\n📤 Envoyés : ${sent}\n❌ Échecs : ${failed}`, m)
  }
}

handler.command = /^diffusion$/i
export default handler

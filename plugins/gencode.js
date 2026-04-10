import fs from 'fs'
import path from 'path'

const CODES_FILE = path.join(process.cwd(), 'orisha-codes.json')
const SITE_URL = 'https://orishabot.netlify.app'
const OWNER = '22997599631'

function loadCodes() {
  try { if (fs.existsSync(CODES_FILE)) return JSON.parse(fs.readFileSync(CODES_FILE, 'utf8')) } catch (e) {}
  return {}
}

function saveCodes(data) {
  try { fs.writeFileSync(CODES_FILE, JSON.stringify(data, null, 2)) } catch (e) {}
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const p1 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const p2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `ORISHA-${p1}-${p2}`
}

let handler = async (m, { conn, args }) => {
  const ownerJid = OWNER + '@s.whatsapp.net'
  if (m.sender !== ownerJid && !m.key?.fromMe)
    return conn.reply(m.chat, '⛔ Commande réservée au propriétaire.', m)

  const clientPhone = args[0]?.trim()
  const clientName = args[1]?.trim() || 'Client'
  const plan = args[2]?.toLowerCase() || 'starter'

  if (!clientPhone?.startsWith('+'))
    return conn.reply(m.chat, '❌ Format :\n*.gencode +229XXXXXXXX NomClient starter*\n\nPlans : starter | pro | business', m)

  const code = generateCode()
  const codes = loadCodes()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  codes[code] = {
    phone: clientPhone,
    name: clientName,
    plan,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    used: false
  }
  saveCodes(codes)

  await conn.reply(m.chat, [
    `✅ *Code généré !*`,
    ``,
    `👤 ${clientName}`,
    `📞 ${clientPhone}`,
    `⭐ Plan : ${plan.toUpperCase()}`,
    `🎟️ Code : *${code}*`,
    `📅 Expire : ${expiresAt.toLocaleDateString('fr-FR')}`
  ].join('\n'), m)

  try {
    const clientJid = clientPhone.replace('+', '') + '@s.whatsapp.net'
    await conn.sendMessage(clientJid, {
      text: [
        `🤖 *Bienvenue sur OrishaBot !*`,
        ``,
        `Bonjour ${clientName} ! ✅`,
        `Votre paiement a été confirmé.`,
        ``,
        `🎟️ *Votre code d'activation :*`,
        `*${code}*`,
        ``,
        `📲 Activez votre bot ici :`,
        `${SITE_URL}`,
        ``,
        `📅 Valide jusqu'au : ${expiresAt.toLocaleDateString('fr-FR')}`,
        ``,
        `_OrishaGroupe-Africa © 2026_`
      ].join('\n')
    })
    await conn.reply(m.chat, `✅ Code envoyé à ${clientPhone}`, m)
  } catch (err) {
    await conn.reply(m.chat, `⚠️ Code créé mais envoi échoué : ${err.message}`, m)
  }
}

handler.command = /^gencode$/i
export default handler

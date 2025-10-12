import dotenv from "dotenv"
dotenv.config()
import { Events, Client, GatewayIntentBits } from "discord.js"
import { readFileSync } from "node:fs"
const client = new Client({
    intents : [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})
client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.username}`)
})
const b23msg = /https:\/\/b23\.tv\/[A-Za-z0-9]+/g
const shareID = "&share_session_id="
const blockedWordsPath = new URL("./blockedWords.json", import.meta.url)
const blacklistedUsersPath = new URL("./blacklistedUserIds.json", import.meta.url)
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
let blockedWords = []
let blacklistedUserIds = []
try {
    const raw = readFileSync(blockedWordsPath, "utf8")
    const parsed = JSON.parse(raw)
    blockedWords = Array.isArray(parsed) ? parsed : []
    if(!Array.isArray(parsed)){
        console.warn("blockedWords.json must be a JSON array; ignoring content.")
    }
}
catch(err){
    console.warn("Unable to load blockedWords.json, continuing without word filtering.", err.message)
}
try {
    const raw = readFileSync(blacklistedUsersPath, "utf8")
    const parsed = JSON.parse(raw)
    blacklistedUserIds = Array.isArray(parsed) ? parsed : []
    if(!Array.isArray(parsed)){
        console.warn("blacklistedUserIds.json must be a JSON array; ignoring content.")
    }
}
catch(err){
    console.warn("Unable to load blacklistedUserIds.json, continuing without user filtering.", err.message)
}
const blockedWordsRegex = blockedWords.length
    ? new RegExp(blockedWords.map(escapeRegex).join("|"), "iu")
    : null
const blacklistedUserIdsSet = new Set(
    blacklistedUserIds
        .map((value) => typeof value === "string" ? value.trim() : "")
        .filter(Boolean)
)

client.on(Events.MessageCreate, async (msg) => {
    if(msg.author.bot) return
    const isBlacklistedUser = blacklistedUserIdsSet.has(msg.author.id)
    const containsBlockedWord = blockedWordsRegex ? blockedWordsRegex.test(msg.content) : false
    if(isBlacklistedUser && containsBlockedWord){
        await msg.delete()
        await msg.channel.send(`${msg.author.username} tried to send a blocked message.`)
        return
    }
    
    try {
        let newMsg = msg.content
        
        if (msg.content.match(b23msg)){
            for (const b23 of msg.content.match(b23msg)){
                const res = await fetch(b23, {redirect: "follow"})
                const clearURL = res.url.split("?")[0]
                newMsg = newMsg.replace(b23, clearURL)
            }
            await msg.delete()
            await msg.channel.send(`${msg.author.username} said: ${newMsg}`)
        }
        else if(msg.content.includes(shareID)){
            newMsg = msg.content.split("?")[0]
            await msg.delete()
            await msg.channel.send(`${msg.author.username} said: ${newMsg}`)
        }
    }
    catch(err){
        const errorDetails = {
            error: err.message,
            messageContent: msg.content,
            author: msg.author.username,
            channelId: msg.channel.id
        }
        console.error("Failed when processing b23:", JSON.stringify(errorDetails, null, 2))
    }
})

client.login(process.env.DISCORD_TOKEN)

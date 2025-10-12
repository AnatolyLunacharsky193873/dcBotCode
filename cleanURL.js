import dotenv from "dotenv"
dotenv.config()
import { Events, Client, GatewayIntentBits } from "discord.js"
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

//禁止性压抑
const blacklistedUserIds = new Set([
    "957987432115077181"
])
const blockedWords = ["操","逼","男","女","丑","好看","帅","集美","性"]

const b23msg = /https:\/\/b23\.tv\/[A-Za-z0-9]+/g
const shareID = "&share_session_id="

client.on(Events.MessageCreate, async (msg) => {
    if(msg.author.bot) return
    
    try {
        let newMsg = msg.content

        if (
            blacklistedUserIds.has(msg.author.id) &&
            blockedWords.some((word) => msg.content.includes(word))
        ) {
            await msg.delete()
            return
        }
        
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

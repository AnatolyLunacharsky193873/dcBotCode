import "dotenv/config"
import { Client, GatewayIntentBits } from "discord.js"

const client = new Client({
    Intents : [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})
client.once("ready", () => {
    console.log(`Logged in as ${client.user.username}`)
})
const b23msg = /(https:\/)\/b23\.tv\/[A-Za-z0-9]+/g

client.on("messageCreate", async (msg) => {
    if(msg.author.bot) return
    if (!msg.content.match(b23msg)) return
    try{
        let newMsg = msg.conten
        for (const b23 of msg.conten.match(b23msg)){
            const res = await fetch(b23, {redirect: "follow"})
            const clearURL = res.url.split("?")[0]
            newMsg = newMsg.replace(b23, clearURL)

        }
        await msg.delete()
        await msg.channel.send(`${msg.author.username} said: ${newMsg}`)
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

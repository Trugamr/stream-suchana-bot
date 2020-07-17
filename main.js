require('dotenv').config()

const { Telegraf } = require('telegraf')
const { TELEGRAM_BOT_TOKEN } = process.env
const twitch = require('./twitch')

const bot = new Telegraf(TELEGRAM_BOT_TOKEN)

bot.start(ctx => {
  ctx.reply('Hello!')
})

// Fuzzy search, selec first channel and find its streaming status
// twitch
//   .isStreamingByName('xqcow')
//   .then(data => console.log(data))
//   .catch(error => console.error(error))

// Checking streaming status of channel using channelID
// twitch
//   .isStreamingById('71092938')
//   .then(data => console.log(data))
//   .catch(error => console.error(error))

bot.launch()

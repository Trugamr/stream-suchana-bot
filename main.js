require('dotenv').config()

const { Telegraf } = require('telegraf')
const { TELEGRAM_BOT_TOKEN } = process.env

const bot = new Telegraf(TELEGRAM_BOT_TOKEN)

bot.start(ctx => {
  console.log(ctx)
  ctx.reply('Hello!')
})

bot.launch()

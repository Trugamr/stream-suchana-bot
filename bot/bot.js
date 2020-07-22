// Environment variables setup
require('dotenv').config()

const Telegraf = require('telegraf')
const { TELEGRAM_BOT_TOKEN } = process.env

const startCommand = require('./commands/start')
const loginCommand = require('./commands/login')

const bot = new Telegraf(TELEGRAM_BOT_TOKEN)

bot.start(startCommand)

// Custom commands
bot.command('login', loginCommand)

module.exports = bot

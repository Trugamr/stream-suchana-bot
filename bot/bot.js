// Environment variables setup
require('dotenv').config()

const Telegraf = require('telegraf')
const { TELEGRAM_BOT_TOKEN } = process.env

const startCommand = require('./commands/start')
const loginCommand = require('./commands/login')
const streamingCommand = require('./commands/streaming')
const User = require('../db/models/user-model')

const bot = new Telegraf(TELEGRAM_BOT_TOKEN)

// Array of commands that needs twitch authentication
const needAuth = ['streaming']

// Middlewares setup
bot.command(needAuth, async (ctx, next) => {
  const message = 'This command requires you to be authorized using Twitch.'
  // Query db for access and refresh tokens
  const currentUser = await User.findOne({ 'telegram.chatId': ctx.from.id })

  if (!currentUser) ctx.reply(message)
  else {
    // Check if user has twitch tokens if not send unauthorized message
    if (!(currentUser.twitch.accessToken && currentUser.twitch.refreshToken))
      return ctx.reply(message)
    const { accessToken, refreshToken } = currentUser.twitch
    // If tg user found and authenticated using twitch, append tokens and forward context
    ctx.state = {
      accessToken,
      refreshToken
    }
    next(ctx)
  }
})

// Start Command
// TODO: Add entry to telegram user in database on start command instead of login
bot.start(startCommand)

// Custom commands
bot.command('login', loginCommand)
bot.command('streaming', streamingCommand)

module.exports = bot

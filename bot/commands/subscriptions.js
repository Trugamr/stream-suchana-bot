const Streamer = require('../../db/models/streamer-model')
const Twitch = require('../../twitch')

module.exports = async (ctx, next) => {
  const { accessToken, refreshToken } = ctx.state
  const telegramChatId = ctx.from.id
  const twitch = new Twitch({ accessToken, refreshToken })

  try {
    // Get user's subscriptions from streamers collection
    // Returns twitch id's of subscribed streamers
    const subscriptions = await Streamer.find({
      subscribers: { $elemMatch: { telegramChatId: telegramChatId } }
    })

    if (!subscriptions.length)
      return ctx.reply('You are not subscribed to anyone')

    const streamerIds = subscriptions.map(sub => sub.streamerId)

    const streamersInfo = await twitch.multipleUserInfo(streamerIds, {
      type: 'id'
    })

    let message = '*Your Subscriptions*\n'
    message += streamersInfo
      .map(streamer => streamer.display_name)
      .sort()
      .map((name, index) => `${index + 1}. ${name}`)
      .join('\n')

    ctx.reply(message, {
      parse_mode: 'markdown'
    })
  } catch (error) {
    console.log(error)
    ctx.reply('Failed to get subscriptions')
  }
}

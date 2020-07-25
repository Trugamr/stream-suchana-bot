const Twitch = require('../../twitch')
const User = require('../../db/models/user-model')
const Streamer = require('../../db/models/streamer-model')
const { getArgs } = require('../../utils')

// TODO: Verify twitch username
// TODO: Add twitch streamer to streamers collection
// TODO: Subscribe to webhook
// TODO: Add mongo document id of user to twitch streamer

exports.subscribeCommand = async (ctx, next) => {
  const { accessToken, refreshToken } = ctx.state
  const twitch = new Twitch({ accessToken, refreshToken })
  const args = getArgs(ctx.message.text)
  if (!args.length)
    return ctx.reply(
      'You need to provide username of streamer you want to subscribe to.'
    )
  try {
    const streamerInfo = await twitch.userInfo(args[0])
    const currentUser = await User.findOne({ 'telegram.chatId': ctx.from.id })
    if (!currentUser)
      return console.log('FAILED TO FIND TELEGRAM USER WITH SPECIFIED CHAT ID')
    const currentStreamer = await Streamer.findOne({
      streamerId: streamerInfo.id
    })

    // Streamer already exists in db, add document id of user along with their telegram chat id
    if (currentStreamer) {
      // Pushing user to streamer in memory and saving to update in db
      await Streamer.updateOne(
        {
          _id: currentStreamer._id,
          // Only push if currentUser is not already subscribed
          'subscribers.userObjectId': { $ne: currentUser._id }
        },
        {
          $addToSet: {
            subscribers: {
              telegramChatId: currentUser.telegram.chatId,
              userObjectId: currentUser._id
            }
          }
        }
      )
    } else {
      // Create Streamer then add user info
      const newStreamer = new Streamer({
        streamerId: streamerInfo.id,
        subscribers: [
          {
            telegramChatId: currentUser.telegram.chatId,
            userObjectId: currentUser._id
          }
        ]
      })

      await newStreamer.save()
    }
  } catch (error) {
    console.log(error)
    ctx.reply(`Failed to subscribe to ${args[0]}.`)
  }
}

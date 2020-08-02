const Twitch = require('../../twitch')
const User = require('../../db/models/user-model')
const Streamer = require('../../db/models/streamer-model')
const { getArgs } = require('../../utils')

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

    // Check if currentStreamer had 0 entries
    // If currentStreamer is null that means its a new streamer
    // In both cases sub to webhook because streamers with 0 entries dont get webhook refreshed
    if (
      currentStreamer == null ||
      (currentStreamer && currentStreamer.subscribers.length == 0)
    ) {
      // Subscribe to webhook
      const response = await twitch.subscribeToStreamer(streamerInfo.id)
      if (!response.status == 202)
        return ctx.reply(`Failed to subscribe to ${streamerInfo.display_name}`)
    }

    ctx.reply(
      `We'll let you know whenever ${streamerInfo.display_name} starts streaming`
    )
  } catch (error) {
    console.log(error)
    ctx.reply(`Failed to subscribe to ${args[0]}.`)
  }
}

exports.unsubscribeCommand = async (ctx, next) => {
  const { accessToken, refreshToken } = ctx.state
  const twitch = new Twitch({ accessToken, refreshToken })
  const args = getArgs(ctx.message.text)
  if (!args.length)
    return ctx.reply(
      'You need to provide username of streamer you want to subscribe to.'
    )

  try {
    const streamerInfo = await twitch.userInfo(args[0])
    // TODO: Find better parameter to base pull on instead of telegramChatId
    const removeSubscription = await Streamer.updateOne(
      { streamerId: streamerInfo.id },
      {
        $pull: {
          subscribers: {
            telegramChatId: ctx.from.id
          }
        }
      }
    )

    let message = ''
    console.log(removeSubscription)
    if (removeSubscription.nModified) {
      message = `You'll no longer recieve notification when ${streamerInfo.display_name} comes online`
    } else {
      message = `You are already unsubscribed from ${streamerInfo.display_name}`
    }
    ctx.reply(message)
  } catch (error) {
    ctx.reply('Failed to unsubscribe')
    console.log(error)
  }
}

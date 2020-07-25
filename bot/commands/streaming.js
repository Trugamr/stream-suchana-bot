const Twitch = require('../../twitch')
const { getArgs, addSeprator, getHoursMin } = require('../../utils')

// Streaming command that tells user if streamer is specified username is streaming
// /streaming <username>
module.exports = async ctx => {
  const { accessToken, refreshToken } = ctx.state
  const args = getArgs(ctx.message.text)
  const username = args[0]
  if (!username) return ctx.reply('You must specify username.')
  const twitch = new Twitch({ accessToken, refreshToken })
  try {
    const stream = await twitch.streamingInfo(username)

    // TODO: Find a way to check is username is valid
    if (!stream.live) return ctx.reply(`${username} is doesn't seem live`)

    const { title, viewer_count, user_name, started_at } = stream
    const message = `
Title: *${title}*
Started streaming *${getHoursMin(started_at)}* ago
Viewers: *${addSeprator(viewer_count.toString())}*

[${user_name} ](https://twitch.tv/${user_name})`

    // [Preview](${thumbnail_url.replace('{width}', 320).replace('{height}', 180)})

    ctx.reply(message, {
      parse_mode: 'markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Watch Live on Twitch',
              url: `https://twitch.tv/${user_name}`
            }
          ]
        ]
      }
    })
  } catch (error) {
    console.log(error)
    ctx.reply(`Failed to get streaming info for ${args[0]}`)
  }
}

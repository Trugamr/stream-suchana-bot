const Twitch = require('../../twitch')

exports.subscribeCommand = async (ctx, next) => {
  const { accessToken, refreshToken } = ctx.state
  const twitch = new Twitch({ accessToken, refreshToken })
  await twitch.subscribeStream('addictgamr')
  ctx.reply('ok yaar')
}

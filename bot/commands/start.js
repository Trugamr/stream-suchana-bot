// Start command

module.exports = (ctx, next) => {
  console.log(ctx)
  ctx.reply('Hello!')
}

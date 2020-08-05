module.exports = (ctx, next) => {
  const helpMessage = `
*Available Commands*
*/login* - authorize using your twitch account
*/subscribe*, */sub* \`<username>\` - subscribe to stream online notificaions
*/unsubscribe*, */unsub* \`<username>\` - unsubscribe to stream online notificaions
*/subscriptions*, */subs* - get list of active notification subscriptions
*/streaming* \`<username>\` - check if streamer is online
`
  ctx.reply(helpMessage, {
    parse_mode: 'markdown'
  })
}

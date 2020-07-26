const cron = require('node-cron')
const Twitch = require('./twitch')

// Running refresh webhook subscriptions job every 2 hours
cron.schedule('0 0 */2 * * *', () => {
  const twitch = new Twitch()
  twitch.refreshWebhooksSubscriptions().then(data => {
    console.log(new Date(), data)
  })
})

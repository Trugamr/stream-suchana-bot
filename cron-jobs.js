const cron = require('node-cron')
const Twitch = require('./twitch')
const { deleteOldNotifications } = require('./utils')

// Running refresh webhook subscriptions job every 4 hours
cron.schedule('0 0 */4 * * *', () => {
  const twitch = new Twitch()
  twitch.refreshWebhooksSubscriptions().then(data => {
    console.log(new Date(), data)
  })
})

// Clean 24hours old notifications from from database every 1 hours
cron.schedule('0 0 */2 * * *', async () => {
  try {
    const count = await deleteOldNotifications(24)
    console.log(new Date(), `DELETED ${count} OBJECTS FROM DATABASE`)
  } catch (err) {
    console.log(new Date(), err.message)
  }
})

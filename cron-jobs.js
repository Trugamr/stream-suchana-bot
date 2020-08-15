const cron = require('node-cron')
const Twitch = require('./twitch')
const AppData = require('./db/models/appData-model')

// Running refresh webhook subscriptions job every 4 hours
cron.schedule('0 0 */4 * * *', () => {
  const twitch = new Twitch()
  twitch.refreshWebhooksSubscriptions().then(data => {
    console.log(new Date(), data)
  })
})

// Clean delivered notification Ids from database every 20 hours
cron.schedule('0 0 */20 * * *', async () => {
  try {
    await AppData.findOneAndUpdate(
      { _id: 'app_data' },
      {
        $set: { deliveredNotificationIds: [] }
      }
    )

    console.log(new Date(), 'Deleted old notificaion ids from database.')
  } catch (error) {
    console.log(new Date(), 'Failed to delete notification ids from database.')
  }
})

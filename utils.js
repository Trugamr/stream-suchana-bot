const Streamer = require('./db/models/streamer-model')
const Notification = require('./db/models/notification-model')
const qs = require('querystring')
const _ = require('lodash')

// Utility Functions

// Split and send args without first argument, useful for commands
exports.getArgs = (string, withInitial = false) =>
  string.split(' ').splice(withInitial ? 0 : 1)

// Utility function to add commas to numbers
// Example -> 23456, 23,456
exports.addSeprator = value => {
  let nums = value.replace(/,/g, '')
  if (!nums) return
  return parseInt(nums).toLocaleString()
}

// Get hours, minutes passed
// Date in string
exports.getHoursMin = string => {
  const message = []
  const milliseconds = Math.floor((new Date() - new Date(string)) / 1000)
  let minutes = Math.floor(milliseconds / 60)
  const hours = Math.floor(minutes / 60)
  minutes -= hours * 60
  if (hours) message.push(`${hours}${hours > 1 ? 'hrs' : 'hr'}`)
  if (minutes) message.push(`${minutes}${minutes > 1 ? 'mins' : 'min'}`)
  if (hours == 0 && minutes == 0) message.push('few seconds')
  return message.join(' ')
}

// Return streamer ids to refresh
exports.getWebhookRefreshIds = async webhooks => {
  try {
    webhooks = webhooks.map(webhook => {
      const { user_id } = qs.parse(webhook.topic.split('?')[1])
      const secondsToExpire =
        Math.round(new Date(webhook.expires_at) / 1000) -
        Math.round(new Date() / 1000)

      return {
        ...webhook,
        user_id: parseInt(user_id),
        expires_in: parseInt(secondsToExpire)
      }
    })

    // streamerIds
    const streamerIds = webhooks.map(webhook => webhook.user_id)

    // Get all streamers from db that have atleast 1 subscriber
    const streamers = await Streamer.find({
      // Returns streamers with atlease 1 subscriber
      'subscribers.0': { $exists: true }
    })

    const storedStreamerIds = streamers.map(streamer => streamer.streamerId)

    // Webhooks that are expiring in less than 5400 [1hr 30min]
    const expiringStreamerIds = webhooks
      .filter(webhook => webhook.expires_in < 5400)
      .map(webhook => webhook.user_id)

    // streamers in db who don't have a webhook subscription [rare edge case]
    const missingStreamerIds = _.difference(storedStreamerIds, streamerIds)

    const refreshStreamerIds = [...expiringStreamerIds, ...missingStreamerIds]

    return refreshStreamerIds
  } catch (err) {
    throw err
  }
}

// Delete notification documents that were created atleast 24hrs ago
exports.deleteOldNotifications = async (hours = 24) => {
  let expireDate = new Date()
  expireDate.setHours(expireDate.getHours() - hours)

  try {
    const notifications = await Notification.deleteMany({
      $expr: {
        $lte: [{ $toDate: '$_id' }, expireDate]
      }
    })
    return notifications.deletedCount
  } catch (err) {
    throw new Error(`Failed to delete notifications from db: ${err.message} `)
  }
}

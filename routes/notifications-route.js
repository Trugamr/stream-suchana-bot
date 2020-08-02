const express = require('express')
const axios = require('axios')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const rateLimit = require('axios-rate-limit')
const Streamer = require('../db/models/streamer-model')
const { getHoursMin, addSeprator } = require('../utils')
const AppData = require('../db/models/appData-model')

const { TELEGRAM_BOT_TOKEN, SHA256_SECRET } = process.env

// Max requests sent at a single time 5 after that every request is sent after 200ms
const rateLimitedAxios = rateLimit(axios.create(), {
  maxRequests: 5,
  perMilliseconds: 200
})

const router = express.Router()

// Verifying that webhook subsciption request or notification came from twitch
router.use(
  bodyParser.json({
    extended: true,
    verify: (req, res, buf, encoding) => {
      // is there a hub to verify against
      req.twitch_hub = false
      if (req.headers && req.headers['x-hub-signature']) {
        req.twitch_hub = true

        let xHub = req.headers['x-hub-signature'].split('=')

        req.twitch_hex = crypto
          .createHmac(xHub[0], SHA256_SECRET)
          .update(buf)
          .digest('hex')
        req.twitch_signature = xHub[1]
      }
    }
  })
)

// Gets request from subscribed webhook when stream's state is changed
router.get('/stream/:user_id', (req, res) => {
  console.log('[GET] GOT CHALLENGE')
  // Echo back challenge token in plain text
  res.send(req.query['hub.challenge'])
})

// Twitch send notifications about streamer status on this route
// Request body is empty for streamer offline notification
router.post('/stream/:user_id', async (req, res) => {
  // Acknowledge notification
  res.status(200).end()

  // Verify if notification came from twitch
  if (req.twitch_hub && req.twitch_hex == req.twitch_signature) {
    console.log('VERIFIED NOTIFICATION')
  } else {
    return console.log('FAILED TO VERIFY HASH', req)
  }

  // If no data then streamer went offline
  if (!req.body.data.length)
    return console.log(`${req.params.user_id} WENT OFFLINE`)
  console.log('[POST] GOT NOTIFIED', req.body.data[0].user_name, req)
  try {
    const {
      id,
      started_at,
      thumbnail_url,
      title,
      user_id,
      game_id,
      viewer_count,
      user_name,
      type
    } = req.body['data'][0]

    const message = `
*${user_name} STARTED STREAMING*

Title: *${title}*
Started streaming *${getHoursMin(started_at)}* ago
Viewers: *${addSeprator(viewer_count.toString())}*

[${user_name} ](https://twitch.tv/${user_name})
`
    const appData = await AppData.findOne({ _id: 'app_data' })
    if (!appData) {
      const newAppData = new AppData({
        _id: 'app_data',
        deliveredNotificationIds: [id]
        // deliveredNotificationIds: req.headers['twitch-notification-id']
      })
      await newAppData.save()
    } else {
      // Maybe unsubscribing from all then resub to webhooks may fix this
      // Update and check result for modified documents, if modified means notification is new
      // Using stream id instead of twitch-notification-id because of duplicate notifications maybe due to webhook refreshes
      const result = await AppData.updateOne(
        { _id: 'app_data' },
        {
          $addToSet: {
            deliveredNotificationIds: id
            // deliveredNotificationIds: req.headers['twitch-notification-id']
          }
        }
      )
      if (!result.nModified) {
        return console.log('DUPLICATE NOTIFICATION - NOT DELIVERING')
      }
    }

    // Send telegram message to all the subscribers
    // Get all subscribers from db
    const streamer = await Streamer.findOne({ streamerId: user_id })
    if (streamer) {
      const subscribers = streamer.subscribers
      //TODO: Map and use Promse.all instead
      subscribers.forEach(subscriber => {
        rateLimitedAxios({
          method: 'GET',
          url: `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          params: {
            chat_id: subscriber.telegramChatId,
            text: message,
            parse_mode: 'markdown'
          }
        })
          .then(() => {
            'NOTIFICATION SENT'
          })
          .catch(error => console.log('FAILED TO SEND NOTIFICATION', error))
      })
    }
  } catch (error) {
    console.log(error)
  }
  // Acknowledge notification by sending 2xx response
  res.status(200).end()
})

router.get('/test', (req, res) => {
  console.log('[TEST]', req)
})

module.exports = router

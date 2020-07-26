const express = require('express')
const axios = require('axios')
const rateLimit = require('axios-rate-limit')
const Streamer = require('../db/models/streamer-model')
const { getHoursMin, addSeprator } = require('../utils')

const { TELEGRAM_BOT_TOKEN } = process.env

// Max requests sent at a single time 5 after that every request is sent after 200ms
const rateLimitedAxios = rateLimit(axios.create(), {
  maxRequests: 5,
  perMilliseconds: 200
})

const router = express.Router()

// Gets request from subscribed webhook when stream's state is changed
// TODO: Verify integrity of notification
router.get('/stream/:user_id', (req, res) => {
  console.log('[GET] GOT CHALLENGE')
  // Echo back challenge token in plain text
  res.send(req.query['hub.challenge'])
})

// Twitch send notifications about streamer status on this route
// Request body is empty for streamer offline notification
router.post('/stream/:user_id', async (req, res) => {
  // If no data then streamer went offline
  if (!req.body.data.length)
    return console.log(`${req.params.user_id} WENT OFFLINE`)
  console.log('[POST] GOT NOTIFIED', req)
  try {
    const {
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
    // Send telegram message to all the subscribers
    // Get all subscribers from db
    const streamer = await Streamer.findOne({ streamerId: user_id })
    if (streamer) {
      const subscribers = streamer.subscribers
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

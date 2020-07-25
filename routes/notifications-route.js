const express = require('express')

const { getHoursMin } = require('../utils')

const router = express.Router()

// Gets request from subscribed webhook when stream's state is changed
// TODO: Verify integrity of notification
router.get('/stream/:user_id', (req, res) => {
  console.log('[GET] GOT CHALLENGE', req)
  // Echo back challenge token in plain text
  res.send(req.query['hub.challenge'])
})

// Twitch send notifications about streamer status on this route
// Request body is empty for streamer offline notification
router.post('/stream/:user_id', (req, res) => {
  console.log(
    `${req.params.user_id} ${
      req.body.data.length ? 'started streaming' : 'went offline'
    }`
  )
  console.log('[POST] GOT NOTIFIED', req)
  // TODO: Got the notification about streamer coming online, notify subscribers now
  try {
    // const {
    //   started_at,
    //   thumbnail_url,
    //   title,
    //   user_id,
    //   game_id,
    //   viewer_count,
    //   user_name,
    //   type
    // } = req.body['data'][0]
    // const message = `
    // Title: *${title}*
    // Started streaming *${getHoursMin(started_at)}* ago
    // Viewers: *${addSeprator(viewer_count.toString())}*
    // [${user_name} ](https://twitch.tv/${user_name})`
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

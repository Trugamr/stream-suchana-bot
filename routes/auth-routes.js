const express = require('express')
const passport = require('passport')
const router = express.Router()
const url = require('url')

router.get('/twitch', (req, res, next) => {
  // /twitch?session=telegram_session_id
  // session string is randomly generated at time of generating login url for user
  // session string is how to find which telegram user is trying to authenticate using twitch
  const { session } = req.query

  if (!session)
    return res.json({
      message: 'No telegram session id specified.'
    })

  passport.authenticate('twitch', {
    scope: 'user_read',
    state: session
  })(req, res, next)
})

router.get('/twitch/callback', passport.authenticate('twitch'), (req, res) => {
  res.json({
    user: req.user,
    ...req.query
  })
})

module.exports = router

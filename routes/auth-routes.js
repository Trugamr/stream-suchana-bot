const express = require('express')
const passport = require('passport')
const router = express.Router()
const url = require('url')

router.get(
  '/twitch',
  passport.authenticate('twitch', {
    scope: 'user_read'
  })
)

router.get('/twitch/callback', passport.authenticate('twitch'), (req, res) => {
  res.json({
    user: req.user
  })
})

module.exports = router

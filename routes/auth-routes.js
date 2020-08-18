const express = require('express')
const passport = require('passport')
const router = express.Router()

const User = require('../db/models/user-model')

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

router.get(
  '/twitch/callback',
  passport.authenticate('twitch'),
  async (req, res) => {
    // User info and tokens are sent with req
    // Update twitch info for user in db using the session identifier
    const {
      id,
      display_name,
      login,
      profile_image_url,
      accessToken,
      refreshToken
    } = req.user
    const { scope, code, state } = req.query

    // Validating session
    try {
      // Date in unix epoch
      const currentDate = Math.floor(new Date() / 1000)
      const currentUser = await User.findOne({ 'session.identifier': state })
      if (currentUser) {
        const { session } = currentUser
        // Session Expired
        if (session.expiresAt < currentDate) {
          return res.render('error', {
            success: false,
            message: 'Session expired. Try authenticating again.'
          })
        }
      } else {
        // User with session identifier not found
        return res.render('error', {
          success: false,
          message: 'Invalid session identifier.'
        })
      }
    } catch (error) {
      console.log(error)
    }

    // Finding and updating user based on the session identifier
    try {
      const currentUser = await User.findOneAndUpdate(
        { 'session.identifier': state },
        {
          twitch: {
            twitchId: id,
            username: login,
            displayName: display_name,
            profileImageURL: profile_image_url,
            accessToken,
            refreshToken,
            code,
            scope
          }
        },
        // To get updated document
        { new: true }
      )

      res.render('profile', {
        user: {
          profile_image_url,
          display_name,
          login
        }
      })

      console.log('AUTENTICATED SUCCESSFULLY', currentUser)
    } catch (error) {
      console.log(error)
      res.render('error', {
        success: false,
        message: 'Failed to autenticate using twitch.'
      })
    }
  }
)

module.exports = router

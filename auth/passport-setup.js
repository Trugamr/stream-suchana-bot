const axios = require('axios')
const passport = require('passport')
const { query } = require('express')
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  done(null, user)
})

// Override passport profile function to get user profile from Twitch API
OAuth2Strategy.prototype.userProfile = (accessToken, done) => {
  const options = {
    method: 'GET',
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      Accept: 'application/vnd.twitchtv.v5+json',
      Authorization: 'Bearer ' + accessToken
    },
    url: 'https://api.twitch.tv/helix/users'
  }

  axios(options).then(response => {
    if (response.data.data) {
      done(null, response.data.data[0])
    } else {
      done(response.data)
    }
  })
}

passport.use(
  'twitch',
  new OAuth2Strategy(
    {
      authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
      tokenURL: 'https://id.twitch.tv/oauth2/token',
      clientID: TWITCH_CLIENT_ID,
      clientSecret: TWITCH_CLIENT_SECRET,
      callbackURL: '/auth/twitch/callback',
      passReqToCallback: true
    },
    (req, accessToken, refreshToken, profile, done) => {
      profile.accessToken = accessToken
      profile.refreshToken = refreshToken
      done(null, profile)
    }
  )
)

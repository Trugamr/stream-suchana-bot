const axios = require('axios').default
const { default: createAuthRefreshInterceptor } = require('axios-auth-refresh')

const User = require('./db/models/user-model')

const BASE_URL = 'https://api.twitch.tv/helix'

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_REDIRECT_URI,
  SITE_URL
} = process.env

class Twitch {
  accessToken = null
  refreshToken = null
  // axios instance
  twitch = null

  constructor(tokenData = {}) {
    const { accessToken, refreshToken } = tokenData
    this.accessToken = accessToken
    this.refreshToken = refreshToken

    // Creating custom axios instance with default headers and base url
    this.twitch = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        Accept: 'application/vnd.twitchtv.v5+json'
      }
    })

    // Creating auth refresh logic to automatically refresh auth token on failed (401) req
    const refreshAuthLogic = failedRequest =>
      this.twitch
        .post('https://id.twitch.tv/oauth2/token', null, {
          params: {
            grant_type: 'refresh_token',
            client_secret: TWITCH_CLIENT_SECRET,
            client_id: TWITCH_CLIENT_ID,
            refresh_token: this.refreshToken
          }
        })
        .then(async tokenRefreshResponse => {
          console.log('ACCESS TOKEN REFRESH')
          const refreshedAccessToken = tokenRefreshResponse.data.access_token
          // Updating access token in database
          // TODO: Switch this to use twitch id instead of refresh token in future
          try {
            await User.findOneAndUpdate(
              { 'twitch.refreshToken': this.refreshToken },
              {
                $set: { 'twitch.accessToken': refreshedAccessToken }
              }
            )
          } catch (error) {
            console.log(error)
          }

          // Adding new access token as header for new request
          failedRequest.response.config.headers['Authorization'] =
            'Bearer ' + refreshedAccessToken

          return Promise.resolve()
        })
        .catch(error => {
          console.log(
            'REFRESH TOKEN IS INVALID, REMOVING TWITCH INFO FROM USER PROFILE'
          )
          User.findOneAndUpdate(
            { 'twitch.refreshToken': this.refreshToken },
            { $unset: { twitch: '' } }
          )
            .then(() => console.log('REMOVED TWITCH INFO FOR USER'))
            .catch(error => console.log(error))

          return Promise.reject()
        })

    createAuthRefreshInterceptor(this.twitch, refreshAuthLogic)
  }

  // Get user info by twitch username [REQUIRES AUTH]
  userInfo = async username => {
    try {
      const response = await this.twitch({
        url: '/users',
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        },
        params: {
          login: username
        }
      })
      const data = response.data
      const user = data.data[0]
      if (user) return user
      else
        throw {
          status: 'failed',
          message: `No users found with username ${username}`
        }
    } catch (error) {
      throw error
    }
  }

  // Get streaming info for user
  streamingInfo = async username => {
    try {
      const response = await this.twitch({
        method: 'GET',
        url: '/streams',
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        },
        params: {
          user_login: username
        }
      })

      if (response.data.data.length) {
        return {
          live: true,
          ...response.data.data[0]
        }
      } else {
        return {
          live: false
        }
      }
    } catch (error) {
      throw error
    }
  }

  // Get app access token, diff from user access token
  // Needed to check webhook subscriptions
  getAppToken = async () => {
    try {
      const response = await axios({
        method: 'POST',
        url: 'https://id.twitch.tv/oauth2/token',
        params: {
          client_id: TWITCH_CLIENT_ID,
          client_secret: TWITCH_CLIENT_SECRET,
          grant_type: 'client_credentials'
        }
      })

      return response.data
    } catch (error) {
      throw error
    }
  }

  // Get webhook subscriptions
  // TODO: save  token in db, if req fails then only refresh token
  getWebhookSubscriptions = async () => {
    try {
      const { access_token } = await this.getAppToken()
      const response = await axios({
        method: 'GET',
        url: 'https://api.twitch.tv/helix/webhooks/subscriptions',
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          Authorization: `Bearer ${access_token} `
        }
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Subscribe to streamer status using streamer user_id
  // Streamer id needs to be verified before
  subscribeToStreamer = async streamerId => {
    try {
      const response = await this.twitch({
        method: 'POST',
        url: 'https://api.twitch.tv/helix/webhooks/hub',
        data: {
          'hub.callback': `${SITE_URL}/notifications/stream/${streamerId}`,
          'hub.mode': 'subscribe',
          'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${streamerId}`,
          'hub.lease_seconds': 36000
        },
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          Authorization: `Bearer ${this.accessToken}`
        }
      })
      return response
    } catch (error) {
      throw error
    }
  }
}

module.exports = Twitch

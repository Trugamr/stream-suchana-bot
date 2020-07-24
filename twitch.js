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

  // Subscribe to stream notification
  subscribeStream = async username => {
    try {
      // First get userinfo to confirm streamer exists
      const streamer = await this.userInfo(username)
      const { id, login } = streamer
      // TODO
      // Check if someone has already subscribed to this streamer in subscriptions collection
      // If yes then add streamer username and id to user subscriptions array
      // If no then subscribe to notifications and add it to subcriptions collection and then to user subscriptions array
    } catch (error) {
      throw error
    }

    // this.twitch({
    //   method: 'POST',
    //   data: {
    //     'hub.callback': `${SITE_URL}/notifications/stream`,
    //     'hub.mode': 'subscribe',
    //     'hub.topic': `https://api.twitch.tv/helix/streams?user_login=${username}`,
    //     // 2
    //     'hub.lease_seconds': 172800
    //   }
    // })
  }
}

module.exports = Twitch

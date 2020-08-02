const axios = require('axios').default
const rateLimit = require('axios-rate-limit')
const { default: createAuthRefreshInterceptor } = require('axios-auth-refresh')

const User = require('./db/models/user-model')
const Streamer = require('./db/models/streamer-model')
const AppData = require('./db/models/appData-model')

const BASE_URL = 'https://api.twitch.tv/helix'

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_REDIRECT_URI,
  SITE_URL,
  SHA256_SECRET
} = process.env

class Twitch {
  appAccessToken = null
  accessToken = null
  refreshToken = null
  // axios instance
  twitch = null
  twitchApp = null

  constructor(tokenData = {}) {
    const { appAccessToken, accessToken, refreshToken } = tokenData
    this.appAccessToken = appAccessToken
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
    // For user tokens
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

    // Creating axios instance for requests using app access token
    // TODO: Save access token in db so it wont be requested everytime
    this.twitchApp = axios.create({
      baseURL: 'https://api.twitch.tv/helix/webhooks/subscriptions',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        Authorization: `Bearer ${this.appAccessToken}`
      }
    })

    // Creating auth refresh logic to automatically refresh auth token on failed (401) req
    // For user tokens
    const refreshAppAuthLogic = failedRequest =>
      this.twitchApp
        .post('https://id.twitch.tv/oauth2/token', null, {
          params: {
            grant_type: 'client_credentials',
            client_secret: TWITCH_CLIENT_SECRET,
            client_id: TWITCH_CLIENT_ID
          }
        })
        .then(async tokenRefreshResponse => {
          console.log('APP ACCESS TOKEN REFRESH', tokenRefreshResponse.data)
          const { access_token } = tokenRefreshResponse.data

          this.appAccessToken = access_token
          // TODO: saving but not using anywhere
          // const appData = await AppData.findOne({ _id: 'app_data' })
          // if (!appData) {
          //   const newAppData = new AppData({
          //     _id: 'app_data',
          //     appAccessToken: access_token
          //   })
          //   await newAppData.save()
          // } else {
          //   await AppData.updateOne(
          //     { _id: 'app_data' },
          //     {
          //       _id: 'app_data',
          //       appAccessToken: access_token
          //     }
          //   )
          // }

          // Adding new app access token as header for new request
          failedRequest.response.config.headers['Authorization'] =
            'Bearer ' + access_token

          return Promise.resolve()
        })
        .catch(error => {
          console.log(error)
          return Promise.reject()
        })

    createAuthRefreshInterceptor(this.twitchApp, refreshAppAuthLogic)
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

  // Get multiple users info by twitch id or usernames array
  multipleUserInfo = async (usersArr, options = { type: 'id' }) => {
    let queryParams = ''

    if (options.type == 'id') {
      queryParams = usersArr.map(userId => `id=${userId}`).join('&')
    } else if (options.type == 'login') {
      queryParams = usersArr.map(userLogin => `login=${userLogin}`).join('&')
    }

    try {
      const response = await this.twitch({
        url: `/users?${queryParams}`,
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      })
      return response.data.data
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

  // Get webhook subscriptions
  // TODO: save  token in db, if req fails then only refresh token
  // Cursor to get next page of subscriptions
  getWebhookSubscriptions = async ({ cursor } = {}) => {
    const webhookSubscriptions = []
    try {
      const response = await this.twitchApp({
        method: 'GET',
        url: 'https://api.twitch.tv/helix/webhooks/subscriptions',
        params: {
          first: 100,
          after: cursor ? cursor : null
        }
      })
      webhookSubscriptions.push(...response.data.data)

      if (response.data.pagination && response.data.pagination.cursor) {
        const moreSubscriptions = await this.getWebhookSubscriptions({
          cursor: response.data.pagination.cursor
        })
        webhookSubscriptions.push(...moreSubscriptions)
      }
    } catch (error) {
      throw error
    }

    return webhookSubscriptions
  }

  // Subscribe to streamer status using streamer user_id
  // Streamer id needs to be verified before
  subscribeToStreamer = async streamerId => {
    try {
      const response = await this.twitchApp({
        method: 'POST',
        url: 'https://api.twitch.tv/helix/webhooks/hub',
        data: {
          'hub.callback': `${SITE_URL}/notifications/stream/${streamerId}`,
          'hub.mode': 'subscribe',
          'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${streamerId}`,
          'hub.lease_seconds': 36000,
          'hub.secret': SHA256_SECRET
        }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  // Unsubscribe to webhook in case no one is subscribed to streamer anymore
  unsubscribeToStreamer = async streamerId => {
    try {
      const response = await this.twitchApp({
        method: 'POST',
        url: 'https://api.twitch.tv/helix/webhooks/hub',
        data: {
          'hub.callback': `${SITE_URL}/notifications/stream/${streamerId}`,
          'hub.mode': 'unsubscribe',
          'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${streamerId}`
        }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  // Get app access token, diff from user access token
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

  // Unsubscribe from all webhooks
  unsubscribeFromAllWebhooks = async () => {
    // Max requests sent at a single time 1 after that every request is sent after 200ms
    const rateLimitedAxios = rateLimit(this.twitchApp, {
      maxRequests: 1,
      perMilliseconds: 200
    })

    try {
      // Get app access token, axios interceptor is not working for multiple failed requests
      const { access_token } = await this.getAppToken()

      // Get all subscriptions
      const subscriptions = await this.getWebhookSubscriptions()
      const responses = subscriptions.map(subscription => {
        const { topic, callback, expires_at } = subscription
        return rateLimitedAxios({
          method: 'POST',
          url: 'https://api.twitch.tv/helix/webhooks/hub',
          headers: { Authorization: `Bearer ${access_token}` },
          data: {
            'hub.topic': topic,
            'hub.mode': 'unsubscribe',
            'hub.callback': callback
          }
        })
      })

      await Promise.all(responses)
      return {
        status: 'success',
        message: 'Unsubscribed from all subscriptions'
      }
    } catch (error) {
      throw error
    }
  }

  // Refresh All Webhooks
  refreshWebhooksSubscriptions = async () => {
    const rateLimitedAxios = rateLimit(this.twitchApp, {
      maxRequests: 1,
      perMilliseconds: 1000
    })

    try {
      // Get app access token, axios interceptor is not working for multiple failed requests
      const { access_token } = await this.getAppToken()
      console.log(access_token)

      // Get all streamers from db that have atleast 1 subscriber
      const streamers = await Streamer.find({
        // Returns streamers with atlease 1 subscriber
        'subscribers.0': { $exists: true }
      })
      const responses = streamers.map(streamer => {
        const { streamerId } = streamer
        return rateLimitedAxios({
          method: 'POST',
          url: 'https://api.twitch.tv/helix/webhooks/hub',
          headers: { Authorization: `Bearer ${access_token}` },
          data: {
            'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${streamerId}`,
            'hub.callback': `${SITE_URL}/notifications/stream/${streamerId} `,
            'hub.mode': 'subscribe',
            'hub.lease_seconds': 86400,
            'hub.secret': SHA256_SECRET
          }
        })
      })

      await Promise.all(responses)
      return {
        status: 'success',
        message: 'Refreshed all subscriptions'
      }
    } catch (error) {
      throw error
    }
  }
}

module.exports = Twitch

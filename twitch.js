const axios = require('axios').default

const BASE_URL = 'https://api.twitch.tv/kraken'
const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_REDIRECT_URI
} = process.env

// https://id.twitch.tv/oauth2/authorize?client_id=gst0ggrd0rb4esyksurabibbgfi2nv&redirect_uri=http://localhost:3000/auth/twitch/callback&response_type=code&scope=user:read:email+channel_read&state=TG_ID_HERE

class Twitch {
  code = null
  scope = null
  state = null
  tokenData = {}
  // tokenData: {
  //   access_token: '43rxqzz93ummlwhwwu4ke47r3kxihm',
  //   expires_in: 14680,
  //   refresh_token: 'et8cwtww7f9c57jdtgmmzlxbvx5fiypqeagac25tp6spq0bwff',
  //   scope: [ 'user:read:email' ],
  //   token_type: 'bearer'
  // }

  constructor(options = {}) {
    const { code, scope, state } = options
    this.code = code
    this.scope = scope
    this.state = state
  }

  twitch = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      Accept: 'application/vnd.twitchtv.v5+json'
    }
  })

  // Get user access token
  getAccessToken = () => {
    return new Promise((resolve, reject) => {
      axios
        .post(' https://id.twitch.tv/oauth2/token', null, {
          params: {
            client_id: TWITCH_CLIENT_ID,
            code: this.code,
            client_secret: TWITCH_CLIENT_SECRET,
            redirect_uri: TWITCH_REDIRECT_URI,
            grant_type: 'authorization_code'
          }
        })
        .then(response => {
          if (response.data.access_token) {
            this.tokenData = response.data
            console.log(response.data)
          } else reject({ message: 'Failed to get access token.' })
          resolve(response.data)
        })
        .catch(error => reject(error))
    })
  }

  // Get channel streaming status by channelID
  // Resolve to stream data if streaming else reject
  isChannelStreamingById = channelID => {
    return new Promise((resolve, reject) => {})
  }

  // Get channels according to search query
  searchChannels = (searchQuery, limit = 4) => {
    return new Promise((resolve, reject) => {})
  }

  // Get streaming status for channel by name
  // Fuzzy search then select the first result
  isChannelStreamingByName = channelName => {
    return new Promise((resolve, reject) => {})
  }
}

module.exports = Twitch

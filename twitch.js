const axios = require('axios').default
const BASE_URL = 'https://api.twitch.tv/kraken'
const { TWITCH_CLIENT_ID } = process.env

const twitch = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Client-ID': TWITCH_CLIENT_ID,
    Accept: 'application/vnd.twitchtv.v5+json'
  }
})

// Get channel streaming status by channelID
// Resolve to stream data if streaming else reject
exports.isStreamingById = channelID => {
  return new Promise((resolve, reject) => {
    twitch
      .get(`/streams/${channelID}`)
      .then(response => {
        const { stream } = response.data
        if (stream) resolve(stream)
        else reject({ message: 'This channel is not currently streaming.' })
      })
      .catch(error => {
        console.log(error)
        reject({
          message: 'Failed to get streaming status for channel you selected.'
        })
      })
  })
}

// Get channels according to search query
exports.searchChannels = (searchQuery, limit = 4) => {
  return new Promise((resolve, reject) => {
    twitch
      .get(`/search/channels`, {
        params: { query: encodeURI(searchQuery), limit }
      })
      .then(response => resolve(response.data))
      .catch(error => reject(error))
  })
}

// Get streaming status for channel by name
// Fuzzy search then select the first result
exports.isStreamingByName = channelName => {
  return new Promise((resolve, reject) => {
    this.searchChannels(channelName, 1)
      .then(data => {
        const { channels } = data
        if (channels.length) return channels[0]
        else reject({ message: 'Failed to find channel with specified name' })
      }) // select first channel from results
      .then(channel => this.isStreamingById(channel._id))
      .then(stream => resolve(stream))
      .catch(error => {
        reject(error)
      })
  })
}

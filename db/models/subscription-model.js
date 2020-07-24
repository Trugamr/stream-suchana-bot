const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Twitch webhook subscription model
const subscriptionModel = new Schema({
  // Streamer to be notified about
  twitchStreamerId: Number,
  // User whose tokens are used for webhook subscriptions
  twitchUserId: Number,
  // Tokens
  accessToken: String,
  refreshToken: String,
  // Unix epoch time
  expiresAt: Number
})

const Subscription = mongoose.model('subscription', subscriptionModel)

module.exports = Subscription

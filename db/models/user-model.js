const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  telegram: {
    chatId: Number,
    username: String,
    firstName: String
  },
  session: {
    identifier: String,
    // Unix epoch time
    expiresAt: Number
  },
  twitch: {
    twitchId: Number,
    username: String,
    displayName: String,
    profileImageURL: String,
    accessToken: String,
    refreshToken: String,
    code: String,
    scope: String
  }
})

const User = mongoose.model('user', userSchema)

module.exports = User

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const streamerModel = new Schema({
  streamerId: Number,
  subscribers: [
    {
      telegramChatId: Number,
      userObjectId: mongoose.Types.ObjectId
    }
  ]
})

const Streamer = new mongoose.model('streamer', streamerModel)

module.exports = Streamer

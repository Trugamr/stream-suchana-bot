const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  notificationId: String,
  streamId: String
})

const Notification = mongoose.model('notification', notificationSchema)

module.exports = Notification

const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  id: String
})

const Notification = mongoose.model('notification', notificationSchema)

module.exports = Notification

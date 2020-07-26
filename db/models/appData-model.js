const mongoose = require('mongoose')
const Schema = mongoose.Schema

const appDataSchema = new Schema(
  {
    _id: String,
    appAccessToken: String
  },
  { collection: 'appData' }
)

const AppData = mongoose.model('appData', appDataSchema)

module.exports = AppData

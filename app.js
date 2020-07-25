require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const passport = require('passport')
const authRoutes = require('./routes/auth-routes')
const notificationsRoutes = require('./routes/notifications-route')
const bot = require('./bot/bot')
const Twitch = require('./twitch')

const { MONGO_DB_URL, MONGO_DB_USERNAME, MONGO_DB_PASSWORD, PORT } = process.env

// TODO: Write better replies to user
// TODO: If refreshToken doesn't work remove twitch info for user as they have deauthorized from the app
// TODO: Maintain streamers collection and users which are subscribed to streamer
// TODO: Get webhook subscriptions and refresh them is they are about to expire, use token of any of the subscribed users

// Passport setup
require('./auth/passport-setup')

const app = express()

// Middlewares setup
// app.use(bodyParser.json())
app.use(bodyParser.json({ extended: true }))
app.use(passport.initialize())

// Databse Connection
mongoose
  .connect(`${MONGO_DB_URL}`, {
    user: MONGO_DB_USERNAME,
    pass: MONGO_DB_PASSWORD,
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(conn => {
    console.log('DB Connection Success.')
  })
  .catch(error => {
    console.log('Failed to connect to database.', error.message)
  })

// Routes setup
app.use('/auth', authRoutes)
app.use('/notifications', notificationsRoutes)

app.get('/', (req, res) => {
  console.log(req)
  res.json({
    message: 'This is made for authenticating with twitch.',
    ...req.query
  })
})

const port = PORT || 3000
app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

const twitch = new Twitch({
  accessToken: 'f8fk0vrg0dmt7gz9xcf2ls35qcj9b2x',
  refreshToken: 'us8m32pnrkr3alizgdvvbj6vwookbb8v1yolj3ws8au0u8dq8z'
})
// twitch
//   .subscribeToStreamer(112603247)
//   .then(data => console.log(data))
//   .catch(error => console.log(error))

// Start polling
bot.launch()

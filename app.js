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
// TODO: Get streamers, check if they have any subscribers then only refresh webhook
// TODO: Find a way to delete subscription if they have disconnected their twitch
// TODO: Only subscribe webhook when creating a new streamer entry
// TODO: Schedule cleaning of delivered notification ID

// Passport setup
require('./auth/passport-setup')

const app = express()

// Middlewares setup
app.use(express.static('public'))
app.set('view engine', 'ejs')
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

// Node cron jobs setup
require('./cron-jobs')

const port = PORT || 3000
app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

const twitch = new Twitch({
  accessToken: 'rdmh4mopb78fanq78qm4t2q62nsvag'
})

// twitch
//   .unsubscribeFromAllWebhooks()
//   .then(data => console.log(data))
//   .catch(error => console.log(error))
// twitch
//   .refreshWebhooksSubscriptions()
//   .then(data => console.log(data))
//   .catch(error => console.log(error))
// twitch
//   .getWebhookSubscriptions()
//   .then(_ => console.log(_.length, _))
//   .catch(error => console.log(error))

// Start polling
bot.launch()

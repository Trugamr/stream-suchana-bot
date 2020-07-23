require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const passport = require('passport')
const authRoutes = require('./routes/auth-routes')
const bot = require('./bot/bot')

const { MONGO_DB_URL, MONGO_DB_USERNAME, MONGO_DB_PASSWORD, PORT } = process.env

// TODO: Write better replies to user

// Passport setup
require('./auth/passport-setup')

const app = express()

// Middlewares setup
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

// Start polling
bot.launch()

require('dotenv').config()

const mongoose = require('mongoose')

const { MONGO_DB_URL, MONGO_DB_USERNAME, MONGO_DB_PASSWORD, PORT } = process.env

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

// Starting telegram BOT
bot.launch()

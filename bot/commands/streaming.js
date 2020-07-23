const User = require('../../db/models/user-model')
const { getArgs } = require('../../utils')

// Streaming command that tells user if streamer is specified username is streaming
// /streaming <username>
module.exports = ctx => {
  console.log(ctx.state)
}

const { v4: uuidv4 } = require('uuid')
const User = require('../../db/models/user-model')

const { SITE_URL } = process.env

// Returns random session identifier and date when session expires
// Default valid session interval 300 seconds
const getSession = (expiresIn = 300) => {
  // Get date in unix epoch time and add seconds until session expires
  const unixTime = Math.floor(new Date() / 1000) + expiresIn
  return {
    identifier: uuidv4(),
    expiresAt: unixTime
  }
}

const loginCommand = async (ctx, next) => {
  const { id, first_name, username } = ctx.from
  const session = getSession()

  try {
    const currentUser = await User.findOne({ 'telegram.chatId': id })
    if (currentUser) {
      // User exits, update session info
      await User.updateOne(
        { 'telegram.chatId': currentUser.telegram.chatId },
        {
          session: {
            identifier: session.identifier,
            expiresAt: session.expiresAt
          }
        }
      )
    } else {
      // User doesn't exist, create new user and session then send authentication url
      const newUser = new User({
        telegram: {
          chatId: id,
          firstName: first_name,
          username
        },
        session: {
          identifier: session.identifier,
          expiresAt: session.expiresAt
        }
      })

      // Send user twitch auth link with unique session id
      // Handle twitch info in auth-routes
      // Validate session and update twitch info for user

      await newUser.save()
    }
  } catch (error) {
    console.log('LOGIN_FAILED', error)
  }

  // TODO: make link clickable
  ctx.reply(
    `
*Authenticate using Twitch*
${SITE_URL}/auth/twitch?session=${session.identifier}
`,
    { parse_mode: 'markdown' }
  )
}

module.exports = loginCommand

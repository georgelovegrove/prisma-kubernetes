const jwt = require('jsonwebtoken')

function getUserId(ctx) {
  let authorization = ctx.request ? ctx.request.get('authorization') : null

  // NOTE: Get from subscription connection context
  if (!authorization) {
    authorization = ctx.connection ? ctx.connection.context.Authorization : null
  }

  if (authorization) {
    const token = authorization.replace('Bearer ', '')
    const { userId } = jwt.verify(token, process.env.APP_SECRET)
    return userId
  }

  throw new AuthError()
}

class AuthError extends Error {
  constructor() {
    super('Not authorized')
  }
}

module.exports = {
  getUserId,
  AuthError
}

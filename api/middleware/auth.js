const iResp = require('../utils/response.interface.js')
const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .send(
        iResp.buildErrorResponse(
          403,
          'A token is required for authentication',
          null
        )
      )
  } else {
    try {
      const token = req.headers.authorization
      const decoded = jwt.verify(token, 'secret_key')
      req.user = decoded
    } catch (err) {
      return res
        .status(401)
        .send(iResp.buildErrorResponse(401, 'Invalid token', null))
    }
  }
  return next()
}

const onlyNotaris = (req, res, next) => {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .send(
        iResp.buildErrorResponse(
          403,
          'A token is required for authentication',
          null
        )
      )
  }
  try {
    const token = req.headers.authorization
    const decoded = jwt.verify(token, 'secret_key')
    if (decoded.userType !== 'notaris') {
      return res
        .status(401)
        .send(
          iResp.buildErrorResponse(
            403,
            'Only person from Notaris who can access this',
            null
          )
        )
    } else {
      req.user = decoded
    }
  } catch (err) {
    return res
      .status(401)
      .send(iResp.buildErrorResponse(401, 'Invalid token', null))
  }
  return next()
}

const onlyBank = (req, res, next) => {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .send(
        iResp.buildErrorResponse(
          403,
          'A token is required for authentication',
          null
        )
      )
  }
  try {
    const token = req.headers.authorization
    const decoded = jwt.verify(token, 'secret_key')
    if (decoded.userType !== 'bank') {
      return res
        .status(401)
        .send(
          iResp.buildErrorResponse(
            403,
            'Only person from bank who can access this',
            null
          )
        )
    } else {
      req.user = decoded
    }
  } catch (err) {
    return res
      .status(401)
      .send(iResp.buildErrorResponse(401, 'Invalid token', null))
  }
  return next()
}

const onlyBankAndNotaris = (req, res, next) => {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .send(
        iResp.buildErrorResponse(
          403,
          'A token is required for authentication',
          null
        )
      )
  }
  try {
    const token = req.headers.authorization
    const decoded = jwt.verify(token, 'secret_key')
    if (!['bank', 'notaris'].includes(decoded.userType)) {
      return res
        .status(401)
        .send(
          iResp.buildErrorResponse(
            403,
            'Only person from bank/notaris who can access this',
            null
          )
        )
    } else {
      req.user = decoded
    }
  } catch (err) {
    return res
      .status(401)
      .send(iResp.buildErrorResponse(401, 'Invalid token', null))
  }
  return next()
}

const onlyAdminBPN = (req, res, next) => {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .send(
        iResp.buildErrorResponse(
          403,
          'A token is required for authentication',
          null
        )
      )
  }
  try {
    const token = req.headers.authorization
    const decoded = jwt.verify(token, 'secret_key')
    if (decoded.userType !== 'admin-bpn') {
      return res
        .status(401)
        .send(
          iResp.buildErrorResponse(
            403,
            'Only Admin of BPN can access this',
            null
          )
        )
    } else {
      req.user = decoded
    }
  } catch (err) {
    return res
      .status(401)
      .send(iResp.buildErrorResponse(401, 'Invalid token', null))
  }
  return next()
}

const onlyUser = (req, res, next) => {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .send(
        iResp.buildErrorResponse(
          403,
          'A token is required for authentication',
          null
        )
      )
  }
  try {
    const token = req.headers.authorization
    const decoded = jwt.verify(token, 'secret_key')
    if (decoded.userType !== 'user') {
      return res
        .status(401)
        .send(
          iResp.buildErrorResponse(
            403,
            'Only person penjual/pembeli can access this',
            null
          )
        )
    } else {
      req.user = decoded
    }
  } catch (err) {
    return res
      .status(401)
      .send(iResp.buildErrorResponse(401, 'Invalid token', null))
  }
  return next()
}

module.exports = {
  verifyToken,
  onlyAdminBPN,
  onlyBank,
  onlyUser,
  onlyNotaris,
  onlyBankAndNotaris,
}

'use strict'
const iResp = require('../utils/response.interface.js')

const FabricCAServices = require('fabric-ca-client')
const fabric = require('../utils/fabric.js')
const { sendEmail } = require('../utils/mail.js')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { bufferToJson } = require('../utils/converter.js')

const enrollAdmin = async (adminId, adminSecret, organizationName) => {
  try {
    const ccp = await fabric.getCcp(organizationName)

    // Create a new CA client for interacting with the CA.
    const caInfo =
      ccp.certificateAuthorities[
        `ca.${organizationName.toLowerCase()}.example.com`
      ]
    const caTLSCACerts = caInfo.tlsCACerts.pem

    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.causername
    )

    const wallet = await fabric.getWallet(organizationName)

    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get(adminId)
    if (identity) {
      throw new Error(
        'An identity for the admin user "admin" already exists in the wallet'
      )
    }

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await ca.enroll({
      enrollmentID: adminId,
      enrollmentSecret: adminSecret,
    })

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: `${organizationName}MSP`,
      type: 'X.509',
    }
    await wallet.put(adminId, x509Identity)

    return iResp.buildSuccessResponseWithoutData(
      200,
      'Successfully registered admin and imported it into the wallet'
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const registerAdminBpn = async (
  username,
  email,
  organizationName,
  userType
) => {
  try {
    if (organizationName.toLowerCase() !== 'badanpertanahannasional') {
      return iResp.buildErrorResponse(400, 'Invalid organization', null)
    }

    if (userType.toLowerCase() !== 'admin-bpn') {
      return iResp.buildErrorResponse(400, 'Invalid role')
    }

    await createUser(username, email, 'BadanPertanahanNasional', 'admin-bpn')

    const userId = uuidv4()
    invokeRegisterUserCc(
      userId,
      username,
      'BadanPertanahanNasional',
      email,
      'admin-bpn'
    )

    const payload = {
      id: userId,
      username: username,
      email: email,
      userType: 'admin-bpn',
      organizationName: organizationName,
    }
    const token = jwt.sign(payload, 'secret_key', { expiresIn: '2h' })
    payload.token = token

    return iResp.buildSuccessResponse(
      200,
      'Successfully registered admin BPN and imported it into the wallet',
      payload
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const registerUser = async (
  permitUser,
  username,
  email,
  organizationName,
  userType
) => {
  try {
    if (permitUser.userType !== 'admin-bpn') {
      return iResp.buildErrorResponse(
        400,
        'Users can only be registered by Admin BPN'
      )
    }

    await createUser(username, email, organizationName, userType)

    const userId = uuidv4()
    invokeRegisterUserCc(userId, username, organizationName, email, userType)

    const payload = {
      id: userId,
      username: username,
      email: email,
      userType: userType,
      organizationName: organizationName,
    }
    const token = jwt.sign(payload, 'secret_key', { expiresIn: '2h' })
    payload.token = token

    return iResp.buildSuccessResponse(
      200,
      `Successfully registered ${userType} and imported it into the wallet`,
      payload
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const loginUser = async (username, password) => {
  try {
    const walletBPN = await fabric.getWallet('badanpertanahannasional')
    const walletUser = await fabric.getWallet('user')

    const user1 = await walletBPN.get(username)
    const user2 = await walletUser.get(username)
    let organizationName = ''
    if (user1) {
      organizationName = 'badanpertanahannasional'
    } else if (user2) {
      organizationName = 'user'
    } else {
      throw new Error(`User ${username} is not registered yet`)
    }

    // Get user attr
    const userAttrs = await fabric.getUserAttrs(username, organizationName)

    const userPassword = userAttrs.find((e) => e.name == 'password').value
    const userType = userAttrs.find((e) => e.name == 'userType').value

    const network = await fabric.connectToNetwork(
      organizationName,
      'usercontract',
      username
    )

    let result = await network.contract.evaluateTransaction(
      'GetUserByUsername',
      ...[username]
    )

    network.gateway.disconnect()

    result = JSON.parse(result)
    // Compare input password with password in CA
    if (await bcrypt.compare(password, userPassword)) {
      const payload = {
        id: result.id,
        username: username,
        email: result.email,
        userType: userType,
        organizationName: organizationName,
      }

      const token = jwt.sign(payload, 'secret_key', { expiresIn: '2h' })

      payload.token = token
      return iResp.buildSuccessResponse(200, `Successfully Login`, payload)
    } else {
      return iResp.buildErrorResponse(401, 'Invalid Credentials', null)
    }
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const getAllUsers = async (user) => {
  const network = await fabric.connectToNetwork(
    user.organizationName,
    'usercontract',
    user.username
  )

  const result = await network.contract.evaluateTransaction('GetUsers')

  return iResp.buildSuccessResponse(
    200,
    'Sucessfully get all users',
    bufferToJson(result)
  )
}

const getAllRoles = async (user) => {
  const network = await fabric.connectToNetwork(
    user.organizationName,
    'usercontract',
    user.username
  )

  const result = await network.contract.evaluateTransaction('GetAllRoles')

  return iResp.buildSuccessResponse(
    200,
    'Sucessfully get all users with all roles',
    bufferToJson(result)
  )
}

const editEmail = async (user, data) => {
  try {
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'usercontract',
      user.username
    )

    await network.contract.submitTransaction(
      'UpdateUserData',
      ...[user.id, data.email]
    )

    const payload = {
      id: user.id,
      username: user.username,
      email: data.email,
      userType: user.userType,
      organizationName: user.organizationName,
    }

    const token = jwt.sign(payload, 'secret_key', { expiresIn: '2h' })

    payload.token = token

    return iResp.buildSuccessResponse(200, `Successfully Update Email`, payload)
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const editPassword = async (user, data) => {
  try {
    const currentUserAttrs = await fabric.getUserAttrs(
      user.username,
      user.organizationName
    )
    const currentPassword = currentUserAttrs.find(
      (e) => e.name == 'password'
    ).value

    if (!(await bcrypt.compare(data.currentPassword, currentPassword))) {
      return iResp.buildErrorResponse(400, 'Invalid current password', null)
    }

    const ccp = await fabric.getCcp(user.organizationName)
    const wallet = await fabric.getWallet(user.organizationName)

    // Create a new CA client for interacting with the CA.
    const caURL =
      ccp.certificateAuthorities[
        `ca.${user.organizationName.toLowerCase()}.example.com`
      ].url
    const ca = new FabricCAServices(
      caURL,
      undefined,
      `ca-${user.organizationName.toLowerCase()}`
    )

    // Check to see if we've already enrolled the admin user.
    const adminIdentity = await wallet.get('admin')
    if (!adminIdentity) {
      throw new Error('Admin network does not exist')
    }

    // build a user object for authenticating with the CA
    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type)
    const adminUser = await provider.getUserContext(adminIdentity, 'admin')

    // retrieve the registered identity
    const identityService = ca.newIdentityService()
    const encryptedPassword = await bcrypt.hash(data.newPassword, 10)
    const updateObj = {
      affiliation: `${user.organizationName.toLowerCase()}.department1`,
      role: 'client',
      attrs: [
        { name: 'userType', value: user.userType, ecert: true },
        { name: 'password', value: encryptedPassword, ecert: true },
      ],
    }
    identityService.update(user.username, updateObj, adminUser)

    // Get user attr
    const payload = {
      id: user.id,
      username: user.username,
      email: data.email,
      userType: user.userType,
      organizationName: user.organizationName,
    }

    const token = jwt.sign(payload, 'secret_key', { expiresIn: '2h' })

    payload.token = token

    return iResp.buildSuccessResponse(
      200,
      `Successfully Update Password`,
      payload
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

module.exports = {
  enrollAdmin,
  registerAdminBpn,
  registerUser,
  loginUser,
  getAllUsers,
  getAllRoles,
  editEmail,
  editPassword,
}

const createUser = async (username, email, organizationName, userType) => {
  const ccp = await fabric.getCcp(organizationName)

  // Create a new CA client for interacting with the CA.
  const caURL =
    ccp.certificateAuthorities[
      `ca.${organizationName.toLowerCase()}.example.com`
    ].url
  const ca = new FabricCAServices(caURL)

  const wallet = await fabric.getWallet(organizationName)

  const walletBPN = await fabric.getWallet('badanpertanahannasional')
  const walletUser = await fabric.getWallet('user')

  // Check to see if we've already enrolled the user.
  const checkWalletBPN = await walletBPN.get(username)
  if (checkWalletBPN) {
    throw new Error(`An identity for the user ${username} already exists`)
  }

  const checkWalletUser = await walletUser.get(username)
  if (checkWalletUser) {
    throw new Error(`An identity for the user ${username} already exists`)
  }

  // Check to see if we've already enrolled the admin user.
  const adminIdentity = await wallet.get('admin')
  if (!adminIdentity) {
    throw new Error('Admin network does not exist')
  }

  // build a user object for authenticating with the CA
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type)
  const adminUser = await provider.getUserContext(adminIdentity, 'admin')

  // Create random password end encrypted
  const password = crypto.randomBytes(4).toString('hex')
  const encryptedPassword = await bcrypt.hash(password, 10)

  // Register the user, enroll the user, and import the new identity into the wallet.
  const secret = await ca.register(
    {
      affiliation: `${organizationName.toLowerCase()}.department1`,
      enrollmentID: username,
      role: 'client',
      attrs: [
        { name: 'userType', value: userType, ecert: true },
        { name: 'password', value: encryptedPassword, ecert: true },
      ],
    },
    adminUser
  )

  const enrollment = await ca.enroll({
    enrollmentID: username,
    enrollmentSecret: secret,
    attr_reqs: [
      { name: 'userType', optional: false },
      { name: 'password', optional: false },
    ],
  })

  const x509Identity = {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: `${organizationName}MSP`,
    type: 'X.509',
  }
  await wallet.put(username, x509Identity)

  fs.writeFile(
    path.join(process.cwd(), 'wallet', 'user.txt'),
    `${username}~${userType}~${password}\n`,
    { flag: 'a+' },
    (err) => {}
  )

  await sendEmail(email, password)
}

const invokeRegisterUserCc = async (
  userId,
  username,
  organizationName,
  email,
  role
) => {
  const network = await fabric.connectToNetwork(
    organizationName,
    'usercontract',
    username
  )
  await network.contract.submitTransaction(
    'RegisterUser',
    ...[userId, username, email, role]
  )
  network.gateway.disconnect()

  return userId
}
